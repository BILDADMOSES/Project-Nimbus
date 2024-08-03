import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebaseClient'
import Image from 'next/image'
import MessageInput from '@/components/MessageInput'
import UserDetailsSidebar from '@/components/UserDetailsSidebar'

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

const ChatRoom: React.FC<ChatRoomProps> = ({ chatId }) => {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [chatData, setChatData] = useState<ChatData | null>(null)
  const [otherUser, setOtherUser] = useState<UserData | null>(null)
  const [isUserDetailsSidebarOpen, setIsUserDetailsSidebarOpen] = useState(false)
  const [sharedFiles, setSharedFiles] = useState<Message[]>([])
  const lastMessageRef = useRef<HTMLDivElement>(null)

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

    const q = query(collection(db, `chats/${chatId}/messages`), orderBy('timestamp'))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: Message[] = []
      querySnapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() } as Message)
      })
      setMessages(fetchedMessages)
    })

    return () => unsubscribe()
  }, [chatId, session])

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  if (!chatData || !otherUser) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col bg-white"> {/* Changed background to white */}
        <header className="bg-white text-gray-800 p-4 flex items-center space-x-4 border-b">
          <button onClick={() => setIsUserDetailsSidebarOpen(!isUserDetailsSidebarOpen)}>
            <Image
              src={otherUser.image || '/default-avatar.png'}
              alt={otherUser.username}
              width={40}
              height={40}
              className="rounded-full"
            />
          </button>
          <div>
            <h1 className="text-xl font-bold">{otherUser.username}</h1>
            <p className="text-sm text-gray-500">{chatData.type === 'private' ? 'Private Chat' : 'Group'}</p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div 
              key={message.id} 
              className={`chat ${message.senderId === session?.user?.id ? 'chat-end' : 'chat-start'}`}
              ref={index === messages.length - 1 ? lastMessageRef : null}
            >
              <div className={`chat-bubble ${message.senderId === session?.user?.id ? 'bg-[#a060ff]' : 'bg-[#00e4e3]'}`}>
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
                {new Date(message.timestamp?.toDate()).toLocaleString()}
              </div>
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