"use client"

import dynamic from 'next/dynamic'
import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'

const Picker = dynamic(() => import('emoji-picker-react'), { ssr: false })

export default function EmojiPicker({ onEmojiClick }: { onEmojiClick: (emoji: string) => void }) {
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative">
      <button 
        ref={buttonRef}
        onClick={() => setShowPicker(!showPicker)} 
        className="btn btn-circle btn-sm btn-ghost"
        type="button"
        aria-label="Open emoji picker"
      >
        <Smile className="w-5 h-5" />
      </button>
      {showPicker && (
        <div 
          ref={pickerRef}
          className="absolute bottom-12 left-0 z-50 shadow-xl rounded-lg overflow-hidden"
        >
          <Picker
            onEmojiClick={(emojiObject) => {
              onEmojiClick(emojiObject.emoji)
              setShowPicker(false)
            }}
            theme="light"
            preload={true}
            skinTonesDisabled
            searchDisabled={false}
            width={300}
            height={400}
          />
        </div>
      )}
    </div>
  )
}