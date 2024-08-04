"use client"
import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { UserCircle, Plus, Settings, LogOut } from 'lucide-react'
import CreateNewChat from "./CreateNewChat"
import UserProfilePopup from "./UserProfile"

const Dropdown = ({ isOpen, onClose, title, children }) => {
  return (
    <>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg bg-base-100 ring-1 ring-base-content ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <div className="px-4 py-2 text-sm font-medium text-base-content border-b border-base-300">{title}</div>
            {children}
          </div>
        </div>
      )}
    </>
  )
}

const DropdownItem = ({ onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left px-4 py-2 text-sm text-base-content hover:bg-base-200 transition-colors duration-150"
      role="menuitem"
    >
      {children}
    </button>
  )
}

export default function UserInfo() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false)
  const [selectedChatType, setSelectedChatType] = useState<'private' | 'group' | 'ai' | null>(null)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const chatMenuRef = useRef<HTMLDivElement>(null)
  const profileButtonRef = useRef<HTMLButtonElement>(null)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen)
  const toggleChatMenu = () => setIsChatMenuOpen(!isChatMenuOpen)

  const handleChatTypeSelect = (type: 'private' | 'group' | 'ai') => {
    setSelectedChatType(type)
    setIsChatMenuOpen(false)
  }

  const handleProfileClick = () => {
    if (profileButtonRef.current) {
      const rect = profileButtonRef.current.getBoundingClientRect()
      setPopupPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      })
    }
    setShowProfilePopup(true)
    setIsDropdownOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target as Node)) {
        setIsChatMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-16 bg-base-200">
        <div className="loading loading-spinner loading-md"></div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-base-200 border-b border-base-300">
      <div className="flex items-center space-x-4">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={toggleDropdown}
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-10 rounded-full">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt="User avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-base-300">
                  <UserCircle className="h-8 w-8 text-base-content/50" />
                </div>
              )}
            </div>
          </button>
          <Dropdown isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)} title="User Options">
            <DropdownItem onClick={handleProfileClick}>Profile</DropdownItem>
            <DropdownItem onClick={() => { /* Handle settings click */ }}>Settings</DropdownItem>
            <DropdownItem onClick={handleSignOut}>Logout</DropdownItem>
          </Dropdown>
        </div>
        <div>
          <p className="text-lg font-semibold text-base-content">{session.user.name}</p>
          <p className="text-sm text-base-content/70">{session.user.email}</p>
        </div>
      </div>
      <div className="flex items-center space-x-6 relative" ref={chatMenuRef}>
        <button 
          className="btn btn-circle btn-ghost"
          onClick={toggleChatMenu}
        >
          <Plus className="h-6 w-6" />
        </button>
        <Dropdown isOpen={isChatMenuOpen} onClose={() => setIsChatMenuOpen(false)} title="New Chat">
          <DropdownItem onClick={() => handleChatTypeSelect('private')}>Private Chat</DropdownItem>
          <DropdownItem onClick={() => handleChatTypeSelect('group')}>Group Chat</DropdownItem>
          <DropdownItem onClick={() => handleChatTypeSelect('ai')}>AI Chat</DropdownItem>
        </Dropdown>
      </div>
      {selectedChatType && (
        <CreateNewChat 
          chatType={selectedChatType} 
          onClose={() => setSelectedChatType(null)} 
        />
      )}
      {showProfilePopup && (
        <UserProfilePopup 
          onClose={() => setShowProfilePopup(false)} 
          position={popupPosition}
        />
      )}
    </div>
  )
}