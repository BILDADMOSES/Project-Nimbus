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
  type: 'private' | 'group'
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
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="w-full p-4 flex-1 overflow-y-auto z-index: 0">
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      </div>
      {filteredChats.length === 0 ? (
        <p className="text-gray-500 text-center">No chats found.</p>
      ) : (
        <ul>
          {filteredChats.map(chat => (
            <li key={chat.id} className="mb-2">
              <button 
                onClick={() => onChatSelect(chat.id)} 
                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors duration-200 ease-in-out rounded-lg"
              >
                <div className="flex items-center">
                  <Image
                    src={chat.avatar || '/default-avatar.png'}
                    alt={chat.name || 'Chat'}
                    width={48}
                    height={48}
                    className="rounded-full mr-4"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-gray-900">
                        {chat.name || 'Unnamed Chat'} {chat.type === 'group' && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full ml-2">Group</span>}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(chat.lastMessageTime, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage || 'No messages'}</p>
                  </div>
                </div>
              </button>
              <div className="h-px bg-gray-200 my-2"></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}