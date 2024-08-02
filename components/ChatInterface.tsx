import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Search, PlusCircle, Paperclip, Smile, Send, Phone, Video, MoreVertical, LogOut, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';
import { ErrorBoundary } from 'react-error-boundary';
import { format, parseISO } from 'date-fns';
import { useInfiniteQuery, useMutation, useQueryClient } from 'react-query';
import { useSSE } from '@/hooks/useSSE';
import debounce from 'lodash/debounce';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  fileUrl?: string;
  readBy: string[];
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'conversation' | 'group' | 'ai';
  avatar?: string;
  messages: Message[];
  lastMessage: string | null;
  lastMessageTimestamp: string | null;
  unreadCount: number;
}

interface ChatInterfaceProps {
  chatId: string;
  chatType: 'conversation' | 'group' | 'ai';
}

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div role="alert" className="alert alert-error">
    <h2>Something went wrong:</h2>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary} className="btn btn-primary">Try again</button>
  </div>
);

const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatId, chatType }) => {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const { 
    chatList: sseChats, 
    onlineStatus, 
    typingIndicators, 
    connectionStatus, 
    reconnect,
    newMessages,
    readReceipts
  } = useSSE(userId);

  const { 
    data: chatListData, 
    isLoading: isLoadingChatList,
    fetchNextPage: fetchNextChatPage,
    hasNextPage: hasMoreChats,
  } = useInfiniteQuery<{ chats: ChatRoom[], nextCursor: string | null }>(
    'chatList',
    async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/chat?page=${pageParam}`);
      if (!response.ok) throw new Error('Failed to fetch chats');
      return response.json();
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!userId,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const chatList = useMemo(() => chatListData?.pages.flatMap(page => page.chats) ?? [], [chatListData]);

  const mergedChatList = useMemo(() => {
    const mergedList = [...chatList];
    sseChats.forEach(sseChat => {
      const index = mergedList.findIndex(chat => chat.id === sseChat.id);
      if (index !== -1) {
        mergedList[index] = { ...mergedList[index], ...sseChat };
      } else {
        mergedList.push(sseChat);
      }
    });
    return mergedList.sort((a, b) => {
      const timeA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
      const timeB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
      return timeB - timeA;
    });
  }, [chatList, sseChats]);

  const sendMessageMutation = useMutation(
    async ({ content, fileUrl }: { content: string, fileUrl?: string }) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          chatId: selectedRoom?.id,
          chatType: selectedRoom?.type,
          content,
          fileUrl,
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    {
      onMutate: async (newMessage) => {
        await queryClient.cancelQueries('chatList');
        const previousChats = queryClient.getQueryData('chatList');
        queryClient.setQueryData('chatList', (old: any) => ({
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            chats: page.chats.map((chat: ChatRoom) => 
              chat.id === selectedRoom?.id
                ? {
                    ...chat,
                    messages: [...(chat.messages || []), { 
                      id: 'temp-' + Date.now(),
                      content: newMessage.content,
                      senderId: userId,
                      createdAt: new Date().toISOString(),
                      fileUrl: newMessage.fileUrl,
                      readBy: [userId],
                    }],
                    lastMessage: newMessage.content,
                    lastMessageTimestamp: new Date().toISOString(),
                    unreadCount: chat.unreadCount,
                  }
                : chat
            ),
          })),
        }));
        return { previousChats };
      },
      onError: (err, newMessage, context: any) => {
        queryClient.setQueryData('chatList', context.previousChats);
      },
      onSettled: () => {
        queryClient.invalidateQueries('chatList');
      },
    }
  );

  const handleSendMessage = useCallback(async () => {
    if ((!message.trim() && !selectedFile) || !selectedRoom || !userId) return;

    try {
      let fileUrl = '';
      if (selectedFile) {
        // Implement file upload logic here
        // For example, you might want to create a separate API route for file uploads
      }

      await sendMessageMutation.mutateAsync({ content: message, fileUrl });
      setMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
      // You might want to show an error message to the user here
    }
  }, [message, selectedFile, selectedRoom, userId, sendMessageMutation]);

  const markAsReadMutation = useMutation(
    async ({ chatId, messageId }: { chatId: string, messageId: string }) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markAsRead',
          chatId,
          messageId,
        }),
      });
      if (!response.ok) throw new Error('Failed to mark message as read');
      return response.json();
    },
    {
      onMutate: async ({ chatId, messageId }) => {
        await queryClient.cancelQueries('chatList');
        const previousChats = queryClient.getQueryData('chatList');
        queryClient.setQueryData('chatList', (old: any) => ({
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            chats: page.chats.map((chat: ChatRoom) => 
              chat.id === chatId
                ? {
                    ...chat,
                    messages: chat.messages.map(msg => 
                      msg.id === messageId
                        ? { ...msg, readBy: [...msg.readBy, userId] }
                        : msg
                    ),
                    unreadCount: Math.max(0, chat.unreadCount - 1),
                  }
                : chat
            ),
          })),
        }));
        return { previousChats };
      },
      onError: (err, variables, context: any) => {
        queryClient.setQueryData('chatList', context.previousChats);
      },
      onSettled: () => {
        queryClient.invalidateQueries('chatList');
      },
    }
  );

  const handleMarkAsRead = useCallback((chatId: string, messageId: string) => {
    markAsReadMutation.mutate({ chatId, messageId });
  }, [markAsReadMutation]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (selectedRoom?.messages?.length > 0) {
      scrollToBottom();
    }
  }, [selectedRoom?.messages, scrollToBottom]);

  useEffect(() => {
    // Update the selected room when the chat list changes
    if (selectedRoom) {
      const updatedRoom = mergedChatList.find(chat => chat.id === selectedRoom.id);
      if (updatedRoom) {
        setSelectedRoom(updatedRoom);
      }
    }
  }, [mergedChatList, selectedRoom]);

  useEffect(() => {
    // Handle new messages
    newMessages.forEach(newMessage => {
      queryClient.setQueryData('chatList', (old: any) => ({
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          chats: page.chats.map((chat: ChatRoom) => 
            chat.id === newMessage.chatId
              ? {
                  ...chat,
                  messages: [...chat.messages, newMessage],
                  lastMessage: newMessage.content,
                  lastMessageTimestamp: newMessage.createdAt,
                  unreadCount: chat.unreadCount + 1,
                }
              : chat
          ),
        })),
      }));

      // If the message is for the selected room, mark it as read
      if (selectedRoom?.id === newMessage.chatId) {
        handleMarkAsRead(newMessage.chatId, newMessage.id);
      }
    });
  }, [newMessages, queryClient, selectedRoom, handleMarkAsRead]);

  useEffect(() => {
    // Handle read receipts
    readReceipts.forEach(receipt => {
      queryClient.setQueryData('chatList', (old: any) => ({
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          chats: page.chats.map((chat: ChatRoom) => 
            chat.id === receipt.chatId
              ? {
                  ...chat,
                  messages: chat.messages.map(msg => 
                    msg.id === receipt.messageId
                      ? { ...msg, readBy: [...msg.readBy, receipt.userId] }
                      : msg
                  ),
                }
              : chat
          ),
        })),
      }));
    });
  }, [readReceipts, queryClient]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleBlockUser = async () => {
    // Implement user blocking logic
    console.log('Block user functionality not implemented');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Redirect to login page or home page after logout
    } catch (error) {
      console.error('Error logging out:', error);
      // You might want to show an error message to the user here
    }
  };

  const formatMessageDate = useCallback((dateString: string) => {
    if (!dateString) {
      console.warn('Received invalid date:', dateString);
      return 'Invalid Date';
    }

    try {
      const date = parseISO(dateString);
      return format(date, 'HH:mm, dd MMM yyyy');
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'Invalid Date';
    }
  }, []);

  const debouncedSetTyping = useCallback(
    debounce((isTyping: boolean) => {
      if (!selectedRoom || !userId) return;
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setTypingIndicator',
          chatId: selectedRoom.id,
          isTyping,
        }),
      });
    }, 300),
    [selectedRoom, userId]
  );

  const handleTyping = useCallback(() => {
    if (!selectedRoom || !userId) return;
    debouncedSetTyping(true);
  }, [selectedRoom, userId, debouncedSetTyping]);


  return (
  <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {
    setSelectedRoom(null);
    queryClient.invalidateQueries('chatList');
  }}>
    <div className="flex h-screen bg-base-100">
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
          {isLoadingChatList ? (
            <div className="p-4 text-center">Loading chats...</div>
          ) : (
            mergedChatList.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center p-4 hover:bg-base-300 cursor-pointer ${
                  selectedRoom?.id === chat.id ? 'bg-base-300' : ''
                }`}
                onClick={() => setSelectedRoom(chat)}
              >
                <div className="avatar">
                  <div className="w-10 h-10 rounded-full relative">
                    <img src={chat.avatar || "/default-avatar.png"} alt={chat.name} />
                    {onlineStatus[chat.id] && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="font-semibold">{chat.name}</div>
                  <div className="text-sm text-base-content text-opacity-60 truncate">
                    {chat.lastMessage?.content || 'No messages yet'}
                  </div>
                </div>
                {chat.unreadCount > 0 && (
                  <div className="badge badge-primary badge-sm">{chat.unreadCount}</div>
                )}
              </div>
            ))
          )}
          {hasMoreChats && (
            <button
              className="btn btn-sm btn-ghost w-full"
              onClick={() => fetchNextChatPage()}
            >
              Load more chats
            </button>
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
                <div className="w-10 h-10 rounded-full relative">
                  <img src={selectedRoom?.avatar || "/default-avatar.png"} alt={selectedRoom?.name} />
                  {onlineStatus[selectedRoom.id] && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
              </div>
              <div className="ml-3">
                <div className="font-semibold">{selectedRoom?.name}</div>
                <div className="text-sm text-base-content text-opacity-60">
                  {onlineStatus[selectedRoom.id] ? 'Online' : 'Offline'}
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
                        handleMarkAsRead(selectedRoom.id, msg.id);
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
                  disabled={sendMessageMutation.isLoading}
                >
                  {sendMessageMutation.isLoading ? (
                    <div className="loading loading-spinner loading-xs"></div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
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
                  <p>Privacy and help content here</p>
                </div>
              </div>

              <div className="collapse collapse-arrow">
                <input type="radio" name="details-accordion" /> 
                <div className="collapse-title text-xl font-medium">
                  Chat Settings
                </div>
                <div className="collapse-content"> 
                  <p>Chat settings content here</p>
                </div>
              </div>

              <div className="collapse collapse-arrow">
                <input type="radio" name="details-accordion" /> 
                <div className="collapse-title text-xl font-medium">
                  Shared Photos
                </div>
                <div className="collapse-content"> 
                  <p>Shared photos will be displayed here</p>
                </div>
              </div>

              <div className="collapse collapse-arrow">
                <input type="radio" name="details-accordion" /> 
                <div className="collapse-title text-xl font-medium">
                  Shared Files
                </div>
                <div className="collapse-content"> 
                  <p>Shared files will be listed here</p>
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
    </div>
    {connectionStatus === 'disconnected' && (
      <div className="fixed bottom-4 right-4">
        <button className="btn btn-error" onClick={reconnect}>Reconnect</button>
      </div>
    )}
  </ErrorBoundary>
);
}

export default ChatInterface;