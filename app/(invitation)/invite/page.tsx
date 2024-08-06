"use client";
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatIllustration from '@/components/common/ChatIllustration' 
import { useSearchParams, useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import InvitationCard from '@/components/InvitationCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import ActionButton from '@/components/ActionButton'
import ErrorAlert from '@/components/ErrorAlert'

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
      return <LoadingSpinner message="Loading invitation details..." />
    }

    if (error) {
      return <ErrorAlert message={error} />
    }

    return (
      <InvitationContent 
        chatType={chatDetails?.type} 
        token={searchParams.get('token') || ''}
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-200">
      {isRedirecting && <LoadingOverlay />}
      <InvitationCard>
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLoading ? 'loading' : 'content'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="w-full md:w-1/2 hidden md:flex items-center justify-center bg-base-200 rounded-r-lg">
            <ChatIllustration />
          </div>
        </div>
      </InvitationCard>
    </div>
  )
}

const InvitationContent: React.FC<{ chatType?: string; token: string }> = ({ chatType, token }) => (
  <>
    <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center text-base-content">
      You've been invited to join a chat
    </h1>
    <p className="text-sm md:text-base text-base-content/70 mb-6 md:mb-8 text-center">
      {chatType === 'group' ? 'Group Chat' : 'Private Chat'}
    </p>
    <div className="mt-8 space-y-4">
      <ActionButton
        label="Sign Up to Join"
        href={`/signup?callbackUrl=${encodeURIComponent(`/invite?token=${token}`)}`}
        className="w-full"
      />
      <div className="text-center">
        Already have an account? <ActionButton
          label="Sign In"
          href={`/signin?callbackUrl=${encodeURIComponent(`/invite?token=${token}`)}`}
          className="btn-link"
        />
      </div>
      <ActionButton
        label="Go to Home"
        onClick={() => router.push('/')}
        className="w-full btn-outline"
      />
    </div>
  </>
)

const LoadingOverlay: React.FC = () => (
  <div className="fixed inset-0 bg-base-200 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="loading loading-spinner loading-lg text-primary"></div>
  </div>
)