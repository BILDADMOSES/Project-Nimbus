import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import upload from '@/lib/upload'
import { X } from 'lucide-react'

interface UserProfilePopupProps {
  onClose: () => void
  position: { top: number; left: number }
}

export default function UserProfilePopup({ onClose, position }: UserProfilePopupProps) {
  const { data: session, update } = useSession()
  const [username, setUsername] = useState(session?.user?.name || '')
  const [avatar, setAvatar] = useState({
    file: null as File | null,
    url: session?.user?.image || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return

    let avatarUrl = avatar.url
    if (avatar.file) {
      avatarUrl = await upload(avatar.file)
    }

    const userRef = doc(db, 'users', session.user.id)
    await updateDoc(userRef, {
      username,
      avatar: avatarUrl,
    })

    // Update the session with the new user data
    await update({
      ...session,
      user: {
        ...session.user,
        name: username,
        image: avatarUrl,
      },
    })

    onClose()
  }

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatar({
        file,
        url: URL.createObjectURL(file),
      })
    }
  }

  return (
    <div 
      className="fixed bg-white rounded-lg p-6 w-96 shadow-lg z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
        <X size={24} />
      </button>
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#a060ff]"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
            Avatar
          </label>
          <input
            type="file"
            id="avatar"
            onChange={handleAvatar}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#a060ff]"
          />
        </div>
        {avatar.url && (
          <div className="mb-4">
            <img src={avatar.url} alt="Avatar preview" className="w-24 h-24 rounded-full object-cover" />
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-[#a060ff] text-white rounded-md px-4 py-2 hover:bg-[#8040df] focus:outline-none focus:ring-2 focus:ring-[#a060ff]"
        >
          Update Profile
        </button>
      </form>
    </div>
  )
}