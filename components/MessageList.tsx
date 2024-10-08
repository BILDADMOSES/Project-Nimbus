import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { format, isToday, isYesterday } from 'date-fns';
import { Message, UserData } from '@/types';
import AudioMessage from './AudioMessage';

interface MessageListProps {
  messages: Message[];
  participants: {[key: string]: UserData};
  currentUserId: string | undefined;
  chatType: 'private' | 'group' | 'ai';
  hasMore: boolean;
  lastMessageRef: React.RefObject<HTMLDivElement>;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  onLoadMore?: () => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  participants, 
  currentUserId, 
  chatType, 
  hasMore, 
  lastMessageRef, 
  chatContainerRef,
  onLoadMore
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container && onLoadMore) {
      const handleScroll = () => {
        if (container.scrollTop === 0 && hasMore) {
          onLoadMore();
        }
      };
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, onLoadMore]);

  const getMessageDate = (timestamp: any): Date => {
    if (timestamp instanceof Date) {
      return timestamp;
    } else if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    } else if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'number') {
      return new Date(timestamp);
    } else {
      return new Date();
    }
  };

  const renderDateDivider = (date: Date | null) => {
    if (!date) return null;
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

  const renderUserAvatar = (userId: string) => {
    const user = participants[userId];
    if (!user) return null;

    if (user.image) {
      return (
        <Image src={user.avatar} alt={user.username} width={40} height={40} className="rounded-full" />
      );
    } else {
      return (
        <div className="avatar placeholder">
          <div className="bg-neutral-focus text-neutral-content rounded-full w-10">
            <span className="text-xl">{user.username.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      );
    }
  };

  const renderMessageContent = (message: Message) => {
    const getContent = () => {
      if (message.senderId === currentUserId) {
        return message.originalContent || message.content;
      }
      if (typeof message.content === 'object' && currentUserId) {
        const preferredLang = participants[currentUserId]?.preferredLang || 'en';
        return message.content[preferredLang.trim()] || message.content['en'] || message.originalContent;
      }
      return message.originalContent || message.content;
    };

    switch (message.type) {
      case 'text':
        return <p dangerouslySetInnerHTML={{ __html: getContent() as string }} />;
      case 'image':
        return <Image src={message.fileUrl!} alt="Uploaded image" width={200} height={200} />;
      case 'file':
        return (
          <div>
            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="link">
              {typeof message.content === 'string' ? message.content : 'Original File'}
            </a>
            {message.translatedFileUrl && (
              <a href={message.translatedFileUrl} target="_blank" rel="noopener noreferrer" className="link ml-2">
                Translated File
              </a>
            )}
          </div>
        );
      case 'audio':
        return (
          <AudioMessage
            message={message}
            isCurrentUser={message.senderId === currentUserId}
            receiverLanguage={participants[currentUserId!]?.preferredLang || 'en'}
            chatType={chatType}
          />
        );
      default:
        return null;
    }
  };

  const groupMessagesByDay = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach((message) => {
      const date = getMessageDate(message.timestamp);
      const key = format(date, 'yyyy-MM-dd');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(message);
    });
    return groups;
  };

  return (
    <div ref={chatContainerRef} className="flex flex-col flex-grow overflow-y-auto">
      <div className="flex-grow min-h-0 p-4 space-y-4">
        {/* {hasMore && onLoadMore && (  
          <div ref={lastMessageRef} className="text-center my-4">
            <span className="loading loading-dots loading-sm"></span>
          </div>
        )} */}
        {Object.entries(groupMessagesByDay(messages)).map(([date, msgs]) => (
          <div key={date}>
            {renderDateDivider(new Date(date))}
            {msgs.map((message) => (
              <div 
                key={message.id} 
                className={`chat ${message.senderId === currentUserId ? 'chat-end' : 'chat-start'}`}
              >
                {chatType === 'group' && message.senderId !== currentUserId && (
                  <div className="chat-image avatar">
                    {renderUserAvatar(message.senderId)}
                  </div>
                )}
                <div className="chat-header mb-1">
                  {chatType === 'group' && message.senderId !== currentUserId && (
                    <span className="text-xs font-bold">{participants[message.senderId]?.username}</span>
                  )}
                </div>
                <div className={`chat-bubble ${message.senderId === currentUserId ? 'chat-bubble-primary' : 'chat-bubble-secondary'}`}>
                  {renderMessageContent(message)}
                </div>
                <div className="chat-footer opacity-50 text-xs">
                  {format(getMessageDate(message.timestamp), 'h:mm a')}
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default MessageList;