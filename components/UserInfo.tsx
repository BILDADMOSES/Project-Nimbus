"use client"
import React, { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/common/Logo'
import UserAvatar from './UserAvatar'
import UserMenu from './UserMenu'
import UsageModal from './UsageModal'
import CreateNewChat from "./CreateNewChat"
import { LoadingSpinner } from "@/components/LoadingSpinner";
import UserProfilePopup from "./UserProfile"
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import upload from '@/lib/upload'
import ActionButton from "@/components/ActionButton";
import { getUsageStatus, UsageLimits } from '@/lib/usageTracking'
import { X } from "lucide-react";
import TranslucentCard from './TranslucentCard'

export default function UserInfo() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [selectedChatType, setSelectedChatType] = useState<'private' | 'group' | 'ai' | null>(null)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [showUsageTracking, setShowUsageTracking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false)
  const [usageData, setUsageData] = useState<UsageLimits | null>(null)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  const handleChatTypeSelect = (type: 'private' | 'group' | 'ai') => {
    setSelectedChatType(type)
  }

  const handleProfileClick = () => {
    setShowProfilePopup(true)
  }

  const handleImageChange = async (file: File) => {
    if (session?.user?.id) {
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

  const fetchUsageStatus = async () => {
    if (session?.user?.id) {
      const usage = await getUsageStatus(session.user.id)
      setUsageData(usage)
    }
  }

  const handleUsageClick = () => {
    fetchUsageStatus()
    setIsUsageModalOpen(true)
  }

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
    <div className="z-50 bg-base-100 backdrop-blur-md bg-opacity-80 text-base-content p-2 md:p-4 flex items-center justify-between border-b border-base-300">
      <div className="flex items-center space-x-4 overflow-hidden">
        <UserAvatar user={session.user} onImageChange={handleImageChange} />
        <div className="flex flex-col justify-center overflow-hidden">
          <Logo height={30} width={30} fontSize='text-xl'/>
          <p className="text-xs text-base-content/70 truncate">{session.user.email}</p>
        </div>
      </div>
      {error && <div className="alert alert-error text-xs absolute bottom-0 left-0 right-0">{error}</div>}
      <UserMenu
        onNewChat={handleChatTypeSelect}
        onProfileClick={handleProfileClick}
        onUsageClick={handleUsageClick}
        onSignOut={handleSignOut}
      />
      {selectedChatType && (
        <CreateNewChat 
          chatType={selectedChatType} 
          onClose={() => setSelectedChatType(null)} 
        />
      )}
      {showProfilePopup && (
        <div className="fixed top-0 left-0 z-50">
          <UserProfilePopup 
            onClose={() => setShowProfilePopup(false)} 
            position={{ top: 0, left: 0 }}
          />
        </div>
      )}
      <TranslucentCard
       style={{ top: `${0}px`, left: `${0}px` }}
      className="fixed z-40 w-96 overflow-hidden"
      >
          <ActionButton
        label={<X size={20} />}
        onClick={() => setIsUsageModalOpen(false)}
        className="btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
      />
      {isLoading ? (
        <LoadingSpinner />
      ) : (
      <UsageModal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
        usageData={usageData}
      />
    )}
      </TranslucentCard>
      </div>
  )
}