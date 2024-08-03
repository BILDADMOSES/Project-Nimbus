"use client"

import dynamic from 'next/dynamic'
import { useState } from 'react'

const Picker = dynamic(() => import('emoji-picker-react'), { ssr: false })

export default function EmojiPicker({ onEmojiClick }: { onEmojiClick: (emoji: string) => void }) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setShowPicker(!showPicker)} className="btn btn-circle btn-sm">
        😊
      </button>
      {showPicker && (
        <div className="absolute bottom-10 right-0 z-10">
          <Picker
            onEmojiClick={(emojiObject) => {
              onEmojiClick(emojiObject.emoji)
              setShowPicker(false)
            }}
          />
        </div>
      )}
    </div>
  )
}