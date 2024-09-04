"use client"
import React, { useState, useEffect } from "react";
import ChatList from "@/components/ChatList";
import ChatRoom from "@/components/ChatRoom";
import UserInfo from "@/components/UserInfo";
import UserDetailsSidebar from "@/components/UserDetailsSidebar";
import { motion, AnimatePresence } from "framer-motion";
import useChatStore from "@/store/useChatStore";

interface CombinedChatPageProps {
  userId: string;
}

const CombinedChatPage: React.FC<CombinedChatPageProps> = ({ userId }) => {
  const { selectedChatId, setSelectedChatId } = useChatStore();
  const [isMobile, setIsMobile] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userDetailsData, setUserDetailsData] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowChatList(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (selectedChatId && isMobile) {
      setShowChatList(false);
    }
  }, [selectedChatId, isMobile]);

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setShowChatList(false);
    }
  };

  const handleBackToList = () => {
    setShowChatList(true);
    setSelectedChatId(null);
    setShowUserDetails(false);
  };

  const handleOpenUserDetails = (user: any, chat: any, participants: any, files: any[]) => {
    setUserDetailsData({ user, chatType: chat.type, sharedFiles: files, participants });
    setShowUserDetails(true);
    if (isMobile) {
      setShowChatList(false);
    }
  };

  const handleCloseUserDetails = () => {
    setShowUserDetails(false);
  };

  return (
    <div className="h-screen w-full flex justify-center items-center bg-transparent p-0 md:p-4">
      <div className="w-full h-full md:w-[96%] md:h-[90vh] bg-base-100 shadow-xl backdrop-blur-md bg-opacity-80 rounded-none md:rounded-lg overflow-hidden flex flex-col md:flex-row">
        <AnimatePresence>
          {(showChatList || !isMobile) && (
            <motion.div
              key="chatList"
              initial={{ x: isMobile ? -300 : 0, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full md:w-96 border-r border-base-300 flex flex-col h-full"
            >
              <UserInfo />
              <ChatList userId={userId} onChatSelect={handleChatSelect} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(!showChatList || !isMobile) && (
            <motion.div
              key="chatRoom"
              initial={{ x: isMobile ? 300 : 0, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col h-full relative"
            >
              {selectedChatId ? (
                <ChatRoom 
                  chatId={selectedChatId} 
                  onBackClick={handleBackToList}
                  isMobile={isMobile}
                  onOpenUserDetails={handleOpenUserDetails}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-base-content/50">
                  Select a chat to start messaging
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showUserDetails && userDetailsData && (
            <UserDetailsSidebar
            user={userDetailsData.user}
            chatType={userDetailsData.chatType}
            sharedFiles={userDetailsData.sharedFiles}
            onClose={handleCloseUserDetails}
            participants={userDetailsData.participants}
            isOpen={showUserDetails}
            isMobile={isMobile} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CombinedChatPage;