import React, { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onRecordingStateChange: (isRecording: boolean) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, onRecordingStateChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && waveformRef.current) {
      const waveform = waveformRef.current;
      const bars = waveform.children;
      const animateBars = () => {
        for (let i = 0; i < bars.length; i++) {
          const bar = bars[i] as HTMLDivElement;
          const height = Math.random() * 100;
          bar.style.height = `${height}%`;
        }
        if (isRecording) {
          requestAnimationFrame(animateBars);
        }
      };
      requestAnimationFrame(animateBars);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStateChange(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      onRecordingStateChange(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {isRecording && (
        <>
        <div ref={waveformRef} className="flex items-end space-x-1 h-8 w-24">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="w-1 bg-primary rounded-full transition-all duration-100 ease-in-out"
                style={{ height: '20%' }}
              />
            ))}
          </div>
          <span className="text-sm font-medium">
            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
          </span>
        </>
      )}
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={`btn btn-circle btn-sm ${isRecording ? 'btn-error' : 'btn-primary'}`}
      >
        {isRecording ? (
          <StopIcon className="h-5 w-5" />
        ) : (
          <MicrophoneIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};

export default VoiceRecorder;