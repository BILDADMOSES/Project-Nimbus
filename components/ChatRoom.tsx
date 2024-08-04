import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, where, limit, startAfter, getDocs } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebaseClient'
import Image from 'next/image'
import MessageInput from '@/components/MessageInput'
import UserDetailsSidebar from '@/components/UserDetailsSidebar'
import { format, isToday, isYesterday } from 'date-fns'

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: any;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
}

interface ChatData {
  id: string;
  type: 'private' | 'group';
  name?: string;
  participants: string[];
}

interface UserData {
  id: string;
  username: string;
  email: string;
  image?: string;
}

interface ChatRoomProps {
  chatId: string;
}

const MESSAGES_PER_PAGE = 20

const ChatRoom: React.FC<ChatRoomProps> = ({ chatId }) => {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [chatData, setChatData] = useState<ChatData | null>(null)
  const [otherUser, setOtherUser] = useState<UserData | null>(null)
  const [isUserDetailsSidebarOpen, setIsUserDetailsSidebarOpen] = useState(false)
  const [sharedFiles, setSharedFiles] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const lastMessageRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const loadMoreMessages = useCallback(async () => {
    if (!chatId || !session?.user?.id || !hasMore) return

    const lastMessage = messages[0]
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('timestamp', 'desc'),
      startAfter(lastMessage?.timestamp || new Date()),
      limit(MESSAGES_PER_PAGE)
    )

    const querySnapshot = await getDocs(q)
    const newMessages: Message[] = []
    querySnapshot.forEach((doc) => {
      newMessages.push({ id: doc.id, ...doc.data() } as Message)
    })

    if (newMessages.length < MESSAGES_PER_PAGE) {
      setHasMore(false)
    }

    setMessages(prevMessages => [...newMessages.reverse(), ...prevMessages])
  }, [chatId, session, hasMore, messages])

  useEffect(() => {
    if (!chatId || !session?.user?.id) return

    const fetchChatData = async () => {
      const chatDoc = await getDoc(doc(db, 'chats', chatId))
      if (chatDoc.exists()) {
        const data = chatDoc.data() as ChatData
        if (data.type === 'private') {
          const otherParticipantId = data.participants.find(p => p !== session.user.id)
          if (otherParticipantId) {
            const userDoc = await getDoc(doc(db, 'users', otherParticipantId))
            const userData = userDoc.data() as UserData
            setOtherUser({ id: otherParticipantId, ...userData })
            data.name = userData?.username || "Unknown User"
          }
        }
        setChatData({ id: chatDoc.id, ...data })
      }
    }
    fetchChatData()

    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_PAGE)
    )
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: Message[] = []
      querySnapshot.forEach((doc) => {
        fetchedMessages.unshift({ id: doc.id, ...doc.data() } as Message)
      })
      setMessages(fetchedMessages)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [chatId, session])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreMessages()
        }
      },
      { threshold: 0.1 }
    )
    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMoreMessages, hasMore])

  useEffect(() => {
    const currentObserver = observerRef.current
    const currentLastMessageRef = lastMessageRef.current

    if (messages.length > 0 && currentObserver && currentLastMessageRef) {
      currentObserver.observe(currentLastMessageRef)
    }

    return () => {
      if (currentObserver && currentLastMessageRef) {
        currentObserver.unobserve(currentLastMessageRef)
      }
    }
  }, [messages])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (chatId) {
      const q = query(
        collection(db, `chats/${chatId}/messages`),
        where('type', 'in', ['image', 'file']),
        orderBy('timestamp', 'desc')
      )
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const files: Message[] = []
        querySnapshot.forEach((doc) => {
          files.push({ id: doc.id, ...doc.data() } as Message)
        })
        setSharedFiles(files)
      })
      return () => unsubscribe()
    }
  }, [chatId])

  const sendMessage = async (content: string, file?: File) => {
    if ((!content.trim() && !file) || !session?.user?.id) return

    try {
      let messageData: Partial<Message> = {
        senderId: session.user.id,
        timestamp: serverTimestamp(),
      }

      if (file) {
        const storageRef = ref(storage, `chats/${chatId}/${file.name}`)
        await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(storageRef)

        messageData = {
          ...messageData,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          content: file.name,
          fileUrl: downloadURL,
        }
      } else {
        messageData = {
          ...messageData,
          type: 'text',
          content,
        }
      }

      await addDoc(collection(db, `chats/${chatId}/messages`), messageData)
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  const groupMessagesByDay = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach((message) => {
      const date = message.timestamp?.toDate();
      if (date) {
        const key = format(date, 'yyyy-MM-dd');
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(message);
      }
    });
    return groups;
  };

  const renderDateDivider = (date: Date) => {
    let dateString;
    if (isToday(date)) {
      dateString = 'Today';
    } else if (isYesterday(date)) {
      dateString = 'Yesterday';
    } else {
      dateString = format(date, 'MMMM d, yyyy');
    }
    return (
      <div className="text-center my-4">
        <span className="bg-base-300 text-base-content px-2 py-1 rounded-full text-sm">
          {dateString}
        </span>
      </div>
    );
  };

  const renderUserAvatar = (user: UserData) => {
    if (user.image) {
      return (
        <Image src={user.image} alt={user.username} width={40} height={40} className="rounded-full" />
      )
    } else {
      return (
        <div className="avatar placeholder ">
          <div className="bg-neutral-focus text-neutral-content rounded-full w-10 bg-white">
            <span className="text-xl">{user.username.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      )
    }
  }

  if (isLoading || !chatData || !otherUser) {
    return (
      <div className="fixed inset-0 bg-base-200 bg-opacity-50 backdrop-blur-sm flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    )
  }

  const groupedMessages = groupMessagesByDay(messages)

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col bg-base-100">
        <header className="bg-base-200 text-base-content p-4 flex items-center space-x-4 border-b border-base-300">
          <button onClick={() => setIsUserDetailsSidebarOpen(!isUserDetailsSidebarOpen)}>
            {renderUserAvatar(otherUser)}
          </button>
          <div>
            <h1 className="text-xl font-bold">{otherUser.username}</h1>
            <p className="text-sm text-base-content/70">{chatData.type === 'private' ? 'Private Chat' : 'Group'}</p>
          </div>
        </header>
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {hasMore && (
            <div ref={lastMessageRef} className="text-center my-4">
              <span className="loading loading-dots loading-sm"></span>
            </div>
          )}
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {renderDateDivider(new Date(date))}
              {msgs.map((message) => (
                <div 
                  key={message.id} 
                  className={`chat ${message.senderId === session?.user?.id ? 'chat-end' : 'chat-start'}`}
                >
                  {chatData.type === 'group' && message.senderId !== session?.user?.id && (
                    <div className="chat-image avatar">
                      {renderUserAvatar(otherUser)}
                    </div>
                  )}
                  <div className="chat-header mb-1">
                    {chatData.type === 'group' && message.senderId !== session?.user?.id && (
                      <span className="text-xs font-bold">{otherUser.username}</span>
                    )}
                  </div>
                  <div className={`chat-bubble ${message.senderId === session?.user?.id ? 'chat-bubble-primary' : 'chat-bubble-secondary'}`}>
                    {message.type === 'text' && message.content}
                    {message.type === 'image' && (
                      <Image src={message.fileUrl!} alt="Uploaded image" width={200} height={200} />
                    )}
                    {message.type === 'file' && (
                      <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="link">
                        {message.content}
                      </a>
                    )}
                  </div>
                  <div className="chat-footer opacity-50 text-xs">
                    {format(new Date(message.timestamp?.toDate()), 'h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <MessageInput onSendMessage={sendMessage} />
      </div>
      {isUserDetailsSidebarOpen && (
        <UserDetailsSidebar
            user={otherUser}
            chatType={chatData.type}
            sharedFiles={sharedFiles}
            onClose={() => setIsUserDetailsSidebarOpen(false)}
        />
        )}
    </div>
  )
}

export default ChatRoom