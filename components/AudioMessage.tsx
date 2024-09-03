import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, PauseCircle, Volume2 } from 'lucide-react';
import { Message } from '@/types';

interface AudioMessageProps {
  message: Message;
  isCurrentUser: boolean;
  receiverLanguage: string;
  chatType: 'private' | 'group' | 'ai';
}

const AudioMessage: React.FC<AudioMessageProps> = ({ message, isCurrentUser, receiverLanguage, chatType }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(message.fileUrl);
    
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        const percentage = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(percentage);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [message.fileUrl]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const getTranscriptionContent = () => {
    if (isCurrentUser) {
      return message.originalContent || "Transcription unavailable";
    }

    if (chatType === 'group' && typeof message.content === 'object') {
      return message.content[receiverLanguage] || message.originalContent || "Transcription unavailable";
    }

    return typeof message.content === 'string' ? message.content : message.originalContent || "Transcription unavailable";
  };

  return (
    <div className="flex flex-col space-y-2 max-w-xs">
      <div className="flex items-center space-x-2 bg-base-200 rounded-lg p-2">
        <button onClick={togglePlayPause} className="btn btn-circle btn-sm text-primary">
          {isPlaying ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
        </button>
        <div className="flex-grow">
          <div className="w-full bg-primary bg-opacity-30 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
              style={{width: `${progress}%`}}
            ></div>
          </div>
        </div>
        <Volume2 size={20} className="text-primary" />
      </div>
      
      <div className="text-sm italic">
        <p className="font-semibold text-base-content">Transcription (English only):</p>
        <p>{getTranscriptionContent()}</p>
      </div>
    </div>
  );
};

export default AudioMessage;