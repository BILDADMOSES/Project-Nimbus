"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';

export default function JoinPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading' || !router.isReady) return;
     const slug = router.query.tokenOrId;
    if (!slug || slug.length === 0) {
      setError('Invalid join link');
      return;
    }

    const tokenOrId = slug;
    
    if (!tokenOrId) {
      setError('Invalid join link');
      return;
    }

    if (!session) {
      // If not signed in, redirect to sign-in page with callback URL
      const joinUrl = `/join/${tokenOrId}`;
      signIn(undefined, { callbackUrl: joinUrl });
      return;
    }

    const validateInvitation = async () => {
      setIsValidating(true);
      try {
        const response = await fetch(`/api/join/${tokenOrId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Failed to join');
        }

        const data = await response.json();
        
        // Redirect to the appropriate chat page
        if (data.type === 'conversation') {
          router.push(`/chat/conversation/${data.id}`);
        } else if (data.type === 'group') {
          router.push(`/chat/group/${data.id}`);
        } else {
          throw new Error('Invalid chat type');
        }
      } catch (error) {
        setError('Failed to join. The invitation might be invalid or expired.');
      } finally {
        setIsValidating(false);
      }
    };

    validateInvitation();
  }, [router, session, status]);

  if (status === 'loading' || isValidating) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div>Joining chat...</div>;
}