import { db } from "@/lib/firebaseClient";
import { doc, getDoc, setDoc, increment } from "firebase/firestore";

export interface UsageLimits {
  messages: number;
  translations: number;
  aiInteractions: number;
  fileStorage: number;
  groupChats: number;
  maxGroupMembers?: number;
}

export const FREE_TIER_LIMITS: UsageLimits = {
  messages: 300,
  translations: 100,
  aiInteractions: 50,
  fileStorage: 50 * 1024 * 1024, // 50 MB in bytes
  groupChats: 3,
  maxGroupMembers: 5,
};

export async function initializeUsageDocument(userId: string): Promise<void> {
  const usageRef = doc(db, "usage", userId);
  await setDoc(usageRef, {
    messages: 0,
    translations: 0,
    aiInteractions: 0,
    fileStorage: 0,
    groupChats: 0,
  }, { merge: true });
}

export async function checkAndIncrementUsage(
  userId: string,
  metric: keyof UsageLimits
): Promise<boolean> {
  const usageRef = doc(db, "usage", userId);
  const usageDoc = await getDoc(usageRef);

  if (!usageDoc.exists()) {
    await initializeUsageDocument(userId);
  }

  const currentUsage = usageDoc.data()?.[metric] || 0;

  if (currentUsage >= FREE_TIER_LIMITS[metric]) {
    return false; // Limit reached
  }

  await setDoc(usageRef, { [metric]: increment(1) }, { merge: true });
  return true; // Action allowed
}

export async function checkFileStorageLimit(
  userId: string,
  fileSize: number
): Promise<boolean> {
  const usageRef = doc(db, "usage", userId);
  const usageDoc = await getDoc(usageRef);

  if (!usageDoc.exists()) {
    await initializeUsageDocument(userId);
    return true; // New user, storage is definitely available
  }

  const currentUsage = usageDoc.data()?.fileStorage || 0;
  return currentUsage + fileSize <= FREE_TIER_LIMITS.fileStorage;
}

export async function incrementFileStorage(
  userId: string,
  fileSize: number
): Promise<void> {
  const usageRef = doc(db, "usage", userId);
  await setDoc(
    usageRef,
    { fileStorage: increment(fileSize) },
    { merge: true }
  );
}

export async function getUsageStatus(userId: string): Promise<UsageLimits> {
    const usageRef = doc(db, "usage", userId);
    const usageDoc = await getDoc(usageRef);
  
    if (!usageDoc.exists()) {
      const defaultUsage = {
        messages: 0,
        translations: 0,
        aiInteractions: 0,
        fileStorage: 0,
        groupChats: 0,
      };
      await setDoc(usageRef, defaultUsage);
      return defaultUsage;
    }
  
    const usage = usageDoc.data() as Partial<UsageLimits>;
  
    return {
      messages: usage.messages || 0,
      translations: usage.translations || 0,
      aiInteractions: usage.aiInteractions || 0,
      fileStorage: usage.fileStorage || 0,
      groupChats: usage.groupChats || 0,
    };
  }

export async function checkGroupMemberLimit(chatId: string): Promise<boolean> {
  const chatRef = doc(db, "chats", chatId);
  const chatDoc = await getDoc(chatRef);
  const chatData = chatDoc.data();

  if (chatData && chatData.type === "group") {
    return chatData.participants.length < FREE_TIER_LIMITS.maxGroupMembers!;
  }
  return true;
}

export async function getGroupCount(chatId: string): Promise<number> {
  const chatRef = doc(db, "chats", chatId);
  const chatDoc = await getDoc(chatRef);
  const chatData = chatDoc.data();

  if (chatData && chatData.type === "group") {
    return chatData.participants.length;
  }
  return 0;
}

export async function canCreateGroupChat(userId: string): Promise<boolean> {
  const usageRef = doc(db, "usage", userId);
  const usageDoc = await getDoc(usageRef);

  if (!usageDoc.exists()) {
    await initializeUsageDocument(userId);
    return true; // New user, can create a group chat
  }

  const currentGroupChats = usageDoc.data()?.groupChats || 0;
  return currentGroupChats < FREE_TIER_LIMITS.groupChats;
}