import { useState, useEffect, useCallback } from 'react';

interface ChatRoom {
  id: string;
  name: string;
  type: 'conversation' | 'group' | 'ai';
  lastMessage: string | null;
  lastMessageTimestamp: string | null;
  unreadCount: number;
}

interface OnlineStatus {
  [userId: string]: boolean;
}

interface TypingIndicator {
  [chatId: string]: string[];
}

interface NewMessage {
  id: string;
  chatId: string;
  content: string;
  senderId: string;
  createdAt: string;
  fileUrl?: string;
}

interface ReadReceipt {
  chatId: string;
  messageId: string;
  userId: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function useSSE(userId: string | undefined) {
  const [chatList, setChatList] = useState<ChatRoom[]>([]);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>({});
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [newMessages, setNewMessages] = useState<NewMessage[]>([]);
  const [readReceipts, setReadReceipts] = useState<ReadReceipt[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY_COUNT = 5;
  const RETRY_INTERVAL = 5000; // 5 seconds

  const connectSSE = useCallback(() => {
    if (!userId) return;

    setConnectionStatus('connecting');
    const eventSource = new EventSource(`/api/chat?userId=${userId}&sse=true`);

    eventSource.onopen = () => {
      setConnectionStatus('connected');
      setRetryCount(0);
    };

    eventSource.addEventListener('chatUpdate', (event) => {
      const chatData = JSON.parse(event.data);
      setChatList(prevList => updateChatList(prevList, chatData));
    });

    eventSource.addEventListener('onlineStatus', (event) => {
      const { userId, isOnline } = JSON.parse(event.data);
      setOnlineStatus(prev => ({ ...prev, [userId]: isOnline }));
    });

    eventSource.addEventListener('typingIndicator', (event) => {
      const { chatId, userId, isTyping } = JSON.parse(event.data);
      setTypingIndicators(prev => updateTypingIndicators(prev, chatId, userId, isTyping));
    });

    eventSource.addEventListener('newMessage', (event) => {
      const newMessage = JSON.parse(event.data);
      setNewMessages(prev => [...prev, newMessage]);
      setChatList(prevList => updateChatListWithNewMessage(prevList, newMessage));
    });

    eventSource.addEventListener('readReceipt', (event) => {
      const readReceipt = JSON.parse(event.data);
      setReadReceipts(prev => [...prev, readReceipt]);
      setChatList(prevList => updateChatListWithReadReceipt(prevList, readReceipt));
    });

    eventSource.addEventListener('error', (event) => {
      const errorData = JSON.parse(event.data);
      console.error('SSE error:', errorData.message);
    });

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
      setConnectionStatus('disconnected');

      if (retryCount < MAX_RETRY_COUNT) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connectSSE();
        }, RETRY_INTERVAL);
      } else {
        console.error('Max retry count reached. SSE connection failed.');
      }
    };

    return () => {
      eventSource.close();
      setConnectionStatus('disconnected');
    };
  }, [userId, retryCount]);

  useEffect(() => {
    const cleanup = connectSSE();
    return cleanup;
  }, [connectSSE]);

  const reconnect = useCallback(() => {
    setRetryCount(0);
    connectSSE();
  }, [connectSSE]);

  return { 
    chatList, 
    onlineStatus, 
    typingIndicators, 
    connectionStatus,
    newMessages,
    readReceipts,
    reconnect
  };
}

// Helper function to update chat list
function updateChatList(
  prevList: ChatRoom[], 
  updatedChat: Partial<ChatRoom> & { id: string; type: 'conversation' | 'group' | 'ai' }
): ChatRoom[] {
  const index = prevList.findIndex(chat => chat.id === updatedChat.id);
  if (index !== -1) {
    const updatedList = [...prevList];
    updatedList[index] = { ...updatedList[index], ...updatedChat };
    return updatedList;
  } else {
    return [...prevList, updatedChat as ChatRoom];
  }
}

// Helper function to update typing indicators
function updateTypingIndicators(
  prev: TypingIndicator,
  chatId: string,
  userId: string,
  isTyping: boolean
): TypingIndicator {
  const chatTyping = prev[chatId] || [];
  if (isTyping && !chatTyping.includes(userId)) {
    return { ...prev, [chatId]: [...chatTyping, userId] };
  } else if (!isTyping && chatTyping.includes(userId)) {
    return { ...prev, [chatId]: chatTyping.filter(id => id !== userId) };
  }
  return prev;
}

// Helper function to update chat list with a new message
function updateChatListWithNewMessage(
  prevList: ChatRoom[],
  newMessage: NewMessage
): ChatRoom[] {
  return prevList.map(chat => 
    chat.id === newMessage.chatId
      ? {
          ...chat,
          lastMessage: newMessage.content,
          lastMessageTimestamp: newMessage.createdAt,
          unreadCount: chat.unreadCount + 1
        }
      : chat
  );
}

// Helper function to update chat list with a read receipt
function updateChatListWithReadReceipt(
  prevList: ChatRoom[],
  readReceipt: ReadReceipt
): ChatRoom[] {
  return prevList.map(chat => 
    chat.id === readReceipt.chatId
      ? {
          ...chat,
          unreadCount: Math.max(0, chat.unreadCount - 1)
        }
      : chat
  );
}