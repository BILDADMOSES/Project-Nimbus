"use client"
import React, { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from './ThemeProvider';
import Image from 'next/image'
import { 
  MessageSquarePlus, 
  UserCircle, 
  Settings, 
  LogOut, 
  UserPlus, 
  Users, 
  Bot, 
  Camera,
  MoreVertical,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react'
import CreateNewChat from "./CreateNewChat"
import UserProfilePopup from "./UserProfile"
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import upload from '@/lib/upload'
import { Dropdown, DropdownItem } from './common/Dropdown'
import Logo from '@/components/common/Logo'

export default function UserInfo() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [selectedChatType, setSelectedChatType] = useState<'private' | 'group' | 'ai' | null>(null)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [error, setError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)


  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const handleChatTypeSelect = (type: 'private' | 'group' | 'ai') => {
    setSelectedChatType(type)
    setIsNewChatOpen(false)
    setIsMenuOpen(false)
  }

  const handleProfileClick = () => {
    setShowProfilePopup(true)
    setIsMenuOpen(false)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && session?.user?.id) {
      setIsLoading(true)
      setError('')
      try {
        const avatarUrl = await upload(file)
        
        const userRef = doc(db, 'users', session.user.id)
        await updateDoc(userRef, { avatar: avatarUrl })

        await update({
          ...session,
          user: {
            ...session.user,
            image: avatarUrl,
          },
        })
      } catch (err) {
        setError('Failed to upload image. Please try again.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
        setIsNewChatOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (status === 'loading' || isLoading) {
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
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden">
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
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="absolute bottom-0 right-0 bg-primary text-primary-content rounded-full p-1"
          >
            <Camera size={12} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
        </div>
        <div>
          <Logo height={45} width={45} fontSize='text-3xl'/>
          <p className="text-sm text-base-content/70">{session.user.email}</p>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="relative" ref={menuRef}>
        <button 
          className="btn btn-circle btn-ghost"
          onClick={toggleMenu}
        >
          <MoreVertical className="h-6 w-6" />
        </button>
        <Dropdown isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} title="Menu" className="origin-top-right right-0 mt-2">
          <DropdownItem onClick={() => setIsNewChatOpen(!isNewChatOpen)} icon={<MessageSquarePlus size={16} />}>
            Start New Conversation
            {isNewChatOpen && (
              <div className="absolute left-full top-0 ml-2 w-56 rounded-lg shadow-lg bg-base-100 ring-1 ring-base-content ring-opacity-5">
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
          <DropdownItem onClick={handleProfileClick} icon={<UserCircle size={16} />}>Profile</DropdownItem>
          <DropdownItem onClick={() => setIsSettingsOpen(!isSettingsOpen)} icon={<Settings size={16} />}>
            Settings
            {isSettingsOpen && (
              <div className="absolute left-full top-0 ml-2 w-56 rounded-lg shadow-lg bg-base-100 ring-1 ring-base-content ring-opacity-5">
                <div className="py-1">
                  <DropdownItem onClick={() => setIsThemeOpen(!isThemeOpen)} icon={<Sun size={16} />}>
                    Themes
                    {isThemeOpen && (
                      <div className="absolute left-full top-0 ml-2 w-56 rounded-lg shadow-lg bg-base-100 ring-1 ring-base-content ring-opacity-5">
                        <div className="py-1">
                          <DropdownItem onClick={() => setTheme('light')} icon={<Sun size={16} />}>
                            Light Theme
                          </DropdownItem>
                          <DropdownItem onClick={() => setTheme('dark')} icon={<Moon size={16} />}>
                            Dark Theme
                          </DropdownItem>
                          <DropdownItem onClick={() => setTheme('system')} icon={<Monitor size={16} />}>
                            System Theme
                          </DropdownItem>
                        </div>
                      </div>
                    )}
                  </DropdownItem>
                  {/* ... other settings */}
                </div>
              </div>
            )}
          </DropdownItem>
          <DropdownItem onClick={handleSignOut} icon={<LogOut size={16} />}>Logout</DropdownItem>
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