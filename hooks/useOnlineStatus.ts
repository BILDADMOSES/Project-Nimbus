import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

function useUserStatus() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      const updateStatus = async (isOnline: boolean) => {
        try {
          await fetch('/api/chat/user-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isOnline }),
          });
        } catch (error) {
          console.error('Failed to update user status:', error);
        }
      };

      const handleOnline = () => updateStatus(true);
      const handleOffline = () => updateStatus(false);

      updateStatus(true);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        updateStatus(false);
      };
    }
  }, [session]);
}

export default useUserStatus;