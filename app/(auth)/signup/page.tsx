// app/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '@/lib/firebaseClient'
import Image from 'next/image'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0])
      setAvatarPreview(URL.createObjectURL(e.target.files[0]))
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      let avatarUrl = null
      if (avatar) {
        const avatarRef = ref(storage, `avatars/${user.uid}`)
        await uploadBytes(avatarRef, avatar)
        avatarUrl = await getDownloadURL(avatarRef)
      }

      await updateProfile(user, {
        displayName: username,
        photoURL: avatarUrl
      })

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        username: username,
        avatar: avatarUrl,
        createdAt: new Date().toISOString()
      })

      router.push('/chat')
    } catch (error) {
      setError('Failed to create an account. Please try again.')
      console.error('Error during signup:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#a060ff] to-[#00e4e3]">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h2 className="text-3xl font-bold mb-6 text-center text-[#a060ff]">Sign Up</h2>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#a060ff] focus:ring focus:ring-[#a060ff] focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#a060ff] focus:ring focus:ring-[#a060ff] focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#a060ff] focus:ring focus:ring-[#a060ff] focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">Avatar (optional)</label>
            <input
              type="file"
              id="avatar"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-[#a060ff] file:text-white
                hover:file:bg-[#8040df]"
            />
          </div>
          {avatarPreview && (
            <div className="mt-2 flex justify-center">
              <Image src={avatarPreview} alt="Avatar preview" width={100} height={100} className="rounded-full" />
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#a060ff] hover:bg-[#8040df] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a060ff]"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/signin" className="font-medium text-[#a060ff] hover:text-[#8040df]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}