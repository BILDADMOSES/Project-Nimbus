import React from "react";
import { User as UserIcon, X } from "lucide-react";
import { motion } from "framer-motion";
import { User } from "@/types";

interface SelectedUsersProps {
  selectedUsers: User[];
  handleRemoveUser: (userId: string) => void;
}

const SelectedUsers: React.FC<SelectedUsersProps> = ({
  selectedUsers,
  handleRemoveUser,
}) => {
  if (selectedUsers.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-base-content/70 mb-2">
        Selected Users
      </h3>
      <div className="flex flex-wrap gap-2">
        {selectedUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="badge badge-primary badge-outline gap-2"
          >
            <UserIcon size={14} />
            {user.username}
            <button
              onClick={() => handleRemoveUser(user.id)}
              className="btn btn-ghost btn-xs btn-circle"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SelectedUsers;