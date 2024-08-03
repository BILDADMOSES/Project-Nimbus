"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import upload from '@/lib/upload'

export default function UserProfile() {
  const { data: session } = useSession()
  const [username, setUsername] = useState(session?.user?.name || '')
  const [avatar, setAvatar] = useState({
    file: null,
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
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">User Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Username</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input input-bordered"
            />
          </div>
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text">Avatar</span>
            </label>
            <input type="file" onChange={handleAvatar} className="file-input file-input-bordered w-full" />
          </div>
          {avatar.url && (
            <div className="avatar mt-4">
              <div className="w-24 rounded-full">
                <img src={avatar.url} alt="Avatar preview" />
              </div>
            </div>
          )}
          <div className="form-control mt-6">
            <button type="submit" className="btn btn-primary">Update Profile</button>
          </div>
        </form>
      </div>
    </div>
  )
}