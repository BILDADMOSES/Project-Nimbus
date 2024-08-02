import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Search, PlusCircle, Paperclip, Smile, Send, Phone, Video, MoreVertical, LogOut, Shield, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';
import { ErrorBoundary } from 'react-error-boundary';
import { format } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';

import { useSSE } from '@/hooks/useSSE';
import debounce from 'lodash/debounce';

interface ChatRoom {
  id: string;
  name: string;
  type: 'conversation' | 'group' | 'ai';
  lastMessage: Message | null;
  lastMessageTimestamp: string | null;
  unreadCount: number;
  messages?: Message[];
  avatar?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  fileUrl?: string;
  readBy: string[];
}

interface ChatInterfaceProps {
  initialChatId?: string;
  initialChatType?: 'conversation' | 'group' | 'ai';
}

const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => (
  <div role="alert" className="alert alert-error">
    <h2>Something went wrong:</h2>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary} className="btn btn-primary">Try again</button>
  </div>
);

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialChatId, initialChatType }) => {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chatListError, setChatListError] = useState<string | null>(null);

  const { 
    chatList,
    onlineStatus, 
    typingIndicators, 
    connectionStatus,
    newMessages,
    fetchMessages,
    readReceipts,
    sendMessage,
    markAsRead,
    setTypingIndicator,
    updateOnlineStatus, 
  } = useSSE(userId);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom, fetchMessages]);

  const handleChatSelect = useCallback((chat: ChatRoom) => {
    setSelectedRoom(chat);
  }, []);

  useEffect(() => {
    console.log('chatList updated:', chatList);
    setIsLoadingChats(false);
  }, [chatList]);

  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      setChatListError('Connection lost. Please reconnect.');
    } else {
      setChatListError(null);
    }
  }, [connectionStatus]);

  useEffect(() => {
    if (userId) {
      // Set initial online status when component mounts
      updateOnlineStatus(true);

      // Update online status when window gains/loses focus
      const handleVisibilityChange = () => {
        updateOnlineStatus(!document.hidden);
      };

      // Update online status when network status changes
      const handleOnline = () => updateOnlineStatus(true);
      const handleOffline = () => updateOnlineStatus(false);

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        // Clean up event listeners and set status to offline when component unmounts
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        updateOnlineStatus(false);
      };
    }
  }, [userId, updateOnlineStatus]);


  const handleUserActivity = useCallback(debounce(() => {
    if (userId) {
      updateOnlineStatus(true);
    }
  }, 5000), [userId, updateOnlineStatus]);

  useEffect(() => {
    // Add event listeners for user activity
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keypress', handleUserActivity);

    return () => {
      // Remove event listeners when component unmounts
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keypress', handleUserActivity);
    };
  }, [handleUserActivity]);

  const getOtherUserId = (chat: ChatRoom): string | null => {
    if (chat.type !== 'conversation' || !chat.members || !Array.isArray(chat.members)) {
      return null;
    }
    return chat.members.find(id => id !== userId) || null;
  };

  const mergedChatList = useMemo(() => {
    return chatList.sort((a, b) => {
      const timeA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
      const timeB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
      return timeB - timeA;
    });
  }, [chatList]);

  useEffect(() => {
    if (initialChatId) {
      const room = mergedChatList.find(chat => chat.id === initialChatId);
      if (room) {
        setSelectedRoom(room);
      }
    }
  }, [initialChatId, mergedChatList]);

 
  const handleSendMessage = useCallback(async () => {
    if ((!message.trim() && !selectedFile) || !selectedRoom || !userId) return;

    try {
      let fileUrl = '';
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('File upload failed');
        const { url } = await response.json();
        fileUrl = url;
      }

      const newMessage = await sendMessage(selectedRoom.id, selectedRoom.type, message, fileUrl);
      console.log('New message sent:', newMessage);

      // Update the selected room with the new message
      setSelectedRoom(prevRoom => {
        if (prevRoom) {
          return {
            ...prevRoom,
            messages: [...(prevRoom.messages || []), newMessage],
            lastMessage: newMessage.content,
            lastMessageTimestamp: newMessage.createdAt,
          };
        }
        return prevRoom;
      });

      setMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Show error message to user
    }
  }, [message, selectedFile, selectedRoom, userId, sendMessage]);

  const handleReconnect = useCallback(() => {
    // Implement reconnection logic here
    // This might involve reinitializing the SSE connection or refreshing the page
    window.location.reload(); // Simple reload for now, but consider a more sophisticated approach
  }, []);

  const handleMarkAsRead = useCallback((messageId: string) => {
    if (selectedRoom && userId) {
      markAsRead(selectedRoom.id, selectedRoom.type, messageId);
    }
  }, [selectedRoom, userId, markAsRead]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (selectedRoom?.messages?.length > 0) {
      scrollToBottom();
    }
  }, [selectedRoom?.messages, scrollToBottom]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleBlockUser = async () => {
    // TODO: Implement user blocking logic
    console.log('Block user functionality not implemented');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // TODO: Redirect to login page or home page after logout
    } catch (error) {
      console.error('Error logging out:', error);
      // TODO: Show error message to user
    }
  };

  const formatMessageDate = useCallback((dateObject: { _seconds: number, _nanoseconds: number } | string) => {
    if (typeof dateObject === 'string') {
      return format(new Date(dateObject), 'HH:mm, dd MMM yyyy');
    }

    if (!dateObject || !dateObject._seconds) {
      console.warn('Received invalid date:', dateObject);
      return 'Invalid Date';
    }

    try {
      const milliseconds = dateObject._seconds * 1000 + Math.floor(dateObject._nanoseconds / 1000000);
      const date = new Date(milliseconds);
      return format(date, 'HH:mm, dd MMM yyyy');
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'Invalid Date';
    }
  }, []);


  const debouncedSetTyping = useMemo(
    () => debounce((chatId: string, isTyping: boolean) => {
      setTypingIndicator(chatId, isTyping);
    }, 300),
    [setTypingIndicator]
  );

  const handleTyping = useCallback(() => {
    if (!selectedRoom || !userId) return;
    debouncedSetTyping(selectedRoom.id, true);
  }, [selectedRoom, userId, debouncedSetTyping]);

  useEffect(() => {
    return () => {
      debouncedSetTyping.cancel();
    };
  }, [debouncedSetTyping]);

  return (
    <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onReset={() => {
      setSelectedRoom(null);
      setChatListError(null);
    }}
  >
    <div className="flex h-screen bg-base-100" onMouseMove={handleUserActivity} onKeyPress={handleUserActivity}>
      {/* Chat list */}
      <div className="w-1/4 bg-base-200 border-r border-base-300 flex flex-col">
        <div className="p-4 border-b border-base-300 flex items-center">
          <div className="avatar">
            <div className="w-10 h-10 rounded-full">
              <img src={session?.user?.image || "/default-avatar.png"} alt="User" />
            </div>
          </div>
          <span className="font-semibold text-xl ml-2">ChatEasy</span>
          <button className="btn btn-circle btn-ghost ml-auto" onClick={() => console.log('New chat')}>
            <PlusCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="form-control">
            <div className="input-group">
              <span className="btn btn-square btn-ghost">
                <Search className="h-5 w-5" />
              </span>
              <input type="text" placeholder="Search chats" className="input input-bordered w-full" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
        {isLoadingChats ? (
              <div className="flex justify-center items-center h-full">
                <div className="loading loading-spinner loading-lg"></div>
              </div>
            ) : chatListError ? (
              <div className="p-4 text-error">
                <AlertCircle className="inline-block mr-2" />
                {chatListError}
              </div>
            ) : mergedChatList.length === 0 ? (
              <div className="p-4 text-center">No chats available</div>
            ) : (
              mergedChatList.map((chat) => {
                const otherUserId = getOtherUserId(chat);
                const isOnline = otherUserId ? onlineStatus[otherUserId] : false;

                return (
                  <div
                    key={chat.id}
                    className={`flex items-center p-4 hover:bg-base-300 cursor-pointer ${
                      selectedRoom?.id === chat.id ? 'bg-base-300' : ''
                    }`}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full relative">
                        <img src={chat.avatar || "/default-avatar.png"} alt={chat.name} />
                        {chat.type === 'conversation' && (
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            isOnline ? 'bg-green-500' : 'bg-gray-500'
                          }`}></div>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="font-semibold">{chat.name}</div>
                      <div className="text-sm text-base-content text-opacity-60 truncate">
                        {chat.type === 'conversation' 
                          ? (isOnline ? 'Online' : 'Offline')
                          : (chat.lastMessage?.content || 'No messages yet')
                        }
                      </div>
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="badge badge-primary badge-sm">{chat.unreadCount}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-base-100">
          {selectedRoom ? (
            <>
               {/* Chat header */}
               <div className="bg-base-200 p-4 border-b border-base-300 flex items-center">
                <div className="avatar">
                  <div className="w-10 h-10 rounded-full">
                    <img 
                      src={selectedRoom.avatar || "/default-avatar.png"} 
                      alt={selectedRoom.name} 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpath d='M12 8v8'%3E%3C/path%3E%3Cpath d='M8 12h8'%3E%3C/path%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="font-semibold">{selectedRoom.name}</div>
                  <div className="text-sm text-base-content text-opacity-60">
                    {selectedRoom.type === 'conversation' && (
                      (() => {
                        const otherUserId = getOtherUserId(selectedRoom);
                        return otherUserId && onlineStatus[otherUserId] ? 'Online' : 'Offline';
                      })()
                    )}
                  </div>
                </div>
                <div className="ml-auto flex space-x-2">
                  <button className="btn btn-circle btn-ghost tooltip" data-tip="Start voice call">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="btn btn-circle btn-ghost tooltip" data-tip="Start video call">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="btn btn-circle btn-ghost tooltip" data-tip="More options">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                {typingIndicators[selectedRoom.id]?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-base-content text-opacity-60"
                  >
                    Someone is typing...
                  </motion.div>
                )}
                <AnimatePresence initial={false}>
                  {selectedRoom.messages?.map((msg, index) => (
                    <motion.div
                      key={`${msg.id}-${index}`}
                      className={`chat ${msg.senderId === userId ? "chat-end" : "chat-start"}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      onAnimationComplete={() => {
                          if (msg.senderId !== userId && !msg.readBy.includes(userId)) {
                            handleMarkAsRead(msg.id);
                          }
                      }}
                    >
                      <div className={`chat-bubble ${msg.senderId === userId ? "chat-bubble-primary" : "chat-bubble-secondary"}`}>
                        {msg.content}
                        {msg.fileUrl && (
                          <div className="mt-2">
                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm link">
                              Attached File
                            </a>
                          </div>
                        )}
                        <div className="text-xs opacity-75 mt-1">
                          {formatMessageDate(msg.createdAt)}
                          {msg.senderId === userId && msg.readBy.length > 1 && (
                            <span className="ml-2 text-success">✓✓</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Chat input */}
              <div className="p-4 bg-base-200 border-t border-base-300">
                <div className="flex items-center bg-base-100 rounded-full px-4">
                  <button className="btn btn-circle btn-ghost tooltip" data-tip="Add emoji">
                    <Smile className="h-6 w-6" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message"
                    className="input input-ghost flex-1 mx-2"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button 
                    className="btn btn-circle btn-ghost tooltip" 
                    data-tip="Attach file" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-6 w-6" />
                  </button>
                  <button 
                    className="btn btn-circle btn-primary ml-2"
                    onClick={handleSendMessage}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                {selectedFile && (
                  <div className="mt-2 text-sm text-base-content text-opacity-60">
                    File selected: {selectedFile.name}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-2xl text-base-content text-opacity-60">Select a chat to start a conversation</p>
            </div>
          )}
        </div>


        {/* Details column */}
        <div className="w-1/4 bg-base-200 border-l border-base-300 flex flex-col">
          {selectedRoom && (
            <>
              <div className="p-4 border-b border-base-300">
                <div className="avatar">
                  <div className="w-24 h-24 rounded-full mx-auto">
                    <img src={selectedRoom?.avatar || "/default-avatar.png"} alt={selectedRoom?.name} />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-center mt-4">{selectedRoom?.name}</h2>
                <p className="text-sm text-center text-base-content text-opacity-60">
                  {selectedRoom?.type === "group" ? "Group Chat" : selectedRoom?.type === "conversation" ? "Private Chat" : "AI Chat"}
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="collapse collapse-arrow">
                  <input type="radio" name="details-accordion" /> 
                  <div className="collapse-title text-xl font-medium">
                    Privacy & Help
                  </div>
                  <div className="collapse-content"> 
                    <p>Manage privacy settings and get help with this chat.</p>
                    <button className="btn btn-sm btn-outline mt-2">Privacy Settings</button>
                    <button className="btn btn-sm btn-outline mt-2 ml-2">Get Help</button>
                  </div>
                </div>

                <div className="collapse collapse-arrow">
                  <input type="radio" name="details-accordion" /> 
                  <div className="collapse-title text-xl font-medium">
                    Chat Settings
                  </div>
                  <div className="collapse-content"> 
                    <p>Customize chat notifications and appearance.</p>
                    <button className="btn btn-sm btn-outline mt-2">Notifications</button>
                    <button className="btn btn-sm btn-outline mt-2 ml-2">Theme</button>
                  </div>
                </div>

                <div className="collapse collapse-arrow">
                  <input type="radio" name="details-accordion" /> 
                  <div className="collapse-title text-xl font-medium">
                    Shared Photos
                  </div>
                  <div className="collapse-content"> 
                    <p>No shared photos yet.</p>
                    {/* TODO: Implement shared photos grid */}
                  </div>
                </div>

                <div className="collapse collapse-arrow">
                  <input type="radio" name="details-accordion" /> 
                  <div className="collapse-title text-xl font-medium">
                    Shared Files
                  </div>
                  <div className="collapse-content"> 
                    <p>No shared files yet.</p>
                    {/* TODO: Implement shared files list */}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-base-300">
                <button className="btn btn-error btn-block mb-2" onClick={handleBlockUser}>
                  <Shield className="mr-2 h-5 w-5" /> Block User
                </button>
                <button className="btn btn-outline btn-block" onClick={handleLogout}>
                  <LogOut className="mr-2 h-5 w-5" /> Log Out
                </button>
              </div>
            </>
          )}
        </div>
      
      {connectionStatus === 'disconnected' && (
        <div className="fixed bottom-4 right-4">
          <button className="btn btn-error" onClick={handleReconnect}>Reconnect</button>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}

export default ChatInterface;