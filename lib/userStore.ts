import { create } from 'zustand'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from './firebaseClient'

interface UserState {
  blockedUsers: string[]
  blockUser: (userId: string) => Promise<void>
  unblockUser: (userId: string) => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  blockedUsers: [],
  blockUser: async (userId: string) => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    const userRef = doc(db, 'users', currentUser.uid)
    await updateDoc(userRef, {
      blocked: arrayUnion(userId)
    })
    set((state) => ({ blockedUsers: [...state.blockedUsers, userId] }))
  },
  unblockUser: async (userId: string) => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    const userRef = doc(db, 'users', currentUser.uid)
    await updateDoc(userRef, {
      blocked: arrayRemove(userId)
    })
    set((state) => ({ blockedUsers: state.blockedUsers.filter(id => id !== userId) }))
  }
}))