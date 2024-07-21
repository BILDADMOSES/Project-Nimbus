import { useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';

export function useWebSocket(userId: string, roomId: string, roomType: 'group' | 'conversation' | 'ai') {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // Ensure the token is fetched appropriately
        },
        params: {},
      }
    });
  

    const userChannel = pusherRef.current.subscribe(`private-user-${userId}`);
    const roomChannel = pusherRef.current.subscribe(`private-${roomType}-${roomId}`);

    userChannel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
      fetch('/api/chat/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roomId, roomType }),
      });
    });

    roomChannel.bind('roomHistory', (history: any[]) => {
      setMessages(history);
    });

    userChannel.bind('newMessage', (message: any) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    roomChannel.bind('newMessage', (message: any) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    roomChannel.bind('typing', (typingUserId: string) => {
      setTypingUsers((prevTypingUsers) => [...prevTypingUsers, typingUserId]);
    });

    roomChannel.bind('stopTyping', (typingUserId: string) => {
      setTypingUsers((prevTypingUsers) => prevTypingUsers.filter(id => id !== typingUserId));
    });

    return () => {
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(`private-user-${userId}`);
        pusherRef.current.unsubscribe(`private-${roomType}-${roomId}`);
        pusherRef.current.disconnect();
      }
      fetch('/api/chat/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roomId, roomType }),
      });
    };
  }, [userId, roomId, roomType]);

  const sendMessage = (content: string, language: string) => {
    fetch('/api/chat/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, roomId, roomType, content, language }),
    });
  };

  const startTyping = () => {
    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, roomId, roomType }),
    });
  };

  const stopTyping = () => {
    fetch('/api/chat/stopTyping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, roomId, roomType }),
    });
  };

  return { isConnected, messages, typingUsers, sendMessage, startTyping, stopTyping };
}