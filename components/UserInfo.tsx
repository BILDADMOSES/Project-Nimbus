"use client"
import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { UserCircleIcon, PlusIcon } from '@heroicons/react/24/outline'
import CreateNewChat from "./CreateNewChat"

export default function UserInfo() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false)
  const [selectedChatType, setSelectedChatType] = useState<'private' | 'group' | 'ai' | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const chatMenuRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const toggleChatMenu = () => {
    setIsChatMenuOpen(!isChatMenuOpen)
  }

  const handleChatTypeSelect = (type: 'private' | 'group' | 'ai') => {
    setSelectedChatType(type)
    setIsChatMenuOpen(false)
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
    return <div>Loading...</div>
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
      <div className="flex items-center space-x-4">
        <div className="relative" ref={dropdownRef}>
          <div onClick={toggleDropdown} className="cursor-pointer">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt="User avatar"
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <UserCircleIcon className="h-10 w-10 text-gray-400" />
            )}
          </div>
          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-index: 50">
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                  Profile
                </Link>
                <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
        <div>
          <p className="text-lg font-semibold">{session.user.name}</p>
          <p className="text-sm text-gray-500">{session.user.email}</p>
        </div>
      </div>
      <div className="flex items-center space-x-6 relative" ref={chatMenuRef}>
        <PlusIcon 
          className="h-6 w-6 text-gray-500 hover:text-gray-900 cursor-pointer" 
          onClick={toggleChatMenu}
        />
        {isChatMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 top-full z-index: 50">
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
              <button
                onClick={() => handleChatTypeSelect('private')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                Private Chat
              </button>
              <button
                onClick={() => handleChatTypeSelect('group')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                Group Chat
              </button>
              <button
                onClick={() => handleChatTypeSelect('ai')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                AI Chat
              </button>
            </div>
          </div>
        )}
      </div>
      {selectedChatType && (
        <CreateNewChat 
          chatType={selectedChatType} 
          onClose={() => setSelectedChatType(null)} 
        />
      )}
    </div>
  )
}