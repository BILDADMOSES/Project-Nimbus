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
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-sm md:text-base text-base-content/70">
            Loading invitation details...
          </p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )
    }

    return (
      <>
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center text-base-content">
          You've been invited to join a chat
        </h1>
        <p className="text-sm md:text-base text-base-content/70 mb-6 md:mb-8 text-center">
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
    <>
      {isRedirecting && (
        <div className="fixed inset-0 bg-base-200 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full min-h-screen flex flex-col md:flex-row items-center justify-center py-12 sm:px-6 lg:px-8"
      >
        <div className="w-full md:w-1/2 flex justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLoading ? 'loading' : 'content'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full md:w-1/2 bg-base-300 p-8 hidden md:flex flex-col items-center justify-center"
        >
          <ChatIllustration />
        </motion.div>
      </motion.div>
    </>
  )
}
