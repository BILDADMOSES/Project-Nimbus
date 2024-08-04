import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebaseClient'
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import upload from '@/lib/upload'
import { X, Camera, Edit, Key, Save, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { languages } from '@/constants'

interface UserProfilePopupProps {
  onClose: () => void
  position: { top: number; left: number }
}

export default function UserProfilePopup({ onClose, position }: UserProfilePopupProps) {
  const { data: session, update } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    fullName: '',
    preferredLang: '',
    avatar: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        const userRef = doc(db, 'users', session.user.id)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          const data = userSnap.data()
          setUserData({
            username: data.username || '',
            email: data.email || '',
            fullName: data.fullName || '',
            preferredLang: data.preferredLang || '',
            avatar: data.avatar || '',
          })
        }
        setIsLoading(false)
      }
    }
    fetchUserData()
  }, [session])

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setUserData(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    if (!session?.user?.id) return

    try {
      const userRef = doc(db, 'users', session.user.id)
      await updateDoc(userRef, userData)

      await update({
        ...session,
        user: {
          ...session.user,
          name: userData.username,
          image: userData.avatar,
        },
      })

      setIsEditing(false)
    } catch (err) {
      setError('Failed to update profile. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError('New passwords do not match.')
      setIsLoading(false)
      return
    }

    try {
      const user = auth.currentUser
      if (!user || !user.email) throw new Error('User not found')

      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, passwordData.newPassword)

      setIsChangingPassword(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
    } catch (err) {
      setError('Failed to change password. Please check your current password and try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsLoading(true)
      setError('')
      try {
        const avatarUrl = await upload(file)
        setUserData(prev => ({ ...prev, avatar: avatarUrl }))
        
        if (session?.user?.id) {
          const userRef = doc(db, 'users', session.user.id)
          await updateDoc(userRef, { avatar: avatarUrl })

          await update({
            ...session,
            user: {
              ...session.user,
              image: avatarUrl,
            },
          })
        }
      } catch (err) {
        setError('Failed to upload image. Please try again.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const renderField = (label: string, value: string) => {
    if (!value) return null
    return (
      <div className="mb-2">
        <span className="text-sm text-base-content/70">{label}:</span>
        <span className="ml-2 text-base-content">{value}</span>
      </div>
    )
  }

  return (
    <div 
      className="fixed bg-base-200 rounded-lg shadow-xl z-40 w-96 overflow-hidden"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10">
        <X size={20} />
      </button>
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      ) : (
        <div className="p-6">
          <div className="flex flex-col items-center mb-4">
            <div className="relative mb-4">
              {userData.avatar ? (
                <Image
                  src={userData.avatar}
                  alt="User avatar"
                  width={100}
                  height={100}
                  className="rounded-full border-4 border-base-300"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center border-4 border-base-200">
                  <span className="text-3xl text-base-content">{userData.username?.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <label htmlFor="avatar-upload" className="btn btn-circle btn-sm btn-primary absolute bottom-0 right-0">
                <Camera size={16} />
              </label>
              <input
                type="file"
                id="avatar-upload"
                onChange={handleAvatar}
                className="hidden"
              />
            </div>
            <h2 className="text-2xl font-bold text-base-content">{userData.username}</h2>
          </div>
          
          {error && <div className="alert alert-error mb-4">{error}</div>}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {Object.entries(userData).map(([key, value]) => (
                key !== 'avatar' && (
                  <div key={key}>
                    <label htmlFor={key} className="label">
                      <span className="label-text">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    </label>
                    {key === 'preferredLang' ? (
                      <select
                        id={key}
                        name={key}
                        value={value}
                        onChange={handleFieldChange}
                        className="select select-bordered w-full"
                      >
                        <option value="">Select a language</option>
                        {languages.map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        id={key}
                        name={key}
                        value={value}
                        onChange={handleFieldChange}
                        className="input input-bordered w-full"
                      />
                    )}
                  </div>
                )
              ))}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} className="mr-2" /> Save Changes
                </button>
              </div>
            </form>
          ) : isChangingPassword ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {['currentPassword', 'newPassword', 'confirmNewPassword'].map((field) => (
                <div key={field}>
                  <label htmlFor={field} className="label">
                    <span className="label-text">{field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords[field] ? "text" : "password"}
                      id={field}
                      name={field}
                      value={passwordData[field]}
                      onChange={handlePasswordFieldChange}
                      className="input input-bordered w-full pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility(field)}
                    >
                      {showPasswords[field] ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsChangingPassword(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Key size={16} className="mr-2" /> Change Password
                </button>
              </div>
            </form>
          ) : (
            <>
              {renderField('Username', userData.username)}
              {renderField('Email', userData.email)}
              {renderField('Full Name', userData.fullName)}
              {renderField('Preferred Language', languages.find(lang => lang.code === userData.preferredLang)?.name || '')}
              <div className="flex justify-between mt-6">
                <button onClick={() => setIsEditing(true)} className="btn btn-outline btn-primary btn-sm">
                  <Edit size={16} className="mr-2" /> Edit Profile
                </button>
                <button onClick={() => setIsChangingPassword(true)} className="btn btn-outline btn-sm">
                  <Key size={16} className="mr-2" /> Change Password
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}