import React from 'react'
import Image from 'next/image'
import { ChatData, UserData } from '@/types'

interface ChatHeaderProps {
  chatData: ChatData;
  participants: {[key: string]: UserData};
  currentUserId: string | undefined;
  onOpenSidebar: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ chatData, participants, currentUserId, onOpenSidebar }) => {
  const renderUserAvatar = (userId: string) => {
    const user = participants[userId]
    if (!user) return null

    if (user.image) {
      return (
        <Image src={user.image} alt={user.username} width={40} height={40} className="rounded-full" />
      )
    } else {
      return (
        <div className="avatar placeholder">
          <div className="bg-neutral-focus text-neutral-content rounded-full w-10">
            <span className="text-xl">{user.username.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      )
    }
  }

  return (
    <header className="bg-base-200 bg-opacity-80 backdrop-blur-sm text-base-content p-4 flex items-center space-x-4 border-b border-base-300">
      <button onClick={onOpenSidebar}>
        {chatData.type === 'private' 
          ? renderUserAvatar(chatData.participants.find(p => p !== currentUserId)!)
          : <div className="avatar placeholder">
              <div className="bg-neutral-focus text-neutral-content rounded-full w-10">
                <span className="text-xl">G</span>
              </div>
            </div>
        }
      </button>
      <div>
        <h1 className="text-xl font-bold">{chatData.name || (chatData.type === 'private' ? participants[chatData.participants.find(p => p !== currentUserId)!]?.username : 'Group Chat')}</h1>
        <p className="text-sm text-base-content/70">{chatData.type === 'private' ? 'Private Chat' : `Group - ${chatData.participants.length} members`}</p>
      </div>
    </header>
  )
}

export default ChatHeader