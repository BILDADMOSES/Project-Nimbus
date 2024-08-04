"use client"

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import ChatIllustration from '@/components/common/ChatIllustration'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        const callbackUrl = searchParams.get('callbackUrl') as string | undefined
        
        if (callbackUrl) {
          const decodedUrl = decodeURIComponent(callbackUrl)
          const urlParams = new URLSearchParams(decodedUrl.split('?')[1])
          const token = urlParams.get('token')
    
          if (decodedUrl.startsWith('/invite') && token) {
            router.push(`/accept-invite?token=${token}`)
          } else {
            router.push(callbackUrl)
          }
        } else {
          router.push('/chat')
        }
      }
      
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An unexpected error occurred')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Left Column - Sign In Form */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full md:w-1/2 p-4 md:p-8 flex flex-col justify-center items-center"
      >
        <div className="w-full max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">
            Hi, Welcome back!
          </h1>
          <p className="text-sm md:text-base text-gray-500 mb-6 md:mb-8 text-center">
            Enter your details to access your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label pl-0">
                <span className="label-text text-sm md:text-base text-gray-600">
                  Email address
                </span>
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="input input-bordered w-full bg-white text-sm md:text-base"
              />
            </div>
            <div>
              <label className="label pl-0">
                <span className="label-text text-sm md:text-base text-gray-600">
                  Password
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input input-bordered w-full bg-white pr-10 text-sm md:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.066 7.5a10.464 10.464 0 01-4.524 5.527M8.22 8.22l10.56 10.56M15.782 15.78A3.75 3.75 0 118.22 8.22"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-.37 1.178-.94 2.268-1.684 3.203M4.795 4.795a15.978 15.978 0 0111.325-2.105M2.344 2.344l19.312 19.312"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
              <label className="label cursor-pointer">
                <input type="checkbox" className="checkbox checkbox-sm mr-2" />
                <span className="label-text text-sm md:text-base text-gray-600">
                  Remember information
                </span>
              </label>
              <a href="#" className="text-indigo-600 text-sm md:text-base">
                Forgot Password?
              </a>
            </div>
            {error && <p className="text-error text-sm">{error}</p>}
            <button
              type="submit"
              className="btn btn-primary w-full border-none text-sm md:text-base"
            >
              Sign In
            </button>
          </form>

          <p className="text-center mt-6 text-sm md:text-base text-gray-600">
            Don't have an account?{" "}
            <Link href="/signup" className="text-indigo-600 font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Right Column - Chat Interface Illustration */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full md:w-1/2 bg-indigo-100 p-8 hidden md:flex flex-col items-center justify-center"
      >
        <ChatIllustration />
      </motion.div>
    </div>
  )
}