import { Bot, Search, UserPlus, Users, Plus, Minus } from "lucide-react";
import { DropdownItem } from "./common/Dropdown";
import { useState } from "react";

interface SearchBarProps {
  onNewChat: (type: "private" | "group" | "ai") => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function SearchBar({
  onNewChat,
  searchTerm,
  setSearchTerm,
}: SearchBarProps) {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const handleChatTypeSelect = (type: "private" | "group" | "ai") => {
    onNewChat(type);
    closeAllMenus();
  };

  const closeAllMenus = () => {
    setIsNewChatOpen(false);
  };

  return (
    <div className="relative p-4">
      <div className="flex items-center space-x-5 justify-between">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full pl-10 pr-4"
          />
          <Search
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-base-content/50"
            size={20}
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setIsNewChatOpen(!isNewChatOpen)}
            className="bg-transparent border w-12 h-10 flex justify-center items-center rounded-lg"
          >
            {isNewChatOpen ? (
              <Minus size={24} className="text-base-content" />
            ) : (
              <Plus size={24} className="text-base-content" />
            )}
          </button>
          {isNewChatOpen && (
            <div className="absolute right-full md:left-[140%] top-0 mr-2 w-56 rounded-md shadow-lg bg-base-100 ring-1 ring-base-content ring-opacity-5 z-50">
              <div className="py-1">
                <DropdownItem
                  onClick={() => handleChatTypeSelect("private")}
                  icon={<UserPlus size={16} />}
                >
                  One-on-One Chat
                </DropdownItem>
                <DropdownItem
                  onClick={() => handleChatTypeSelect("group")}
                  icon={<Users size={16} />}
                >
                  Group Discussion
                </DropdownItem>
                {/* <DropdownItem
                  onClick={() => handleChatTypeSelect("ai")}
                  icon={<Bot size={16} />}
                >
                  AI Assistant
                </DropdownItem> */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}