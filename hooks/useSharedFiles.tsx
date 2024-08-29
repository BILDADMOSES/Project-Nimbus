import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { Message } from '@/types';

export const useSharedFiles = (chatId: string) => {
  const [sharedFiles, setSharedFiles] = useState<Message[]>([]);

  useEffect(() => {
    if (chatId) {
      const q = query(
        collection(db, `chats/${chatId}/messages`),
        where("type", "in", ["image", "file"]),
        orderBy("timestamp", "desc")
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const files: Message[] = [];
        querySnapshot.forEach((doc) => {
          files.push({ id: doc.id, ...doc.data() } as Message);
        });
        setSharedFiles(files);
      });
      return () => unsubscribe();
    }
  }, [chatId]);

  return sharedFiles;
};