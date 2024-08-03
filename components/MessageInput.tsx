import React, { useState, useRef } from 'react'
import EmojiPicker from '@/components/EmojiPicker'
import { PaperAirplaneIcon, PaperClipIcon, MicrophoneIcon } from '@heroicons/react/24/solid'

interface MessageInputProps {
  onSendMessage: (content: string, file?: File) => Promise<void>
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!message.trim() && !fileInputRef.current?.files?.length) || isSending) return

    setIsSending(true)
    try {
      const file = fileInputRef.current?.files?.[0]
      await onSendMessage(message, file)
      setMessage('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setMessage(prevMessage => prevMessage + emoji)
  }

  return (
    <form onSubmit={handleSendMessage} className="p-4 bg-white">
      <div className="flex items-center space-x-2">
        <EmojiPicker onEmojiClick={handleEmojiClick} />
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isSending ? "Sending..." : "Type a message..."}
            disabled={isSending}
            className="input input-bordered w-full pr-20 bg-white"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isSending}
              className="btn btn-circle btn-sm btn-ghost"
            >
              <PaperClipIcon className="h-5 w-5" />
            </button>
            <button 
              type="button" 
              disabled={isSending}
              className="btn btn-circle btn-sm btn-ghost"
            >
              <MicrophoneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={() => {}} 
          disabled={isSending}
        />
        <button 
          type="submit" 
          disabled={isSending || (!message && !fileInputRef.current?.files?.length)}
          className="btn btn-circle btn-primary"
        >
          {isSending ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <PaperAirplaneIcon className="h-5 w-5 transform rotate-10" />
          )}
        </button>
      </div>
    </form>
  )
}

export default MessageInput