"use client";

import React, { useState } from "react";
import ChatList from "@/components/ChatList";
import ChatRoom from "@/components/ChatRoom";
import UserInfo from "@/components/UserInfo";
import { motion } from "framer-motion";

interface CombinedChatPageProps {
  userId: string;
}

const CombinedChatPage: React.FC<CombinedChatPageProps> = ({ userId }) => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card w-[96%] h-[95vh] bg-base-100 shadow-xl backdrop-blur-md bg-opacity-80"
      >
        <div className="card-body p-0 flex flex-row">
          <div className="w-1/4 border-r border-base-300 flex flex-col">
            <UserInfo />
            <div className="flex-1 overflow-y-auto">
              <ChatList userId={userId} onChatSelect={handleChatSelect} />
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            {selectedChatId ? (
              <ChatRoom chatId={selectedChatId} />
            ) : (
              <div className="h-full flex items-center justify-center text-base-content/50">
                Select a chat to start messaging
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CombinedChatPage;
