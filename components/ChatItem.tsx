// components/ChatItem.tsx
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { User, Users, Bot } from 'lucide-react'

interface ChatItemProps {
  chat: {
    id: string
    name: string
    type: 'private' | 'group' | 'ai'
    lastMessage: string
    lastMessageTime: Date
    avatar?: string
  }
  onChatSelect: (chatId: string) => void
}

export default function ChatItem({ chat, onChatSelect }: ChatItemProps) {
  const getAvatarSVG = (type: 'private' | 'group' | 'ai') => {
    const commonClasses = "h-12 w-12 text-base-content/50 p-2 rounded-full border border-base-content/20"
    if (type === 'private') return <User className={commonClasses} />
    if (type === 'group') return <Users className={commonClasses} />
    return <Bot className={commonClasses} />
  }

  return (
    <li>
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
    </li>
  )
}