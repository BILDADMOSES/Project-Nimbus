import React, { useState, useRef, KeyboardEvent, useEffect } from "react";
import EmojiPicker from "@/components/EmojiPicker";
import VoiceRecorder from "@/components/VoiceRecorder";
import DocumentStagingModal from "./DocumentStagingModal";
import {
  PaperAirplaneIcon,
  PaperClipIcon,
} from "@heroicons/react/24/solid";
import axios from 'axios';

interface MessageInputProps {
  onSendMessage: (content: string, file?: File, audioBlob?: Blob, translatedFile?: File, originalUrl?: string, translatedUrl?: string) => Promise<void>;
  chatId: string;
  chatType: 'private' | 'group' | 'ai';
  otherParticipantLanguage?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, chatId, chatType, otherParticipantLanguage }) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioSending, setIsAudioSending] = useState(false);
  const [audioSendingError, setAudioSendingError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (audioSendingError) {
      timer = setTimeout(() => {
        setAudioSendingError(null);
      }, 5000); // Clear error after 5 seconds
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [audioSendingError]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!message.trim() && !selectedFile) || isSending) return;
    setIsSending(true);
    try {
      if (selectedFile) {
        await onSendMessage("", selectedFile);
      } else {
        await onSendMessage(message.trim());
      }
      setMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage((prevMessage) => prevMessage + emoji);
  };

  const handleRecordingComplete = async (blob: Blob) => {
    setIsAudioSending(true);
    setAudioSendingError(null);
    try {
      const file = new File([blob], "audio.webm", { type: "audio/webm" });
      const formData = new FormData();
      formData.append('audio', file);

      const response = await axios.post('/api/service?endpoint=stt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const transcribedText = response.data.text;
      await onSendMessage(transcribedText, undefined, blob);
    } catch (error) {
      console.error("Error processing voice note:", error);
      setAudioSendingError("Failed to send audio message. Please try again.");
    } finally {
      setIsAudioSending(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (chatType === 'private') {
        setIsDocumentModalOpen(true);
      } else {
        handleDocumentStaged(file, null, '', null);
      }
    }
  };

  const handleDocumentStaged = async (originalFile: File, translatedFile: File | null, originalUrl: string, translatedUrl: string | null) => {
    setSelectedFile(originalFile);
    setIsDocumentModalOpen(false);
    try {
      setIsSending(true);
      await onSendMessage("", originalFile, undefined, translatedFile, originalUrl, translatedUrl);
    } catch (error) {
      console.error("Error sending document:", error);
    } finally {
      setIsSending(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-2 bg-base-200">
      <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
        <EmojiPicker onEmojiClick={handleEmojiClick} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending || isRecording || isAudioSending}
          className="btn btn-circle btn-sm btn-ghost"
        >
          <PaperClipIcon className="h-5 w-5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          disabled={isSending || isRecording || isAudioSending}
        />
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSending ? "Sending..." : (isAudioSending ? "Processing audio..." : "Type a message...")}
            disabled={isSending || isRecording || isAudioSending}
            className="textarea textarea-bordered w-full pr-10 bg-base-100 text-base-content min-h-[2.5rem] max-h-32 resize-none"
            rows={1}
          />
        </div>
        {message.trim() || selectedFile ? (
          <button
            type="submit"
            disabled={isSending || isAudioSending}
            className="btn btn-circle btn-primary"
          >
            {isSending ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <PaperAirplaneIcon className="h-5 w-5 transform rotate-0" />
            )}
          </button>
        ) : isAudioSending ? (
          <div className="btn btn-circle btn-primary">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        ) : (
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            onRecordingStateChange={setIsRecording}
            isDisabled={isSending || isAudioSending}
          />
        )}
      </form>
      {isAudioSending && (
        <div className="text-info text-xs mt-1">Processing and sending audio message...</div>
      )}
      {audioSendingError && (
        <div className="text-error text-xs mt-1">{audioSendingError}</div>
      )}
      {isDocumentModalOpen && selectedFile && chatType === 'private' && (
        <DocumentStagingModal
          file={selectedFile}
          onClose={() => setIsDocumentModalOpen(false)}
          onStage={handleDocumentStaged}
          targetLanguage={otherParticipantLanguage}
          chatId={chatId}
        />
      )}
    </div>
  );
};

export default MessageInput;