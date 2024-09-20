import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, limit, startAfter, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { Message } from '@/types';

const MESSAGES_PER_PAGE = 30;

const processTimestamp = (timestamp: any): Date | null => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  } else if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  } else if (timestamp instanceof Date) {
    return timestamp;
  } else {
    const placeholder_timestamp = new Date();
    return placeholder_timestamp;
  }
};

export const useMessages = (chatId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy("timestamp", "desc"),
      limit(MESSAGES_PER_PAGE)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.unshift({ 
          id: doc.id, 
          ...data,
          timestamp: processTimestamp(data.timestamp)
        } as Message);
      });
      setMessages(fetchedMessages);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  const loadMoreMessages = useCallback(async () => {
    if (!chatId || !hasMore) return;

    const lastMessage = messages[0];
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy("timestamp", "desc"),
      startAfter(lastMessage?.timestamp || new Date()),
      limit(MESSAGES_PER_PAGE)
    );

    const querySnapshot = await getDocs(q);
    const newMessages: Message[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      newMessages.push({ 
        id: doc.id, 
        ...data,
        timestamp: processTimestamp(data.timestamp)
      } as Message);
    });

    if (newMessages.length < MESSAGES_PER_PAGE) {
      setHasMore(false);
    }

    setMessages((prevMessages) => [...newMessages.reverse(), ...prevMessages]);
  }, [chatId, hasMore, messages]);

  const addOptimisticMessage = (message: Message) => {
    setOptimisticMessages((prev) => [...prev, {
      ...message,
      timestamp: new Date()
    }]);
  };

  const removeOptimisticMessage = (messageId: string) => {
    setOptimisticMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  return { 
    messages: [...messages, ...optimisticMessages], 
    isLoading, 
    hasMore, 
    loadMoreMessages,
    addOptimisticMessage,
    removeOptimisticMessage
  };
};