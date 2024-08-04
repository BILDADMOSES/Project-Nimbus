"use client"
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { doc, getDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { motion, AnimatePresence } from 'framer-motion'

export default function AcceptInvitation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatId = searchParams.get('token')
  const { data: session, status } = useSession()
  const [error, setError] = useState('')
  const [state, setState] = useState('loading') // 'loading', 'accepting', 'redirecting', 'error'

  useEffect(() => {
    if (status === 'authenticated' && chatId) {
      handleAcceptInvitation()
    } else if (status === 'unauthenticated') {
      setError('You must be signed in to accept an invitation')
      setState('error')
    }
  }, [status, chatId])

  const handleAcceptInvitation = async () => {
    if (typeof chatId !== 'string' || !session?.user?.id) return

    setState('accepting')

    try {
      await runTransaction(db, async (transaction) => {
        const chatRef = doc(db, 'chats', chatId)
        const chatSnap = await transaction.get(chatRef)

        if (!chatSnap.exists()) {
          throw new Error('Invalid invitation')
        }

        const chatData = chatSnap.data()
        console.log('Chat data:', chatData) // Log chat data for debugging

        if (chatData.type === 'ai') {
          throw new Error('AI chats do not support invitations')
        }

        if (chatData.participants.includes(session.user.id)) {
          throw new Error('You are already a member of this chat')
        }

        if (chatData.type === 'private') {
          if (chatData.participants.length >= 2) {
            throw new Error('This private chat already has two members')
          }
          // For private chats, we replace the participants array
          transaction.update(chatRef, {
            participants: [chatData.participants[0], session.user.id]
          })
        } else {
          // For group chats, we add the user to the existing participants
          transaction.update(chatRef, {
            participants: arrayUnion(session.user.id)
          })
        }

        console.log(`User ${session.user.id} added to ${chatData.type} chat ${chatId}`) // Log successful addition
      })

      setState('redirecting')
      // Simulate a 3-second delay before redirecting
      setTimeout(() => {
        router.push('/chat')
      }, 3000)

    } catch (error) {
      console.error('Error in handleAcceptInvitation:', error) // Detailed error logging
      setError(error instanceof Error ? error.message : 'Failed to accept invitation')
      setState('error')
    }
  }

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return 'Loading...'
      case 'accepting':
        return 'Accepting invitation...'
      case 'redirecting':
        return 'Invitation accepted! Redirecting to chat...'
      case 'error':
        return error
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-base-200 bg-opacity-50 backdrop-blur-sm flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title justify-center text-base-content">
                {state === 'error' ? 'Error' : 'Invitation'}
              </h2>
              <p className={`text-lg ${state === 'error' ? 'text-error' : 'text-base-content'}`}>
                {renderContent()}
              </p>
              {state === 'error' && (
                <div className="card-actions justify-center mt-4">
                  <button className="btn btn-primary" onClick={() => router.push('/')}>
                    Go to Home
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}