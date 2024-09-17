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
    <li className="w-full">
      <button 
        onClick={() => onChatSelect(chat.id)} 
        className="w-full text-left px-3 py-2 hover:bg-base-200 transition-colors duration-200 ease-in-out rounded-lg"
      >
        <div className="flex items-center h-16">
          <div className="flex-shrink-0 mr-3">
            {chat.avatar ? (
              <Image
                src={chat.avatar}
                alt={chat.name || 'Chat'}
                width={48}
                height={48}
                className="rounded-full w-12 h-12"
              />
            ) : (
              getAvatarSVG(chat.type)
            )}
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium truncate mr-2">{chat.name || 'Unnamed Chat'}</span>
              <div className="flex-shrink-0 flex items-center">
                {chat.type === 'group' && <span className="badge badge-sm badge-outline mr-2">Group</span>}
                {chat.type === 'ai' && <span className="badge badge-sm badge-primary mr-2">AI</span>}
                <span className="text-xs text-base-content/70">
                  {formatDistanceToNow(chat.lastMessageTime, { addSuffix: true })}
                </span>
              </div>
            </div>
            <p className="text-sm text-base-content/70 truncate">{chat.lastMessage || 'No messages'}</p>
          </div>
        </div>
      </button>
    </li>
  )
}