import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Plus, Paperclip, Smile, Send } from "lucide-react";
import { motion } from "framer-motion";
import Logo from "./common/Logo";
import Link from "next/link";
import { useWebSocket } from "@/hooks/useWebsocket";

interface ChatInterfaceProps {
  chatId?: string;
  chatType?: string;
}

const ChatInterface = ({ chatId, chatType }: ChatInterfaceProps) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [chatList, setChatList] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    messages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
  } = useWebSocket(
    userId || "",
    selectedRoom?.id || "",
    selectedRoom?.type || "group"
  );

  useEffect(() => {
    fetch("/api/chat")
      .then((response) => response.json())
      .then((data) => {
        console.log("Chat list:", data);
        setChatList(data);
        scrollToBottom();
        if (chatId && chatType) {
          const room = data.find(
            (chat: any) => chat.id === chatId && chat.type === chatType
          );
          setSelectedRoom(room);
        } else {
          setSelectedRoom(data[0]);
        }
      })
      .catch((error) => {
        console.error("Error fetching chat list:", error);
      });
  }, [chatId, chatType]);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message, session?.user?.preferredLanguage || "en");
      setMessage("");
    }
  };

  const getDisplayName = (room: any) => {
    if (room?.type === "conversation" && room?.members) {
      const otherUser = room.members.find(
        (member: any) => member.id !== userId
      );
      return otherUser ? otherUser.name : "Unknown User";
    }
    return room?.name || "New Group";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const groupedChats = {
    aiChats: chatList.filter(chat => chat.type === "ai"),
    conversations: chatList.filter(chat => chat.type === "conversation"),
    groups: chatList.filter(chat => chat.type === "group"),
  };

  return (
    <div className="flex h-screen bg-base-100">
      {/* Left sidebar */}
      <div className="w-1/3 bg-base-200 border-r border-base-300 flex flex-col">
        <div className="p-4 border-b border-base-300 flex items-center">
          <div className="w-10 h-10 bg-gray-300 rounded-full mr-2"></div>
          <Logo fontSize="2rem" height={40} width={40} />
          <Link href="/chat/create">
            <button className="ml-auto bg-primary text-primary-content rounded-full p-2">
              <Plus className="w-5 h-5" />
            </button>
          </Link>
        </div>
        <div className="p-4">
          <div className="flex items-center bg-base-300 rounded-md px-2">
            <Search className="w-5 h-5 text-base-content" />
            <input
              type="text"
              placeholder="Search messages, people"
              className="bg-transparent p-2 w-full focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedChats).map(([chatType, chats]) => (
            <React.Fragment key={chatType}>
              <div className="p-4 border-b border-base-300">
                <h2 className="text-lg font-semibold capitalize">{chatType.replace('aiChats', 'AI Chats')}</h2>
              </div>
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex items-center p-4 hover:bg-base-300 cursor-pointer ${
                    selectedRoom?.id === chat.id ? "bg-base-300" : ""
                  }`}
                  onClick={() => setSelectedRoom(chat)}
                >
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="font-semibold">{getDisplayName(chat)}</div>
                    <div className="text-sm text-base-content truncate">
                      {chat.lastMessage?.slice(0, 25) + "..."}
                    </div>
                  </div>
                  <div className="text-xs text-base-content">
                    {chat.lastMessageTimestamp
                      ? new Date(chat.lastMessageTimestamp).toDateString() ===
                        new Date().toDateString()
                        ? "Today"
                        : new Date(chat.lastMessageTimestamp).toLocaleString(
                            undefined,
                            { month: "short", day: "numeric" }
                          )
                      : ""}
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center ml-2">
                      {chat.unreadCount}
                    </div>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-base-100">
        {/* Chat header */}
        <div className="bg-base-200 p-4 border-b border-base-300 flex items-center">
          <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
          <div>
            <div className="font-semibold">{getDisplayName(selectedRoom)}</div>
            <div className="text-sm text-success">
              {selectedRoom?.type === "group"
                ? `${selectedRoom?.members?.length || 0} members`
                : selectedRoom?.type === "conversation"
                ? "Private conversation"
                : "AI Chat"}
            </div>
          </div>
          <button className="ml-auto text-base-content">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Chat messages */}
        <div className="hide-scrollbar flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
          {!isConnected && (
            <div className="text-center text-base-content">
              Connecting to chat...
            </div>
          )}
          {isConnected && messages.length === 0 && (
            <div className="text-center text-base-content">No messages yet.</div>
          )}
          {isConnected &&
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat ${
                  msg.senderId === userId ? "chat-end" : "chat-start"
                }`}
              >
                <div
                  className={`chat-bubble ${
                    msg.senderId === userId ? "chat-bubble-primary" : ""
                  }`}
                >
                  <div className="chat-header font-semibold">
                    {msg.senderId === userId ? "You" : getDisplayName(selectedRoom)}
                  </div>
                  <div className="chat-body mt-1">{msg.content}</div>
                  <div className="chat-footer text-xs text-right mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        <div className="p-2 text-sm text-primary">
          {typingUsers.length > 0 && (
            <div>
              {typingUsers.map((typingUserId, index) => (
                <span key={typingUserId}>
                  {
                    chatList
                      .find((chat) => chat.id === selectedRoom?.id)
                      ?.members.find((member: any) => member.id === typingUserId)?.name ||
                      "Someone"
                  }
                  {index < typingUsers.length - 1 ? ", " : ""}
                </span>
              ))}
              {typingUsers.length === 1 ? " is typing..." : " are typing..."}
            </div>
          )}
        </div>

        {/* Chat input */}
        <div className="p-4 flex items-center bg-base-200 border-t border-base-300">
          <button className="text-base-content">
            <Paperclip className="w-6 h-6 mr-2" />
          </button>
          <button className="text-base-content">
            <Smile className="w-6 h-6 mr-2" />
          </button>
          <input
            type="text"
            className="flex-1 p-2 bg-base-300 rounded-lg focus:outline-none text-base-content"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            onFocus={startTyping}
            onBlur={stopTyping}
          />
          <button
            className="text-base-content ml-2"
            onClick={handleSendMessage}
          >
            {message.trim() ? (
              <Send className="w-6 h-6" />
            ) : (
              <span> </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;