
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Plus, Paperclip, Smile, Mic, Send, UserPlus, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useWebSocket } from "@/hooks/useWebsocket";

interface GroupChatInterfaceProps {
  groupId: string;
}

const GroupChatInterface = ({ groupId }: GroupChatInterfaceProps) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [message, setMessage] = useState("");

  const {
    isConnected,
    messages,
    sendMessage,
  } = useWebSocket(userId || "", groupId, "group");

  useEffect(() => {
    // Fetch group information
    fetch(`/api/groups/${groupId}`)
      .then((response) => response.json())
      .then((data) => setGroupInfo(data))
      .catch((error) => console.error("Error fetching group info:", error));
  }, [groupId]);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message, session?.user?.preferredLanguage || "en");
      setMessage("");
    }
  };

  const handleAddMember = () => {
    // Implement logic to add a new member to the group
    console.log("Add member clicked");
  };

  const handleLeaveGroup = () => {
    // Implement logic to leave the group
    console.log("Leave group clicked");
  };

  return (
    <div className="flex h-screen bg-base-100">
        {/* Group info sidebar */}
      <div className="w-1/4 bg-base-200 border-l border-base-300 p-4">
        <h2 className="text-xl font-semibold mb-4">Group Members</h2>
        <div className="space-y-4">
          {groupInfo?.members?.map((member: any) => (
            <div key={member.id} className="flex items-center">
              <div className="avatar">
                <div className="w-8 h-8 rounded-full mr-2">
                  <img src={member.avatar} alt={member.name} />
                </div>
              </div>
              <div>
                <div className="font-semibold">{member.name}</div>
                <div className="text-xs text-base-content">{member.status || "Member"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Group chat area */}
      <div className="flex-1 flex flex-col bg-base-100">
        {/* Group chat header */}
        <div className="bg-base-200 p-4 border-b border-base-300 flex items-center">
          <div className="avatar">
            <div className="w-10 h-10 rounded-full">
              <img src={groupInfo?.avatar} alt={groupInfo?.name} />
            </div>
          </div>
          <div className="ml-3">
            <div className="font-semibold">{groupInfo?.name}</div>
            <div className="text-sm text-success">
              {groupInfo?.members?.length || 0} members
            </div>
          </div>
          <div className="dropdown dropdown-end ml-auto">
            <label tabIndex={0} className="btn btn-ghost btn-circle">
              <Settings className="w-5 h-5" />
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
              <li><a onClick={handleAddMember}><UserPlus className="w-4 h-4 mr-2" /> Add Member</a></li>
              <li><a onClick={handleLeaveGroup} className="text-error">Leave Group</a></li>
            </ul>
          </div>
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
              <motion.div
                key={msg.id}
                className={`flex items-end ${
                  msg.senderId === userId ? "justify-end" : "justify-start"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {msg.senderId !== userId && (
                  <div className="avatar">
                    <div className="w-8 h-8 rounded-full mr-2">
                      <img src={msg.sender?.avatar} alt={msg.sender?.name} />
                    </div>
                  </div>
                )}
                <div
                  className={`chat-bubble ${
                    msg.senderId === userId
                      ? "chat-bubble-primary"
                      : "chat-bubble-secondary"
                  }`}
                >
                  {msg.senderId !== userId && (
                    <div className="font-semibold text-xs mb-1">{msg.sender?.name}</div>
                  )}
                  <p className="text-sm break-words text-wrap">{msg.content}</p>
                </div>
                <div className="text-xs text-base-content ml-2">
                  {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </motion.div>
            ))}
        </div>

        {/* Message input */}
        <div className="bg-base-200 p-4 border-t border-base-300">
          <div className="flex items-center bg-base-300 rounded-full px-4">
            <Smile className="w-6 h-6 text-base-content" />
            <input
              type="text"
              placeholder="Type message..."
              className="input input-ghost w-full focus:outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Paperclip className="w-6 h-6 text-base-content ml-2" />
            <Mic className="w-6 h-6 text-base-content ml-2" />
            <button
              onClick={handleSendMessage}
              className="btn btn-circle btn-primary ml-2"
              disabled={!isConnected}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default GroupChatInterface;