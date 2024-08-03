"use client"

import { useUserStore } from '@/lib/userStore'

export default function BlockButton({ userId }: { userId: string }) {
  const { blockedUsers, blockUser, unblockUser } = useUserStore()
  const isBlocked = blockedUsers.includes(userId)

  const handleClick = () => {
    if (isBlocked) {
      unblockUser(userId)
    } else {
      blockUser(userId)
    }
  }

  return (
    <button onClick={handleClick} className={`btn ${isBlocked ? 'btn-error' : 'btn-warning'}`}>
      {isBlocked ? 'Unblock User' : 'Block User'}
    </button>
  )
}