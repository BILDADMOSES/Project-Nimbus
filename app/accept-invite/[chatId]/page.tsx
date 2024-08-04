import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'

export default function AcceptInvitation() {
  const router = useRouter()
  const { chatId } = router.query
  const { data: session, status } = useSession()
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'authenticated' && chatId) {
      handleAcceptInvitation()
    }
  }, [status, chatId])

  const handleAcceptInvitation = async () => {
    if (typeof chatId !== 'string' || !session?.user?.id) return

    try {
      const chatRef = doc(db, 'chats', chatId)
      const chatSnap = await getDoc(chatRef)

      if (!chatSnap.exists()) {
        setError('Invalid invitation')
        return
      }

      const chatData = chatSnap.data()

      if (chatData.type === 'private' && chatData.participants.length >= 2) {
        setError('This private chat already has two members')
        return
      }

      if (chatData.type === 'ai') {
        setError('AI chats do not support invitations')
        return
      }

      // Add user to chat participants
      await updateDoc(chatRef, {
        participants: arrayUnion(session.user.id)
      })

      router.push(`/chat`)
    } catch (error) {
      setError('Failed to accept invitation')
      console.error(error)
    }
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  return <div>Accepting invitation...</div>
}