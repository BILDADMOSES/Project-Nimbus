'use client'

import { useState, useEffect } from "react"
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  Firestore
} from "firebase/firestore"
import { db } from "@/lib/firebaseClient"
import { formatDistanceToNow } from 'date-fns'
import { useSession } from "next-auth/react"
import Image from 'next/image'
import { Search } from 'lucide-react'

interface Chat {
  id: string
  name: string
  type: 'private' | 'group' | 'ai'
  lastMessage: string
  lastMessageTime: Date
  participants: string[]
  avatar?: string
}

interface ChatListProps {
  userId: string
  onChatSelect: (chatId: string) => void
}

export default function ChatList({ userId, onChatSelect }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [filteredChats, setFilteredChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { data: session } = useSession()

  useEffect(() => {
    if (!userId) return

    const q = query(
      collection(db as Firestore, "chats"),
      where("participants", "array-contains", userId)
    )
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const chatsPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const chatData = docSnapshot.data() as Chat
        const messagesQuery = query(
          collection(db as Firestore, `chats/${docSnapshot.id}/messages`),
          orderBy("timestamp", "desc"),
          limit(1)
        )
        const messagesSnapshot = await getDocs(messagesQuery)
        const lastMessage = messagesSnapshot.docs[0]?.data()

        let chatName = chatData.name || ""
        let avatar = ''

        if (chatData.type === 'private') {
          const otherParticipantId = chatData.participants.find(p => p !== userId)
          if (otherParticipantId) {
            const userDocRef = doc(db as Firestore, 'users', otherParticipantId)
            const userDocSnap = await getDoc(userDocRef)
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data()
              chatName = userData?.username || "Unknown User"
              avatar = userData?.avatar || ''
            }
          }
        } else if (chatData.type === 'group') {
          chatName = chatData.name || "Unnamed Group"
        } else if (chatData.type === 'ai') {
          chatName = "AI Chat"
        }

        return {
          id: docSnapshot.id,
          name: chatName,
          type: chatData.type,
          lastMessage: lastMessage?.content || "No messages yet",
          lastMessageTime: lastMessage?.timestamp?.toDate() || new Date(),
          participants: chatData.participants,
          avatar: avatar,
        }
      })

      const chatsData = await Promise.all(chatsPromises)
      const sortedChats = chatsData.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime())
      setChats(sortedChats)
      setFilteredChats(sortedChats)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [userId])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredChats(chats)
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase()
      const filtered = chats.filter(chat => {
        const nameMatch = chat.name && typeof chat.name === 'string' && chat.name.toLowerCase().includes(lowerSearchTerm)
        const messageMatch = chat.lastMessage && typeof chat.lastMessage === 'string' && chat.lastMessage.toLowerCase().includes(lowerSearchTerm)
        return nameMatch || messageMatch
      })
      setFilteredChats(filtered)
    }
  }, [searchTerm, chats])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    )
  }

  const getAvatarSVG = (type: 'private' | 'group' | 'ai') => {
    const commonClasses = "h-12 w-12 text-base-content/50 p-2 rounded-full border border-base-content/20"
    if (type === 'private') {
      return (
        <div className={commonClasses}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )
    } else if (type === 'group') {
      return (
        <div className={commonClasses}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      )
    } else {
      return (
        <div className={commonClasses}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      )
    }
  }

  return (
    <div className="w-full p-4 flex-1 overflow-y-auto z-0 bg-base-100">
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-bordered w-full pl-10 pr-4"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" size={20} />
      </div>
      {filteredChats.length === 0 ? (
        <p className="text-base-content/70 text-center">No chats found.</p>
      ) : (
        <ul>
          {filteredChats.map(chat => (
            <li key={chat.id} className="mb-2">
              <button 
                onClick={() => onChatSelect(chat.id)} 
                className="w-full text-left px-4 py-3 hover:bg-base-200 transition-colors duration-200 ease-in-out rounded-lg"
              >
                <div className="flex items-center">
                  {chat.avatar ? (
                    <Image
                      src={chat.avatar}
                      alt={chat.name || 'Chat'}
                      width={48}
                      height={48}
                      className="rounded-full mr-4"
                    />
                  ) : (
                    <div className="mr-4">
                      {getAvatarSVG(chat.type)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-base-content">
                        {chat.name || 'Unnamed Chat'} 
                        {chat.type === 'group' && <span className="badge badge-sm badge-outline ml-2">Group</span>}
                        {chat.type === 'ai' && <span className="badge badge-sm badge-primary ml-2">AI</span>}
                      </span>
                      <span className="text-xs text-base-content/70">
                        {formatDistanceToNow(chat.lastMessageTime, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-base-content/70 truncate">{chat.lastMessage || 'No messages'}</p>
                  </div>
                </div>
              </button>
              <div className="divider my-2"></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}