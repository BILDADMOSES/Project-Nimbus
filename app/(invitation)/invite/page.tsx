"use client";
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatIllustration from '@/components/common/ChatIllustration' 
import { useSearchParams, useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'

export default function InvitationLandingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [chatDetails, setChatDetails] = useState<any>(null)
  const [error, setError] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const chatId = searchParams.get('token')
    if (chatId) {
      fetchChatDetails(chatId)
    } else {
      setError('Invalid invitation link')
      setIsLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    if (status === 'authenticated' && chatDetails) {
      setIsRedirecting(true)
      router.push(`/accept-invite?token=${searchParams.get('token')}`)
    }
  }, [status, chatDetails, router, searchParams])

  const fetchChatDetails = async (chatId: string) => {
    console.log(chatId, "Fetching this chat")
    try {
      const chatDocRef = doc(db, 'chats', chatId)
      const chatDocSnap = await getDoc(chatDocRef)

      if (chatDocSnap.exists()) {
        setChatDetails({ id: chatDocSnap.id, ...chatDocSnap.data() })
      } else {
        throw new Error('Chat not found')
      }
    } catch (error) {
      console.error('Error fetching chat details:', error)
      setError('Invalid invitation link')
    } finally {
      setIsLoading(false)
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center">
          <progress className="progress w-56"></progress>
          <p className="mt-4 text-sm md:text-base text-gray-600">
            Loading invitation details...
          </p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l2 2m2-2l-2-2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )
    }

    if (isRedirecting) {
      return (
        <div className="alert flex flex-col alert-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>You've successfully joined the chat! Redirecting...</span>
          <div className="flex justify-center mt-2">
            <progress className="progress w-56"></progress>
          </div>
        </div>
      )
    }

    return (
      <>
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">
          You've been invited to join a chat
        </h1>
        <p className="text-sm md:text-base text-gray-500 mb-6 md:mb-8 text-center">
          {chatDetails?.type === 'group' ? 'Group Chat' : 'Private Chat'}
        </p>
        <div className="mt-8">
          <button
            onClick={() => router.push(`/signin?callbackUrl=${encodeURIComponent(`/invite?token=${searchParams.get('token')}`)}`)}
            className="btn btn-primary w-full mb-4"
          >
            Sign In to Join
          </button>
          <button
            onClick={() => router.push(`/signup?callbackUrl=${encodeURIComponent(`/invite?token=${searchParams.get('token')}`)}`)}
            className="btn btn-secondary w-full mb-4"
          >
            Sign Up to Join
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn btn-outline w-full"
          >
            Go to Home
          </button>
        </div>
      </>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 flex flex-col md:flex-row items-center justify-center py-12 sm:px-6 lg:px-8"
    >
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={isLoading ? 'loading' : isRedirecting ? 'redirecting' : 'content'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <ChatIllustration />
    </motion.div>
  )
}