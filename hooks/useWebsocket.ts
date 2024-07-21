import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';

export function useWebSocket(userId: string, roomId: string, roomType: 'group' | 'conversation' | 'ai') {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    // Initialize Pusher connection
    pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });

    // Subscribe to channels
    const userChannel = pusherRef.current.subscribe(`private-user-${userId}`);
    const roomChannel = pusherRef.current.subscribe(`private-${roomType}-${roomId}`);

    // Setup event listeners
    userChannel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
      // Simulate join event
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

    userChannel.bind('error', (error: any) => {
      console.error('Pusher error:', error);
    });

    // Cleanup function
    return () => {
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(`private-user-${userId}`);
        pusherRef.current.unsubscribe(`private-${roomType}-${roomId}`);
        pusherRef.current.disconnect();
      }
      // Simulate leave event
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

  return { isConnected, messages, sendMessage };
}