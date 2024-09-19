import React from 'react';
import Image from 'next/image';
import { AlertCircle, RefreshCw, FileIcon, MicIcon, ImageIcon } from 'lucide-react';
import { Message } from '@/types';

interface OptimisticMessageBubbleProps {
  message: Message;
  onResend: () => void;
}

const OptimisticMessageBubble: React.FC<OptimisticMessageBubbleProps> = ({ message, onResend }) => {
  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return <p>{message.content}</p>;
      case 'image':
        return (
          <div className="flex items-center">
            <ImageIcon className="w-6 h-6 mr-2" />
            <span>Uploading image...</span>
          </div>
        );
      case 'audio':
        return (
          <div className="flex items-center">
            <MicIcon className="w-6 h-6 mr-2" />
            <span>Uploading audio message...</span>
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center">
            <FileIcon className="w-6 h-6 mr-2" />
            <span>Uploading file: {typeof message.content === 'string' ? message.content : 'File'}</span>
          </div>
        );
      default:
        return <p>Unsupported message type</p>;
    }
  };

  return (
    <div className="chat chat-end">
      <div className="chat-bubble chat-bubble-primary opacity-70">
        {renderContent()}
      </div>
      {message.error && (
        <div className="chat-footer opacity-50 flex items-center mt-1">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span className="text-xs mr-2">Failed to send</span>
          <button onClick={onResend} className="btn btn-xs btn-ghost">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default OptimisticMessageBubble;