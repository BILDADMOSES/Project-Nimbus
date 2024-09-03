import { db } from "@/lib/firebaseClient";
import { doc, getDoc, setDoc, increment, updateDoc } from "firebase/firestore";

export interface UsageLimits {
  messages: number;
  translations: number;
  aiInteractions: number;
  fileStorage: number;
  groupChats: number;
  audioMessages: number;
  maxGroupMembers?: number;
}

export const FREE_TIER_LIMITS: UsageLimits = {
  messages: 300,
  translations: 100,
  aiInteractions: 50,
  fileStorage: 50 * 1024 * 1024, // 50 MB in bytes
  groupChats: 3,
  audioMessages: 50,
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
    audioMessages: 0,
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
    return true; // New user, action allowed
  }

  const currentUsage = usageDoc.data()?.[metric] || 0;

  if (currentUsage >= FREE_TIER_LIMITS[metric]) {
    return false; // Limit reached
  }

  await updateDoc(usageRef, { [metric]: increment(1) });
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
    return true; // New user, storage is available
  }

  const currentUsage = usageDoc.data()?.fileStorage || 0;
  return currentUsage + fileSize <= FREE_TIER_LIMITS.fileStorage;
}

export async function incrementFileStorage(
  userId: string,
  fileSize: number
): Promise<void> {
  const usageRef = doc(db, "usage", userId);
  await updateDoc(usageRef, { fileStorage: increment(fileSize) });
}

export async function getUsageStatus(userId: string): Promise<UsageLimits> {
  const usageRef = doc(db, "usage", userId);
  const usageDoc = await getDoc(usageRef);

  if (!usageDoc.exists()) {
    const defaultUsage: UsageLimits = {
      messages: 0,
      translations: 0,
      aiInteractions: 0,
      fileStorage: 0,
      groupChats: 0,
      audioMessages: 0,
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
    audioMessages: usage.audioMessages || 0,
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

export async function getGroupCount(userId: string): Promise<number> {
  const usageRef = doc(db, "usage", userId);
  const usageDoc = await getDoc(usageRef);

  if (!usageDoc.exists()) {
    await initializeUsageDocument(userId);
    return 0;
  }

  return usageDoc.data()?.groupChats || 0;
}

export async function canCreateGroupChat(userId: string): Promise<boolean> {
  const groupCount = await getGroupCount(userId);
  return groupCount < FREE_TIER_LIMITS.groupChats;
}