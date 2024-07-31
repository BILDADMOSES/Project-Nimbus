import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Search, PlusCircle, Paperclip, Smile, Send, Phone, Video, MoreVertical, LogOut, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';
import { ErrorBoundary } from 'react-error-boundary';
import  useUserStatus  from "@/hooks/useOnlineStatus"; 
import { format, parseISO } from 'date-fns';


// Types
interface ChatRoom {
  id: string;
  name: string;
  type: 'conversation' | 'group' | 'ai';
  avatar?: string;
  lastMessage?: string;
  lastMessageTimestamp?: Date;
  unreadCount: number;
  isOnline?: boolean;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: any;
  fileUrl?: string;
  readBy: string[];
}

const ErrorFallback = ({ error }) => (
  <div className="text-error p-4">
    <p>Something went wrong:</p>
    <pre>{error.message}</pre>
  </div>
);

const ChatInterface: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [chatList, setChatList] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [lastMessageRef, setLastMessageRef] = useState<any>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useUserStatus();

  useEffect(() => {
    if (!userId) return;

    const fetchChats = async () => {
      const response = await fetch('/api/chat');
      if (response.ok) {
        const chats = await response.json();
        console.log(chats);
        setChatList(chats);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (!selectedRoom) return;

    const fetchMessages = async () => {
      const response = await fetch(`/api/chat?chatId=${selectedRoom.id}&chatType=${selectedRoom.type}`);
      if (response.ok) {
        const fetchedMessages = await response.json();
        setMessages(fetchedMessages);
        setLastMessageRef(fetchedMessages[fetchedMessages.length - 1]);
      }
    };

    fetchMessages();
  }, [selectedRoom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedFile) || !selectedRoom || !userId) return;

    try {
      let fileUrl = '';
      if (selectedFile) {
        // Implement file upload logic here
        // For example, you might want to create a separate API route for file uploads
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          chatId: selectedRoom.id,
          chatType: selectedRoom.type,
          content: message,
          fileUrl,
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prevMessages => [...prevMessages, newMessage]);
        setMessage('');
        setSelectedFile(null);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // You might want to show an error message to the user here
    }
  };

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

  const formatMessageDate = (dateString) => {
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
  };

  const loadMoreMessages = async () => {
    if (!selectedRoom || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const response = await fetch(`/api/chat?chatId=${selectedRoom.id}&chatType=${selectedRoom.type}&lastMessageId=${messages[0]?.id}`);
      if (response.ok) {
        const newMessages = await response.json();
        setMessages(prevMessages => [...newMessages, ...prevMessages]);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };
  

  const handleTyping = () => {
    if (!selectedRoom || !userId) return;
    // Implement typing indicator logic
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 5000);
  };

  const markMessageAsRead = async (messageId: string) => {
    if (!selectedRoom || !userId) return;

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markAsRead',
          chatId: selectedRoom.id,
          chatType: selectedRoom.type,
          messageId,
        }),
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
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
            {chatList.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center p-4 hover:bg-base-300 cursor-pointer ${
                  selectedRoom?.id === chat.id ? 'bg-base-300' : ''
                }`}
                onClick={() => setSelectedRoom(chat)}
              >
                <div className="avatar">
                  <div className="w-10 h-10 rounded-full">
                    <img src={chat.avatar || "/default-avatar.png"} alt={chat.name} />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="font-semibold">{chat.name}</div>
                  <div className="text-sm text-base-content text-opacity-60 truncate">
                    {chat.lastMessage}
                  </div>
                </div>
                {chat.unreadCount > 0 && (
                  <div className="badge badge-primary badge-sm">{chat.unreadCount}</div>
                )}
                {chat.isOnline && (
                  <div className="w-3 h-3 bg-success rounded-full ml-2"></div>
                )}
              </div>
            ))}
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
                    <img src={selectedRoom?.avatar || "/default-avatar.png"} alt={selectedRoom?.name} />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="font-semibold">{selectedRoom?.name}</div>
                  <div className="text-sm text-success">
                    {selectedRoom?.isOnline ? 'Online' : 'Offline'}
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedRoom.messages.map((msg, index) => (
                  <motion.div
                    key={`${msg.id}-${index}`}
                    className={`chat ${msg.senderId === userId ? "chat-end" : "chat-start"}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className={`chat-bubble ${
                      msg.senderId === userId ? "chat-bubble-primary" : "chat-bubble-secondary"
                    }`}>
                      {msg.content}
                      {msg.fileUrl && (
                        <div className="mt-2">
                          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm link">
                            Attached File
                          </a>
                        </div>
                      )}
                      <div className="text-xs opacity-75 mt-1">
                        {format(parseISO(msg.createdAt), 'HH:mm, dd MMM yyyy')}
                        {msg.senderId !== userId && !msg.readBy.includes(userId) && (
                          <span className="ml-2 text-success">•</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && <div className="text-sm text-base-content text-opacity-60">Someone is typing...</div>}
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
                  <button className="btn btn-circle btn-ghost tooltip" data-tip="Attach file" onClick={() => fileInputRef.current?.click()}>
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
    </ErrorBoundary>
  );
};

export default ChatInterface;