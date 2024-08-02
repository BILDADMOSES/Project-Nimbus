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

  const connectSSE = useCallback(() => {
    if (!userId) {
        console.log('useSSE: No userId provided, skipping connection');
        return;
      }
  
      console.log('useSSE: Attempting to connect SSE');
      setConnectionStatus('connecting');
      const eventSource = new EventSource(`/api/chat?userId=${userId}&sse=true`);
  
      eventSource.onopen = () => {
        console.log('useSSE: Connection opened');
        setConnectionStatus('connected');
      };
  
      eventSource.onerror = (error) => {
        console.error('useSSE: Error in SSE connection', error);
        setConnectionStatus('disconnected');
      };
  
    eventSource.addEventListener('chatList', (event) => {
      const chatData = JSON.parse(event.data);
      setChatList(chatData);
    });

    eventSource.addEventListener('chatUpdate', (event) => {
      const updatedChat = JSON.parse(event.data);
      setChatList(prevList => updateChatList(prevList, updatedChat));
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
      console.error('SSE error:', event);
      setConnectionStatus('disconnected');
    });

    return () => {
        console.log('useSSE: Closing connection');
        eventSource.close();
        setConnectionStatus('disconnected');
      };
    }, [userId]);

    useEffect(() => {
        console.log('useSSE: Setting up SSE connection');
        const cleanup = connectSSE();
        return () => {
          console.log('useSSE: Cleaning up SSE connection');
          if (cleanup) cleanup();
        };
      }, [connectSSE]);


      const fetchMessages = useCallback(async (chatId: string) => {
        try {
          const response = await fetch(`/api/chat/messages?chatId=${chatId}`);
          if (!response.ok) throw new Error('Failed to fetch messages');
          const messages = await response.json();
          console.log("The messages::::", messages)
          // Update the chat with the fetched messages
          setChatList(prevList => prevList.map(chat => 
            chat.id === chatId ? { ...chat, messages } : chat
          ));
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }, []);

      const sendMessage = useCallback(async (chatId: string, chatType: 'conversation' | 'group' | 'ai', content: string, fileUrl?: string) => {
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sendMessage',
              chatId,
              chatType,
              content,
              fileUrl,
            }),
          });
    
          if (!response.ok) {
            throw new Error('Failed to send message');
          }
    
          const newMessage = await response.json();
          console.log('Message sent successfully:', newMessage);
    
          // Update the local chat list with the new message
          setChatList(prevList => updateChatListWithNewMessage(prevList, newMessage));
    
          return newMessage;
        } catch (error) {
          console.error('Error sending message:', error);
          throw error;
        }
      }, []);

  const markAsRead = useCallback(async (chatId: string, messageId: string) => {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'markAsRead',
        chatId,
        messageId,
      }),
    });
  }, []);

  const setTypingIndicator = useCallback(async (chatId: string, isTyping: boolean) => {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'setTypingIndicator',
        chatId,
        isTyping,
      }),
    });
  }, []);

  return { 
    chatList,
    onlineStatus, 
    typingIndicators, 
    connectionStatus,
    newMessages,
    fetchMessages,
    readReceipts,
    sendMessage,
    markAsRead,
    setTypingIndicator
  };
}

// Helper function to update chat list
function updateChatList(
  prevList: ChatRoom[], 
  updatedChat: Partial<ChatRoom> & { id: string }
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