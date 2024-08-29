import { updateDoc, doc, arrayUnion, arrayRemove, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context';

export const handleBlockUser = async (
  userId: string,
  currentUserId: string,
  chatId: string,
  router: AppRouterInstance
) => {
  try {
    await updateDoc(doc(db, "users", currentUserId), {
      blockedUsers: arrayUnion(userId),
    });

    await updateDoc(doc(db, "chats", chatId), {
      participants: arrayRemove(userId),
    });

    router.push("/chat");
  } catch (error) {
    console.error("Error blocking user:", error);
    throw error;
  }
};

export const handleLeaveGroup = async (
  currentUserId: string,
  chatId: string,
  router: AppRouterInstance
) => {
  try {
    await updateDoc(doc(db, "chats", chatId), {
      participants: arrayRemove(currentUserId),
    });

    router.push("/chat");
  } catch (error) {
    console.error("Error leaving group:", error);
    throw error;
  }
};

export const handleDeleteChat = async (
  currentUserId: string,
  chatId: string,
  router: AppRouterInstance
) => {
  try {
    await deleteDoc(doc(db, "chats", chatId));

    const messagesQuery = query(collection(db, `chats/${chatId}/messages`));
    const messagesSnapshot = await getDocs(messagesQuery);
    const deletePromises = messagesSnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    router.push("/chat");
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
};