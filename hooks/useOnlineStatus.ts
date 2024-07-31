import { useEffect } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { firestore } from "@/lib/firebase/firebaseAdmin";

export const useOnlineStatus = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    const userStatusRef = doc(firestore, 'onlineUsers', userId);

    const setOnline = async () => {
      await setDoc(userStatusRef, { online: true }, { merge: true });
    };

    const setOffline = async () => {
      await deleteDoc(userStatusRef);
    };

    // Set user as online when they connect
    setOnline();

    // Set up event listeners for when the user goes offline or online
    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);

    // Set up beforeunload event to set user as offline when they close the tab
    window.addEventListener('beforeunload', setOffline);

    // Cleanup function
    return () => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
      window.removeEventListener('beforeunload', setOffline);
      setOffline();
    };
  }, [userId]);

  // This hook doesn't return anything, it just manages the online status
};