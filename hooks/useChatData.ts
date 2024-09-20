import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { ChatData, UserData } from '@/types';

export const useChatData = (chatId: string, userId: string) => {
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [participants, setParticipants] = useState<{ [key: string]: UserData }>({});
  const [otherParticipantsLanguages, setOtherParticipantsLanguages] = useState<string[]>([]);
  const [currentUserLanguage, setCurrentUserLanguage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchChatData = async () => {
      const chatDoc = await getDoc(doc(db, "chats", chatId));
      if (chatDoc.exists()) {
        const data = chatDoc.data() as ChatData;
        setChatData({ ...data, id: chatId });

        const participantsData: { [key: string]: UserData } = {};
        const languages = new Set<string>();
        let currentUserLang: string | null = null;

        for (const participantId of data.participants) {
          const userDoc = await getDoc(doc(db, "users", participantId));
          if (userDoc.exists()) {
            const userData = { ...userDoc.data(), id: participantId } as UserData;
            participantsData[participantId] = userData;

            if (participantId === userId) {
              currentUserLang = userData.preferredLang || null;
              setCurrentUserLanguage(currentUserLang);
            } else if (userData.preferredLang) {
              languages.add(userData.preferredLang);
            }
          }
        }
        setParticipants(participantsData);

        if (data.type === "private") {
          const otherParticipantId = data.participants.find(p => p !== userId);
          if (otherParticipantId) {
            setSelectedUser(participantsData[otherParticipantId]);
          }
        }

        setOtherParticipantsLanguages(Array.from(languages));
      }
    };
    fetchChatData();
  }, [chatId, userId]);

  const otherParticipantLanguage = chatData?.type === 'private' 
    ? otherParticipantsLanguages[0] || null
    : null;

  return { 
    chatData, 
    participants, 
    otherParticipantsLanguages, 
    currentUserLanguage, 
    selectedUser, 
    setSelectedUser,
    otherParticipantLanguage
  };
};