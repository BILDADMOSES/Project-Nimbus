import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  FileIcon,
  ImageIcon,
  FileText,
  Music,
  Video,
  Archive,
  UserMinus,
  LogOut,
  Trash2,
  Users,
  UserCircle,
} from "lucide-react";
import { format } from "date-fns";

interface UserData {
  id: string;
  username: string;
  email: string;
  image?: string;
  fullName?: string;
  joinDate?: any;
  location?: string;
  language?: string;
  avatar?: string;
}

interface SharedFile {
  id: string;
  content: string;
  type: "image" | "file";
  fileUrl?: string;
  timestamp: any;
}

interface UserDetailsSidebarProps {
  user?: UserData;
  chatType: "private" | "group" | "ai";
  sharedFiles: SharedFile[];
  onClose: () => void;
  participants?: UserData[];
  onBlockUser?: (userId: string) => void;
  onLeaveGroup?: () => void;
  onDeleteChat?: () => void;
  isOpen: boolean;
  isMobile?: boolean;
}

const UserDetailsSidebar: React.FC<UserDetailsSidebarProps> = ({
  user,
  chatType,
  sharedFiles,
  onClose,
  participants,
  onBlockUser,
  onLeaveGroup,
  onDeleteChat,
  isOpen,
  isMobile,
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(0);

  useEffect(() => {
    if (isMobile) {
      setSidebarWidth(isOpen ? window.innerWidth : 0);
    } else {
      setSidebarWidth(isOpen ? 384 : 0); 
    }
  }, [isOpen, isMobile]);

  const formatDate = (timestamp: any) => {
    if (timestamp && typeof timestamp.toDate === "function") {
      return format(timestamp.toDate(), "MMM d, yyyy HH:mm");
    } else if (timestamp instanceof Date) {
      return format(timestamp, "MMM d, yyyy HH:mm");
    } else if (timestamp && !isNaN(new Date(timestamp).getTime())) {
      return format(new Date(timestamp), "MMM d, yyyy HH:mm");
    }
    return "Invalid date";
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return <ImageIcon size={24} className="text-primary" />;
      case "pdf":
        return <FileText size={24} className="text-red-500" />;
      case "audio":
        return <Music size={24} className="text-yellow-500" />;
      case "video":
        return <Video size={24} className="text-purple-500" />;
      case "archive":
        return <Archive size={24} className="text-orange-500" />;
      default:
        return <FileIcon size={24} className="text-secondary" />;
    }
  };

  const renderUserInfo = (userData: UserData) => (
    <div className="flex flex-col items-center p-4">
      <div className="avatar mb-4">
        <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
          <Image
            src={userData.avatar || userData.image || "/default-avatar.png"}
            alt={userData.username}
            width={96}
            height={96}
          />
        </div>
      </div>
      <h3 className="text-lg font-semibold">
        {userData.fullName || userData.username}
      </h3>
      <p className="text-sm text-base-content/70">{userData.email}</p>
      {userData.location && (
        <p className="text-sm text-base-content/70">{userData.location}</p>
      )}
      {userData.language && (
        <p className="text-sm text-base-content/70">
          Language: {userData.language}
        </p>
      )}
      {userData.joinDate && (
        <p className="text-sm text-base-content/70">
          Joined: {formatDate(userData.joinDate)}
        </p>
      )}
    </div>
  );

  const renderGroupInfo = () => {
    const participantsArray = participants 
      ? (Array.isArray(participants) ? participants : Object.values(participants))
      : [];
  
    return (
      <div className="p-4">
        <div className="flex items-center justify-center mb-4">
          <div className="avatar placeholder">
            <div className="bg-neutral-focus text-neutral-content rounded-full w-24">
              <Users size={48} />
            </div>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-center mb-2">Group Chat</h3>
        <p className="text-sm text-base-content/70 text-center mb-4">
          {participantsArray.length} members
        </p>
        <h4 className="text-md font-semibold mb-2">Members</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {participantsArray.map((participant: UserData) => (
            <div key={participant.id} className="flex items-center">
              <div className="avatar mr-2">
                <div className="w-8 h-8 rounded-full">
                  {participant.image || participant.avatar ?
                  <Image
                    src={participant.image || participant.avatar || "/default-avatar.png"}
                    alt={participant.username}
                    width={32}
                    height={32}
                  /> :
                  <UserCircle className="h-8 w-8 text-base-content/50" />}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">{participant.username}</p>
                <p className="text-xs text-base-content/70">{participant.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`z-50 bg-base-100 shadow-xl backdrop-blur-md bg-opacity-80 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
        isMobile
          ? "fixed right-0 top-0 bottom-0"
          : ""
      }`}
      style={{ width: isMobile ? "100%" : `${sidebarWidth}px` }}
    >
      <div className="flex justify-between items-center p-4 border-b border-base-300">
        <h2 className="text-xl font-bold">
          {chatType === "private"
            ? "User Details"
            : chatType === "group"
            ? "Group Details"
            : "AI Chat Details"}
        </h2>
        <button onClick={onClose} className="btn btn-ghost btn-circle">
          <X size={24} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto">
        {chatType === "private" && user && renderUserInfo(user)}
        {chatType === "group" && renderGroupInfo()}
        {chatType === "ai" && (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">AI Assistant</h3>
            <p className="text-base-content/70">
              This is an AI-powered chat assistant.
            </p>
          </div>
        )}

        <div className="divider"></div>

        <div className="p-4">
          <h4 className="text-lg font-semibold mb-4">Shared Files</h4>
          <div className="space-y-4">
            {sharedFiles && sharedFiles.length > 0 ? (
              sharedFiles.map((file) => (
                <div
                  key={file.id}
                  className="card bg-base-100 shadow-sm rounded-md"
                >
                  <div className="card-body p-2">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {file.type === "image" ? (
                          <div className="w-16 h-16 relative">
                            <Image
                              src={file.fileUrl || "/placeholder-image.jpg"}
                              alt={file.content}
                              layout="fill"
                              objectFit="cover"
                              className="rounded-md"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-base-300 rounded-md flex items-center justify-center">
                            {getFileIcon(file.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-sm font-semibold">{file.content}</h3>
                        <p className="text-xs text-base-content/70">
                          {formatDate(file.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="card-actions justify-end mt-2">
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                      >
                        {file.type === "image" ? "View" : "Download"}
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-base-content/70">No shared files found.</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-base-300">
        {chatType === "private" && onBlockUser && user && (
          <button
            className="btn btn-error btn-block"
            onClick={() => onBlockUser(user.id)}
          >
            <UserMinus size={20} className="mr-2" /> Block User
          </button>
        )}
        {chatType === "group" && onLeaveGroup && (
          <button className="btn btn-warning btn-block" onClick={onLeaveGroup}>
            <LogOut size={20} className="mr-2" /> Leave Group
          </button>
        )}
        {chatType === "ai" && onDeleteChat && (
          <button className="btn btn-error btn-block" onClick={onDeleteChat}>
            <Trash2 size={20} className="mr-2" /> Delete Chat
          </button>
        )}
      </div>
    </div>
  );
};

export default UserDetailsSidebar;