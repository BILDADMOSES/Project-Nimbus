import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { Message } from '@/types';

const MESSAGES_PER_PAGE = 30;

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
        fetchedMessages.unshift({ id: doc.id, ...doc.data() } as Message);
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
      newMessages.push({ id: doc.id, ...doc.data() } as Message);
    });

    if (newMessages.length < MESSAGES_PER_PAGE) {
      setHasMore(false);
    }

    setMessages((prevMessages) => [...newMessages.reverse(), ...prevMessages]);
  }, [chatId, hasMore, messages]);

  const addOptimisticMessage = (message: Message) => {
    setOptimisticMessages((prev) => [...prev, message]);
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