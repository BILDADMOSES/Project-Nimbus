import React, { useState, useRef, KeyboardEvent } from 'react'
import EmojiPicker from '@/components/EmojiPicker'
import { PaperAirplaneIcon, PaperClipIcon, MicrophoneIcon } from '@heroicons/react/24/solid'

interface MessageInputProps {
  onSendMessage: (content: string, file?: File) => Promise<void>
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!message.trim() && !fileInputRef.current?.files?.length) || isSending) return

    setIsSending(true)
    try {
      const file = fileInputRef.current?.files?.[0]
      await onSendMessage(message.trim(), file)
      setMessage('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setMessage(prevMessage => prevMessage + emoji)
  }

  return (
    <form onSubmit={handleSendMessage} className="p-4 bg-base-200">
      <div className="flex items-center space-x-2">
        <EmojiPicker onEmojiClick={handleEmojiClick} />
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSending ? "Sending..." : "Type a message..."}
            disabled={isSending}
            className="textarea textarea-bordered w-full pr-20 bg-base-100 text-base-content min-h-[2.5rem] max-h-32 resize-none"
            rows={1}
          />
          <div className="absolute right-2 bottom-2 flex space-x-2">
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
          onChange={() => handleSendMessage()}
          disabled={isSending}
        />
        <button 
          type="submit" 
          disabled={isSending || (!message.trim() && !fileInputRef.current?.files?.length)}
          className="btn btn-circle btn-primary"
        >
          {isSending ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <PaperAirplaneIcon className="h-5 w-5 transform rotate-0" />
          )}
        </button>
      </div>
    </form>
  )
}

export default MessageInput