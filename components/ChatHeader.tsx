import React from 'react'
import Image from 'next/image'
import { ChatData, UserData } from '@/types'
import { ArrowLeft, UserCircle, Users } from 'lucide-react'

interface ChatHeaderProps {
  chatData: ChatData;
  participants: {[key: string]: UserData};
  currentUserId: string | undefined;
  onBackClick: () => void;
  onOpenSidebar: () => void;
  isMobile: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  chatData, 
  participants, 
  currentUserId, 
  onBackClick,
  onOpenSidebar,
  isMobile
}) => {
  const renderUserAvatar = (userId: string | null) => {
    const user = userId ? participants[userId] : null
    return (
      <>
      {user?.avatar ? (
          <Image
            src={user.avatar}
            alt="User avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="h-20 w-20 rounded-full flex items-center justify-center bg-base-300">
            <UserCircle className="h-14 w-14 text-base-content/50" />
          </div>
        )}</>
    )
  }

  const otherParticipantId = chatData.type === 'private' 
    ? chatData.participants.find(p => p !== currentUserId)
    : null;

  const chatName = chatData.name || (chatData.type === 'private' ? participants[otherParticipantId!]?.username : 'Group Chat');
  const chatInfo = chatData.type === 'private' 
    ? "private"
    // ? (participants[otherParticipantId!]?.isOnline ? 'Online' : 'Offline')
    : `${chatData.participants.length} members`;

  return (
    <header className="bg-base-100 backdrop-blur-md bg-opacity-80 text-base-content p-2 md:p-4 flex items-center justify-between border-b border-base-300">
      <div className="flex items-center justify-between flex-1 min-w-0 md:py-2">
        <button onClick={onOpenSidebar} className="btn btn-ghost btn-circle mr-3">
          {renderUserAvatar(otherParticipantId as string )}
        </button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpenSidebar}>
          <h1 className="text-lg font-bold truncate">{chatName}</h1>
          <p className="text-sm text-base-content/70 truncate">{chatInfo}</p>
        </div>
        {isMobile && (
        <button onClick={onBackClick} className="btn btn-ghost btn-circle mr-2">
          <ArrowLeft size={24} />
        </button>
      )}
      </div>
    </header>
  )
}

export default ChatHeader