import React, { useState } from "react";
import { Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useUserSearch } from "../hooks/useUserSearch";
import { User } from "@/types";

interface UserSearchProps {
  chatType: "private" | "group" | "ai";
  selectedUsers: User[];
  setSelectedUsers: React.Dispatch<React.SetStateAction<User[]>>;
  handleInvite: (email: string) => Promise<void>;
}

const UserSearch: React.FC<UserSearchProps> = ({
  chatType,
  selectedUsers,
  setSelectedUsers,
  handleInvite,
}) => {
  const {
    searchTerm,
    setSearchTerm,
    searchType,
    setSearchType,
    showInvite,
    setShowInvite,
    inviteEmail,
    setInviteEmail,
    handleSearch,
  } = useUserSearch(setSelectedUsers);

  return (
    <div className="form-control mb-6">
      <label htmlFor="searchUsers" className="label">
        <span className="label-text">Add User</span>
      </label>
      <div className="flex mb-2">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as "username" | "email")}
          className="select select-bordered flex-shrink-0 mr-2"
        >
          <option value="username">Username</option>
          <option value="email">Email</option>
        </select>
        <input
          type="text"
          id="searchUsers"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-bordered flex-grow"
          placeholder={`Enter ${searchType}`}
        />
        <button onClick={handleSearch} className="btn btn-primary ml-2">
          Add
        </button>
      </div>

      {showInvite && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="alert alert-info">
            <Mail className="flex-shrink-0 mr-2" />
            <span>User not found. Send an invitation?</span>
          </div>
          <div className="flex mt-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="input input-bordered flex-grow"
              placeholder="Enter email"
            />
            <button
              onClick={() => handleInvite(inviteEmail)}
              className="btn btn-primary ml-2"
            >
              Invite
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UserSearch;