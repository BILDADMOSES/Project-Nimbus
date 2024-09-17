import React from 'react'
import Image from 'next/image'
import { ChatData, UserData } from '@/types'
import { ArrowLeft, Users } from 'lucide-react'

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
    
    if (user?.image) {
      return (
        <Image src={user.image} alt={user.username} width={40} height={40} className="rounded-full w-12 h-12" />
      )
    } else {
      return (
        <div className="avatar placeholder">
          <div className="bg-neutral-focus text-neutral-content rounded-full w-10">
            {chatData.type === 'private' 
              ? <span className="text-xl">{user?.username.charAt(0).toUpperCase()}</span>
              : <Users size={20} />
            }
          </div>
        </div>
      )
    }
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
      <div className="flex items-center justify-between flex-1 min-w-0">
        <button onClick={onOpenSidebar} className="btn btn-ghost btn-circle mr-3">
          {renderUserAvatar(otherParticipantId)}
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