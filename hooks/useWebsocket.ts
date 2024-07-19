import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export function useWebSocket(userId: string, roomId: string, roomType: 'group' | 'conversation' | 'ai') {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize the socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000');

    // Setup event listeners
    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join', { userId, roomId, roomType });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('roomHistory', (history) => {
      setMessages(history);
    });

    socket.on('newMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Cleanup function
    return () => {
      if (socket) {
        socket.emit('leave', { userId, roomId, roomType });
        socket.disconnect();
      }
    };
  }, [userId, roomId, roomType]);

  const sendMessage = (content: string, language: string) => {
    socketRef.current?.emit('sendMessage', { userId, roomId, roomType, content, language });
  };

  return { isConnected, messages, sendMessage };
}