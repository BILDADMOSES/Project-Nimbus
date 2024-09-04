import React, { useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import ChatHeader from '@/components/ChatHeader';
import MessageList from '@/components/MessageList';
import MessageInput from '@/components/MessageInput';
import { useChatData } from '@/hooks/useChatData';
import { useMessages } from '@/hooks/useMessages';
import { useSharedFiles } from '@/hooks/useSharedFiles';
import { sendMessage } from '@/utils/sendMessage';
import { Message } from '@/types';
import { speechToText } from '@/utils/speechUtils';

interface ChatRoomProps {
  chatId: string;
  onBackClick: () => void;
  isMobile: boolean;
  onOpenUserDetails: (user: any, chat: any, participants: any, files: any[]) => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ 
  chatId, 
  onBackClick, 
  isMobile, 
  onOpenUserDetails 
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { chatData, participants, participantLanguages, selectedUser } = useChatData(chatId, session?.user?.id!);
  const { messages, isLoading, hasMore, loadMoreMessages } = useMessages(chatId);
  const sharedFiles = useSharedFiles(chatId);

  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleOpenSidebar = () => {
    const user = chatData.type === "private"
      ? participants[chatData.participants.find((p) => p !== session?.user?.id)!]
      : null;
    onOpenUserDetails(user, chatData, participants, sharedFiles);
  };
  
  const handleSendMessage = async (content: string, file?: File, audioBlob?: Blob) => {
    try {
      if (audioBlob) {
        // Handle voice message
        const transcribedText = await speechToText(audioBlob);
        await sendMessage(transcribedText, undefined, audioBlob, chatId, session?.user?.id!, chatData!, participantLanguages);
      } else {
        await sendMessage(content, file, undefined, chatId, session?.user?.id!, chatData!, participantLanguages);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError((error as Error).message);
      if ((error as Error).message.includes("reached your limit")) {
        setShowUpgradePrompt(true);
      }
    }
  };

  const renderMessage = useCallback((message: Message) => {
    if (message.senderId === session?.user?.id) {
      return message.originalContent || (typeof message.content === "string" ? message.content : "");
    }

    if (chatData?.type === "group" && typeof message.content === "object") {
      const userLang = session?.user?.preferredLang || "en";
      return message.content[userLang] || message.originalContent || "";
    }

    return typeof message.content === "string" ? message.content : "";
  }, [session?.user?.id, chatData?.type]);

  if (isLoading || !chatData) {
    return (
      <div className="fixed inset-0 bg-base-100 shadow-xl backdrop-blur-md bg-opacity-80 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        chatData={chatData}
        participants={participants}
        currentUserId={session?.user?.id}
        onOpenSidebar={handleOpenSidebar}
        onBackClick={onBackClick}
        isMobile={isMobile}
      />
      
      <div className="flex-grow overflow-hidden flex flex-col">
        {error && (
          <div className="alert alert-error">
            <AlertCircle className="stroke-current shrink-0 h-6 w-6" />
            <span>{error}</span>
          </div>
        )}

        <MessageList
          messages={messages}
          participants={participants}
          currentUserId={session?.user?.id}
          chatType={chatData.type}
          hasMore={hasMore}
          lastMessageRef={lastMessageRef}
          chatContainerRef={chatContainerRef}
          renderMessage={renderMessage}
          onLoadMore={loadMoreMessages}
        />
        
        <MessageInput onSendMessage={handleSendMessage} chatId={chatId} />
      </div>

      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-base-200 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md">
            <h3 className="text-lg font-bold mb-4">Upgrade to Premium</h3>
            <AlertTriangle className="text-warning mx-auto mb-4" size={48} />
            <p className="mb-4">You've reached the limit of your free tier. Upgrade to Premium to enjoy:</p>
            <ul className="list-disc list-inside mb-4">
              <li>Unlimited messages</li>
              <li>Unlimited translations</li>
              <li>Increased file storage</li>
              <li>Unlimited AI interactions</li>
            </ul>
            <div className="flex justify-end">
              <button className="btn btn-primary mr-2" onClick={() => {/* Implement upgrade logic */}}>
                Upgrade Now
              </button>
              <button className="btn btn-ghost" onClick={() => setShowUpgradePrompt(false)}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;