"use client"
import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Plus, Paperclip, Smile, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/firebaseClient';

interface ChatInterfaceProps {
  initialSelectedRoom?: {
    id: string;
    type: 'conversation' | 'group' | 'ai';
  };
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialSelectedRoom }) => {
  const [selectedRoom, setSelectedRoom] = useState<any>(initialSelectedRoom || null);
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [chatList, setChatList] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(collection(db, 'users', userId, 'chats'), (snapshot) => {
      const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatList(chats);
      if (chats.length > 0 && !selectedRoom) {
        setSelectedRoom(chats[0]);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!selectedRoom) return;

    const q = query(collection(db, selectedRoom.type, selectedRoom.id, 'messages'), orderBy('createdAt'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messages);
    });

    return () => unsubscribe();
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
        const storageRef = ref(storage, `${selectedRoom.type}/${selectedRoom.id}/${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        fileUrl = await getDownloadURL(storageRef);
      }

      const messageDoc = await addDoc(collection(db, selectedRoom.type, selectedRoom.id, 'messages'), {
        content: message,
        senderId: userId,
        createdAt: serverTimestamp(),
        fileUrl: fileUrl || null,
      });

      // Update last message in the chat document
      await updateDoc(doc(db, selectedRoom.type, selectedRoom.id), {
        lastMessage: message || 'Attachment sent',
        lastMessageTimestamp: serverTimestamp(),
      });

      setMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  return (
    <div className="flex h-screen bg-base-100">
      {/* Chat list */}
      <div className="w-1/4 bg-base-200 border-r border-base-300 flex flex-col">
        <div className="p-4 border-b border-base-300 flex items-center">
          <div className="w-10 h-10 bg-gray-300 rounded-full mr-2"></div>
          <span className="font-semibold text-xl">ChatEasy</span>
          <button className="ml-auto bg-primary text-primary-content rounded-full p-2">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center bg-base-300 rounded-md px-2">
            <Search className="w-5 h-5 text-base-content" />
            <input
              type="text"
              placeholder="Search chats"
              className="bg-transparent p-2 w-full focus:outline-none"
            />
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
              <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="font-semibold">{chat.name}</div>
                <div className="text-sm text-base-content truncate">
                  {chat.lastMessage}
                </div>
              </div>
              <div className="text-xs text-base-content">{chat.lastMessageTimestamp?.toDate().toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-base-100">
        {/* Chat header */}
        <div className="bg-base-200 p-4 border-b border-base-300 flex items-center">
          <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
          <div>
            <div className="font-semibold">{selectedRoom?.name}</div>
            <div className="text-sm text-success">
              {selectedRoom?.type === "group" ? "Group Chat" : selectedRoom?.type === "conversation" ? "Private Chat" : "AI Chat"}
            </div>
          </div>
          <button className="ml-auto text-base-content">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-base-content">No messages yet.</div>
          )}
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              className={`chat ${msg.senderId === userId ? "chat-end" : "chat-start"}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={`chat-bubble ${
                msg.senderId === userId ? "bg-primary text-primary-content" : "bg-base-300 text-base-content"
              }`}>
                {msg.content}
                {msg.fileUrl && (
                  <div>
                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                      Attached File
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <div className="p-4 bg-base-200 border-t border-base-300">
          <div className="flex items-center bg-base-300 rounded-full px-4">
            <Smile className="w-6 h-6 text-base-content" />
            <input
              type="text"
              placeholder="Type message..."
              className="bg-transparent p-3 flex-1 focus:outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
            <Paperclip
              className="w-6 h-6 text-base-content cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            />
            <button
              onClick={handleSendMessage}
              className="bg-primary text-primary-content rounded-full p-2 ml-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {selectedFile && (
            <div className="mt-2 text-sm text-base-content">
              File selected: {selectedFile.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;