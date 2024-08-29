import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { ChatData, UserData } from '@/types';

export const useChatData = (chatId: string, userId: string) => {
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [participants, setParticipants] = useState<{ [key: string]: UserData }>({});
  const [participantLanguages, setParticipantLanguages] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchChatData = async () => {
      const chatDoc = await getDoc(doc(db, "chats", chatId));
      if (chatDoc.exists()) {
        const data = chatDoc.data() as ChatData;
        setChatData({ ...data, id: chatId });

        const participantsData: { [key: string]: UserData } = {};
        for (const participantId of data.participants) {
          const userDoc = await getDoc(doc(db, "users", participantId));
          if (userDoc.exists()) {
            participantsData[participantId] = {
              ...userDoc.data(),
              id: participantId,
            } as UserData;
          }
        }
        setParticipants(participantsData);

        if (data.type === "private") {
          const otherParticipantId = data.participants.find(
            (p) => p !== userId
          );
          if (otherParticipantId) {
            setSelectedUser(participantsData[otherParticipantId]);
          }
        }

        if (data.type === "group") {
          const languages = new Set<string>();
          Object.values(participantsData).forEach((user) => {
            if (user.preferredLang) {
              languages.add(user.preferredLang);
            }
          });
          setParticipantLanguages(Array.from(languages));
        }
      }
    };
    fetchChatData();
  }, [chatId, userId]);

  return { chatData, participants, participantLanguages, selectedUser, setSelectedUser };
};