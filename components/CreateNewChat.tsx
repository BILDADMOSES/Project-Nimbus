import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Check } from "lucide-react";
import { db } from "@/lib/firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import UserSearch from "@/components/UserSearch";
import SelectedUsers from "@/components/SelectedUsers";
import GroupNameInput from "@/components/GroupNameInput";
import CreateWithoutUsersCheckbox from "@/components/CreateWithoutUsersCheckbox";
import InvitationLink from "@/components/InvitationLink";
import { useCreateChat } from "@/hooks/useCreateChat";

interface CreateNewChatProps {
  chatType: "private" | "group" | "ai";
  onClose: () => void;
}

export default function CreateNewChat({ chatType, onClose }: CreateNewChatProps) {
  const { data: session } = useSession();
  const [groupChatCount, setGroupChatCount] = useState(0);
  const [isFreeTier, setIsFreeTier] = useState(true);

  const {
    groupName,
    setGroupName,
    selectedUsers,
    setSelectedUsers,
    createWithoutUsers,
    setCreateWithoutUsers,
    chatLink,
    isLoading,
    error,
    successMessage,
    linkCopied,
    handleCreateChat,
    handleCopyLink,
    handleInvite,
    handleSearch,
    searchTerm,
    setSearchTerm,
    searchType,
    setSearchType,
    showInvite,
    inviteEmail,
    setInviteEmail,
  } = useCreateChat(chatType, session?.user?.id, isFreeTier, groupChatCount);

  useEffect(() => {
    const fetchUserTierAndGroupChatCount = async () => {
      if (session?.user?.id) {
        const userDoc = await getDoc(doc(db, "users", session.user.id));
        const userData = userDoc.data();
        setIsFreeTier(userData?.tier === "free" || !userData?.tier);

        const usageDoc = await getDoc(doc(db, "usage", session.user.id));
        const usageData = usageDoc.data();
        setGroupChatCount(usageData?.groupChats || 0);
      }
    };

    fetchUserTierAndGroupChatCount();
  }, [session]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-base-200 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-base-100 rounded-lg p-4 sm:p-8 w-full max-w-lg sm:max-w-2xl shadow-xl overflow-y-auto max-h-[90vh]"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-3xl font-bold text-base-content">
              {chatType === "private" && "Create Private Chat"}
              {chatType === "group" && "Create Group Chat"}
              {chatType === "ai" && "Create AI Chat"}
            </h2>
            <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm sm:btn-md">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            {chatType === "group" && (
              <GroupNameInput groupName={groupName} setGroupName={setGroupName} />
            )}

            {chatType !== "ai" && (
              <>
                <UserSearch
                  chatType={chatType}
                  selectedUsers={selectedUsers}
                  setSelectedUsers={setSelectedUsers}
                  handleInvite={handleInvite}
                  handleSearch={handleSearch}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  searchType={searchType}
                  setSearchType={setSearchType}
                  showInvite={showInvite}
                  inviteEmail={inviteEmail}
                  setInviteEmail={setInviteEmail}
                />
                <SelectedUsers
                  selectedUsers={selectedUsers}
                  handleRemoveUser={(userId) =>
                    setSelectedUsers(selectedUsers.filter((user) => user.id !== userId))
                  }
                />
                <CreateWithoutUsersCheckbox
                  createWithoutUsers={createWithoutUsers}
                  setCreateWithoutUsers={setCreateWithoutUsers}
                />
              </>
            )}

            {chatType === "ai" && (
              <div className="alert alert-info">
                <Bot className="flex-shrink-0 mr-2" />
                <span>
                  You're creating an AI chat. This will start a private
                  conversation with our AI assistant.
                </span>
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                <X className="flex-shrink-0 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success">
                <Check className="flex-shrink-0 mr-2" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              onClick={handleCreateChat}
              disabled={isLoading}
              className={`btn btn-primary w-full text-sm sm:text-base ${
                isLoading ? "loading" : ""
              }`}
            >
              {isLoading ? "Creating..." : "Create Chat"}
            </button>

            {chatLink && chatType !== "ai" && (
              <InvitationLink
                chatLink={chatLink}
                linkCopied={linkCopied}
                handleCopyLink={handleCopyLink}
              />
            )}

            <div className="flex justify-end">
              <button onClick={onClose} className="btn btn-ghost btn-sm sm:btn-md">
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
      {isLoading && (
        <div className="fixed inset-0 bg-base-200 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      )}
    </AnimatePresence>
  );
}