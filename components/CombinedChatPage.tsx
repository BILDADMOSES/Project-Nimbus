"use client";

import React from "react";
import ChatList from "@/components/ChatList";
import ChatRoom from "@/components/ChatRoom";
import UserInfo from "@/components/UserInfo";
import { motion } from "framer-motion";
import useChatStore from "@/store/useChatStore"; 

interface CombinedChatPageProps {
  userId: string;
}

const CombinedChatPage: React.FC<CombinedChatPageProps> = ({ userId }) => {
  const { selectedChatId, setSelectedChatId } = useChatStore();

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  return (
    <div className="max-h-screen flex items-center justify-center p-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card w-[96%]  h-[90vh]  bg-base-100 shadow-xl backdrop-blur-md bg-opacity-80"
      >
        <div className="card-body p-0 flex flex-row">
          <div className="min-w-[250px] border-r border-base-300 flex flex-col">
            <UserInfo />
            <ChatList userId={userId} onChatSelect={handleChatSelect} />
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
