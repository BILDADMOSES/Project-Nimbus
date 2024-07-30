import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseClient';

export function useFirestoreChat(userId: string, chatId: string, chatType: 'group' | 'conversation' | 'ai') {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const chatRef = collection(db, `${chatType}s`, chatId, 'messages');
    const q = query(chatRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(newMessages);
    }, (error) => {
      console.error("Firestore error:", error);
    });

    return () => unsubscribe();
  }, [chatId, chatType]);

  const sendMessage = async (content: string, language: string) => {
    try {
      const chatRef = collection(db, `${chatType}s`, chatId, 'messages');
      await addDoc(chatRef, {
        content,
        senderId: userId,
        language,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return { messages, sendMessage };
}

// This function replaces the previous Pusher leave handler
export async function leaveChat(userId: string, chatId: string, chatType: 'group' | 'conversation' | 'ai') {
  try {
    const chatRef = doc(db, `${chatType}s`, chatId);
    await updateDoc(chatRef, {
      members: arrayRemove(userId)
    });

    // Update user's chat list in MongoDB (this should be done server-side)
    await fetch('/api/chat/leave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, chatId, chatType }),
    });
  } catch (error) {
    console.error('Error leaving chat:', error);
  }
}