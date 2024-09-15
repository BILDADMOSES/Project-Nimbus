import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebaseClient";
import { Message, ChatData, UserData } from "@/types";
import {
  checkAndIncrementUsage,
  checkFileStorageLimit,
  incrementFileStorage,
} from "@/lib/usageTracking";
import axios from 'axios';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY;
const API_URL = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_URL;

export const sendMessage = async (
  content: string,
  file: File | undefined,
  audioBlob: Blob | undefined,
  chatId: string,
  userId: string,
  chatData: ChatData,
  participantLanguages: string[]
) => {
  if ((!content.trim() && !file && !audioBlob) || !userId) return;

  try {
    // Check message count limit
    const canSendMessage = await checkAndIncrementUsage(userId, "messages");
    if (!canSendMessage) {
      throw new Error("You've reached your message limit for the free tier. Please upgrade to send more messages.");
    }

    let messageData: Partial<Message> = {
      senderId: userId,
      timestamp: serverTimestamp(),
      chatId: chatId,
    };

    let textToTranslate = '';

    if (audioBlob) {
      // Handle voice note (audio transcription and upload)
      const fileName = `voice_${Date.now()}.webm`;
      const storageRef = ref(storage, `chats/${chatId}/${fileName}`);
      await uploadBytes(storageRef, audioBlob);
      const downloadURL = await getDownloadURL(storageRef);

      messageData = {
        ...messageData,
        type: "audio",
        content: fileName,
        fileUrl: downloadURL,
      };

      await incrementFileStorage(userId, audioBlob.size);

      // Transcribe the audio
      try {
        const transcriptionResponse = await axios.post('/api/service?endpoint=stt', audioBlob, {
          headers: { 'Content-Type': 'audio/webm' },
        });
        textToTranslate = transcriptionResponse.data.text;
        messageData.originalContent = textToTranslate;
      } catch (error) {
        console.error("Error transcribing audio:", error);
        textToTranslate = "Transcription failed";
        messageData.originalContent = textToTranslate;
      }
    } else if (file) {
      // Handle file upload (image or other file)
      const canUploadFile = await checkFileStorageLimit(userId, file.size);
      if (!canUploadFile) {
        throw new Error("You've reached your file storage limit for the free tier. Please upgrade to upload more files.");
      }
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds the maximum limit of 10MB.");
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

      await incrementFileStorage(userId, file.size);
    } else {
      // Handle text message
      textToTranslate = content;
      messageData = {
        ...messageData,
        type: "text",
        originalContent: content,
      };
    }

    // Handle translation for text messages and transcribed audio
    if (textToTranslate) {
      if (chatData?.type === "private") {
        const otherParticipantId = chatData.participants.find(p => p !== userId);
        if (otherParticipantId) {
          const userDoc = await getDoc(doc(db, "users", otherParticipantId));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            const canTranslate = await checkAndIncrementUsage(userId, "translations");
            if (canTranslate) {
              const translatedContent = await translateMessage(textToTranslate, userData.preferredLang || "en");
              messageData.content = {
                // [userId]: textToTranslate,
                [userData.preferredLang || "en"]: translatedContent
              };
            } else {
              messageData.content = {
                // [userId]: textToTranslate,
                [userData.preferredLang || "en"]: textToTranslate
              };
            }
          }
        }
      } else if (chatData?.type === "group") {
        const translations: { [key: string]: string } = {};  // [userId]: textToTranslate
         await Promise.all(
          participantLanguages.map(async (lang) => {
            if (lang !== 'original') {
              const canTranslate = await checkAndIncrementUsage(userId, "translations");
              if (canTranslate) {
                translations[lang] = await translateMessage(textToTranslate, lang);
              } else {
                translations[lang] = textToTranslate;
              }
            }
          })
        );
        messageData.content = translations;
      } else if (chatData?.type === "ai") {
        messageData.content = textToTranslate;
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

const translateMessage = async (message: string, targetLang: string): Promise<string> => {  
  try {
    const detected = await detectLanguage(message)
    console.log("DETECTED", detected)

    if (targetLang === 'sw') {
      console.log("TRANSLATING TO SW")

      if (detected !== 'en') {
        const tranlatedToEng = await googleTranslate(message, 'en');
        return await customTranslation(tranlatedToEng, 'sw')
      }
      return await customTranslation(message, targetLang)
    }

    if (detected === 'sw') {
      console.log("TRANSLATING FROM SW")
      if (targetLang !== 'en') {
        console.log("not eng")
        const msg = await customTranslation(message, 'en')
        return await googleTranslate(msg, targetLang)
      } 
      return await customTranslation(message, 'en')
    }

    return googleTranslate(message, targetLang)
    
  } catch (error) {
    console.error('Error in translation:', error);
    return message;
  }
};

const customTranslation = async (message: string, targetLang: string): Promise<string> => {
  try {
    const response = await fetch(`https://aboge-demo.hf.space/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message, target: targetLang }),
    });

    const data = await response.json();
    return data.translated_text;
  } catch (error) {
    console.error('Error in Custom Modeltranslation:', error);
    return message;
  }
};

const detectLanguage = async (message: string): Promise<string> => {

  try {
    const res = await fetch(`${API_URL}/detect?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: message }),  
    });

    const detectedData = await res.json();
    const detectedLanguage = detectedData.data.detections[0][0].language;
    console.log("Detected language:", detectedLanguage);

    return detectedLanguage;
  } catch (error) {
    console.error("Error detecting language:", error);
    throw new Error("Failed to detect language");
  }
};

const googleTranslate = async (message: string, targetLang: string): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: message, target: targetLang }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Translation API error:', response.status, errorBody);
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.translations[0].translatedText;
  } catch (error) {
    console.error('Error in translation:', error);
    return message;
  }
}