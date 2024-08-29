import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebaseClient";
import { Message, ChatData, UserData } from "@/types";
import {
  checkAndIncrementUsage,
  checkFileStorageLimit,
  incrementFileStorage,
} from "@/lib/usageTracking";

// Dummy translation function (replace with actual translation service)
const translateMessage = async (
  message: string,
  targetLang: string
): Promise<string> => {
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY;
  const API_URL = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_URL;

  const translateText = async (text: string, targetLanguage: string) => {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data.data.translations[0].translatedText;
  };
  const translatedMessage = await translateText(message, targetLang);

  return translatedMessage;
};

export const sendMessage = async (
  content: string,
  file: File | undefined,
  chatId: string,
  userId: string,
  chatData: ChatData,
  participantLanguages: string[]
) => {
  if ((!content.trim() && !file) || !userId) return;

  try {
    // Check message count limit
    const canSendMessage = await checkAndIncrementUsage(userId, "messages");
    if (!canSendMessage) {
      throw new Error("You've reached your message limit for the free tier. Please upgrade to send more messages.");
    }

    let messageData: Partial<Message> = {
      senderId: userId,
      timestamp: serverTimestamp(),
      originalContent: content, // Store the original message
    };

    if (file) {
      // Check file storage limit
      const canUploadFile = await checkFileStorageLimit(userId, file.size);
      if (!canUploadFile) {
        throw new Error("You've reached your file storage limit for the free tier. Please upgrade to upload more files.");
      }
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds the maximum limit of 5MB.");
      }

      const storageRef = ref(storage, `chats/${chatId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      messageData = {
        ...messageData,
        type: file.type.startsWith("image/") ? "image" : "file",
        content: file.name,
        fileUrl: downloadURL,
      };

      // Increment file storage usage
      await incrementFileStorage(userId, file.size);
    } else {
      messageData = {
        ...messageData,
        type: "text",
      };

      if (chatData?.type === "private") {
        const otherParticipantId = chatData.participants.find(
          (p) => p !== userId
        );
        if (otherParticipantId) {
          const userDoc = await getDoc(doc(db, "users", otherParticipantId));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            // Check translation usage
            const canTranslate = await checkAndIncrementUsage(userId, "translations");
            if (canTranslate) {
              const translatedContent = await translateMessage(
                content,
                userData.preferredLang || "en"
              );
              messageData.content = translatedContent;
            } else {
              messageData.content = content;
              // message wasn't translated due to usage limits
            }
          }
        }
      } else if (chatData?.type === "group") {
        const translations: { [key: string]: string } = {};
        await Promise.all(
          participantLanguages.map(async (lang) => {
            // Check translation usage for each language
            const canTranslate = await checkAndIncrementUsage(userId, "translations");
            if (canTranslate) {
              translations[lang] = await translateMessage(content, lang);
            } else {
              translations[lang] = content;
              // message wasn't translated due to usage limits
            }
          })
        );
        messageData.content = translations;
      } else if (chatData?.type === "ai") {
        // For AI chat, we don't translate the message
        messageData.content = content;
        // Check AI interaction usage
        const canUseAI = await checkAndIncrementUsage(userId, "aiInteractions");
        if (!canUseAI) {
          throw new Error("You've reached your AI interaction limit for the free tier. Please upgrade to continue using AI chat.");
        }
      }
    }

    console.log("ADDING MESSAGE", messageData);
    await addDoc(collection(db, `chats/${chatId}/messages`), messageData);
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};