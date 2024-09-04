import React, { useState, useEffect, useRef } from "react";
import {
  MoreVertical,
  MessageSquarePlus,
  UserCircle,
  Settings,
  LogOut,
  UserPlus,
  Users,
  Bot,
  Sun,
  Moon,
  Monitor,
  BarChart2,
} from "lucide-react";
import { Dropdown, DropdownItem } from "./common/Dropdown";
import { useTheme } from "./ThemeProvider";

interface UserMenuProps {
  onNewChat: (type: "private" | "group" | "ai") => void;
  onProfileClick: () => void;
  onUsageClick: () => void;
  onSignOut: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  onNewChat,
  onProfileClick,
  onUsageClick,
  onSignOut,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleChatTypeSelect = (type: "private" | "group" | "ai") => {
    onNewChat(type);
    closeAllMenus();
  };

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsNewChatOpen(false);
    setIsSettingsOpen(false);
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    closeAllMenus();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeAllMenus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button className="btn btn-circle btn-ghost" onClick={toggleMenu}>
        <MoreVertical className="h-6 w-6" />
      </button>
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-base-100 ring-1 ring-base-content ring-opacity-5 z-50">
          <div className="py-1 max-h-[calc(100vh-100px)] overflow-y-auto">
            <DropdownItem onClick={() => setIsNewChatOpen(!isNewChatOpen)} icon={<MessageSquarePlus size={16} />}>
              Start New Conversation
              {isNewChatOpen && (
                <div className="absolute sm:left-full sm:top-0 left-0 right-auto sm:right-full top-0 mt-0 w-56 rounded-md shadow-lg bg-base-100 ring-1 ring-base-content ring-opacity-5">
                  <div className="py-1">
                    <DropdownItem onClick={() => handleChatTypeSelect('private')} icon={<UserPlus size={16} />}>
                      One-on-One Chat
                    </DropdownItem>
                    <DropdownItem onClick={() => handleChatTypeSelect('group')} icon={<Users size={16} />}>
                      Group Discussion
                    </DropdownItem>
                    <DropdownItem onClick={() => handleChatTypeSelect('ai')} icon={<Bot size={16} />}>
                      AI Assistant
                    </DropdownItem>
                  </div>
                </div>
              )}
            </DropdownItem>
            <DropdownItem
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              icon={<Settings size={16} />}
            >
              Settings
              {isSettingsOpen && (
                <div className="absolute sm:left-full sm:top-0 left-0 right-auto sm:right-full top-0 mt-0 w-56 rounded-md shadow-lg bg-base-100 ring-1 ring-base-content ring-opacity-5">
                  <div className="py-1">
                    <DropdownItem
                      onClick={() => handleThemeChange("light")}
                      icon={<Sun size={16} />}
                    >
                      Light Theme
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => handleThemeChange("dark")}
                      icon={<Moon size={16} />}
                    >
                      Dark Theme
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => handleThemeChange("system")}
                      icon={<Monitor size={16} />}
                    >
                      System Theme
                    </DropdownItem>
                  </div>
                </div>
              )}
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                onUsageClick();
                closeAllMenus();
              }}
              icon={<BarChart2 size={16} />}
            >
              Usage Status
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                onSignOut();
                closeAllMenus();
              }}
              icon={<LogOut size={16} />}
            >
              Logout
            </DropdownItem>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
