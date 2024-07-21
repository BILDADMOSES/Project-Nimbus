import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Plus, Paperclip, Smile, Mic, Send } from "lucide-react";
import { motion } from "framer-motion";
import io, { Socket } from "socket.io-client";
import Logo from "./common/Logo";

// WebSocket Hook
function useWebSocket(
  userId: string,
  roomId: string,
  roomType: "group" | "conversation" | "ai"
) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3000"
    );

    const socket = socketRef.current;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("authenticate", userId);
      socket.emit("join", { userId, roomId, roomType });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("roomHistory", (history) => {
      setMessages(history);
      console.log("Room history:", history);
    });

    socket.on("newMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on("typing", (userId) => {
      setTypingUsers((prevTypingUsers) => [...prevTypingUsers, userId]);
    });

    socket.on("stopTyping", (userId) => {
      setTypingUsers((prevTypingUsers) =>
        prevTypingUsers.filter((id) => id !== userId)
      );
    });

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    return () => {
      if (socket) {
        socket.emit("leave", { userId, roomId, roomType });
        socket.disconnect();
      }
    };
  }, [userId, roomId, roomType]);

  const sendMessage = (content: string, language: string) => {
    socketRef.current?.emit("sendMessage", {
      userId,
      roomId,
      roomType,
      content,
      language,
    });
  };

  const startTyping = () => {
    socketRef.current?.emit("typing", { userId, roomId });
  };

  const stopTyping = () => {
    socketRef.current?.emit("stopTyping", { userId, roomId });
  };

  return {
    isConnected,
    messages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
  };
}

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
        setChatList(data);
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
      const otherUser = room.members.find((member: any) => member.id !== userId);
      return otherUser ? otherUser.name : "Unknown User";
    }
    return room?.name || "Chat";
  };

  return (
    <div className="flex h-screen bg-base-100">
      {/* Left sidebar */}
      <div className="w-1/3 bg-base-200 border-r border-base-300 flex flex-col">
        <div className="p-4 border-b border-base-300 flex items-center">
          <div className="w-10 h-10 bg-gray-300 rounded-full mr-2"></div>
          <Logo fontSize="2rem" height={40} width={40} />
          <button className="ml-auto bg-primary text-primary-content rounded-full p-2">
            <Plus className="w-5 h-5" />
          </button>
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
          {chatList.map((chat) => (
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
          {!isConnected && (
            <div className="text-center text-base-content">
              Connecting to chat...
            </div>
          )}
          {isConnected && messages.length === 0 && (
            <div className="text-center text-base-content">
              No messages yet. Start the conversation!
            </div>
          )}
          {isConnected &&
            messages.map((msg, index) => (
              <React.Fragment key={msg.id}>
                <motion.div
                  className={`flex items-end ${
                    msg.senderId === userId ? "justify-end" : "justify-start"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div
                    className={`rounded-lg p-3 max-w-xs h-auto shadow-sm ${
                      msg.senderId === userId
                        ? "bg-indigo-500 text-white order-2 ml-2"
                        : "bg-base-200 text-base-content"
                    }`}
                  >
                    <p className="text-sm break-words text-wrap">
                      {msg.content}
                    </p>
                  </div>
                  <div className="text-xs text-base-content ml-2">
                    {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </motion.div>
              </React.Fragment>
            ))}
        </div>

        {/* Message input */}
        <div className="bg-base-200 p-4 border-t border-base-300">
          <div className="flex items-center bg-base-300 rounded-full px-4">
            <Smile className="w-6 h-6 text-base-content" />
            <input
              type="text"
              placeholder="Type message..."
              className="bg-transparent p-3 flex-1 focus:outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              onFocus={startTyping}
              onBlur={stopTyping}
            />
            <Paperclip className="w-6 h-6 text-base-content" />
            <Mic className="w-6 h-6 text-base-content" />
            <button
              onClick={handleSendMessage}
              className="bg-primary text-primary-content rounded-full p-2 ml-2"
              disabled={!isConnected}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {typingUsers.length > 0 && (
            <div className="text-sm text-base-content mt-2">
              {typingUsers.join(", ")} is typing...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;