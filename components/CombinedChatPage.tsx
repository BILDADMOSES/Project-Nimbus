'use client'

import React, { useState } from 'react'
import ChatList from '@/components/ChatList'
import ChatRoom from '@/components/ChatRoom'
import UserInfo from '@/components/UserInfo'

interface CombinedChatPageProps {
  userId: string
}

const CombinedChatPage: React.FC<CombinedChatPageProps> = ({ userId }) => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId)
  }

  return (
    <div className="flex h-screen">
      <div className="w-1/5 border-r bg-gray-100 flex flex-col">
        <UserInfo />
        <ChatList userId={userId} onChatSelect={handleChatSelect} />
      </div>
      <div className="flex-1">
        {selectedChatId ? (
          <ChatRoom chatId={selectedChatId} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  )
}

export default CombinedChatPage