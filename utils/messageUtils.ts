import { Message } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { translateMessage } from './sendMessage';

export const renderMessage = (message: Message, currentUserId: string, chatType: string, userLang: string) => {
  if (message.senderId === currentUserId) {
    return message.originalContent || (typeof message.content === "string" ? message.content : "");
  }

  if (chatType === "group" && typeof message.content === "object") {
    if (message.content[userLang]) {
      return message.content[userLang];
    } else {
      // Fallback: translate the original message and update the content
      translateAndUpdateMessage(message, userLang);
      return message.originalContent || "";
    }
  }

  return typeof message.content === "string" ? message.content : "";
};

export const translateAndUpdateMessage = async (message: Message, targetLang: string) => {
  if (!message.originalContent) return;

  const translatedContent = await translateMessage(message.originalContent, targetLang);
  const updatedContent = {
    ...message.content,
    [targetLang]: translatedContent,
  };

  await updateDoc(doc(db, `chats/${message.chatId}/messages`, message.id), {
    content: updatedContent,
  });
};

export const renderDateDivider = (date: Date) => {
  let dateString;
  if (isToday(date)) {
    dateString = "Today";
  } else if (isYesterday(date)) {
    dateString = "Yesterday";
  } else {
    dateString = format(date, "MMMM d, yyyy");
  }
  return dateString;
};
