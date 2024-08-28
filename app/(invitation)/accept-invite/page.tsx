"use client"
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { doc, arrayUnion, runTransaction } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import StatusMessage from '@/components/StatusMessage'
import ActionButton from '@/components/ActionButton'
import { checkGroupMemberLimit, FREE_TIER_LIMITS } from '@/lib/usageTracking'

export default function AcceptInvitation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatId = searchParams.get('token')
  const { data: session, status } = useSession()
  const [error, setError] = useState('')
  const [state, setState] = useState('loading') // 'loading', 'accepting', 'redirecting', 'error', 'unauthenticated'

  useEffect(() => {
    if (!chatId) {
      setError('Invalid invitation link')
      setState('error')
      return
    }

    if (status === 'authenticated') {
      handleAcceptInvitation()
    } else if (status === 'unauthenticated') {
      setState('unauthenticated')
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
        console.log('Chat data:', chatData)
  
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
        } else if (chatData.type === 'group') {
          // Check if the group has reached the maximum number of members
          const canJoin = await checkGroupMemberLimit(chatId)
          if (!canJoin) {
            throw new Error(`This group chat has reached the maximum limit of ${FREE_TIER_LIMITS.maxGroupMembers} members`)
          }
          // For group chats, we add the user to the existing participants
          transaction.update(chatRef, {
            participants: arrayUnion(session.user.id)
          })
        }
  
        console.log(`User ${session.user.id} added to ${chatData.type} chat ${chatId}`)
      })
  
      setState('redirecting')
      // Simulate a 3-second delay before redirecting
      setTimeout(() => {
        router.push('/chat')
      }, 3000)
  
    } catch (error) {
      console.error('Error in handleAcceptInvitation:', error)
      setError(error instanceof Error ? error.message : 'Failed to accept invitation')
      setState('error')
    }
  }
  return (
    <div className="fixed inset-0 bg-base-200 bg-opacity-80 backdrop-blur-md flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <LoadingSpinner isVisible={['loading', 'accepting', 'redirecting'].includes(state)} />
          <StatusMessage 
            state={state} 
            error={error} 
            content={{
              loading: 'Loading...',
              accepting: 'Accepting invitation...',
              redirecting: 'Invitation accepted! Redirecting to chat...',
              unauthenticated: 'Please sign in to accept the invitation',
              error: error
            }}
          />
          {state === 'error' && (
            <ActionButton
              label="Go to Home"
              onClick={() => router.push('/')}
            />
          )}
          {state === 'unauthenticated' && (
            <ActionButton
              label="Sign In"
              href={`/signin?callbackUrl=${encodeURIComponent(`/accept-invite?token=${chatId}`)}`}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}