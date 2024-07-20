"use client"
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  useEffect(() => {
    if (status === 'loading') return;
    const tokenOrId = searchParams.get('token');
    if (!tokenOrId) {
      setError('Invalid join link');
      return;
    }
  
    if (!session) {
      const joinUrl = `/join?token=${tokenOrId}`;
      signIn(undefined, { callbackUrl: joinUrl });
      return;
    }
  
    const validateInvitation = async () => {
      setIsValidating(true);
      try {
        const response = await fetch(`/api/chat/join/${tokenOrId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
  
        if (!response.ok) {
          throw new Error('Failed to join');
        }
  
        const data = await response.json();
  
        setIsRedirecting(true);
        setTimeout(() => {
          if (data.type === 'conversation') {
            router.push(`/chat/conversation/${data.id}`);
          } else if (data.type === 'group') {
            router.push(`/chat/group/${data.id}`);
          } else {
            throw new Error('Invalid chat type');
          }
        }, 2000);
      } catch (error) {
        setError('Failed to join. The invitation might be invalid or expired.');
      } finally {
        setIsValidating(false);
      }
    };
  
    validateInvitation();
  }, [searchParams, session, status]);

   // Render helpers
   const renderStatus = () => {
    if (isValidating) {
      return (
        <div className="text-center">
          <progress className="progress w-56"></progress>
          <p className="mt-4 text-sm md:text-base text-gray-600">Validating invitation...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l2 2m2-2l-2-2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      );
    }

    if (!isValidating && !error && isRedirecting) {
      return (
        <div className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>You've successfully joined the chat! Redirecting...</span>
          <div className="flex justify-center mt-2">
            <progress className="progress w-56"></progress>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderChatIllustration = () => (
    <div className="w-full bg-white rounded-lg shadow-xl overflow-hidden mb-6 md:mb-8">
      {/* Chat app header */}
      <div className="bg-indigo-600 text-white p-3 md:p-4 text-center">
        <h3 className="font-semibold text-sm md:text-base">Welcome to the Chat</h3>
      </div>
      
      {/* Chat messages */}
      <div className="p-3 md:p-4 bg-gray-100 space-y-3 md:space-y-4 h-64 md:h-80 overflow-y-auto">
        <div className="flex justify-center">
          <div className="bg-yellow-100 text-yellow-800 rounded-lg py-2 px-3 max-w-[80%] text-sm md:text-base">
            John Doe has joined the chat
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-white text-gray-800 rounded-lg py-2 px-3 max-w-[70%] shadow text-sm md:text-base">
            Welcome, John! Glad you could join us.
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-indigo-500 text-white rounded-lg py-2 px-3 max-w-[70%] text-sm md:text-base">
            Thanks everyone! Happy to be here.
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-white text-gray-800 rounded-lg py-2 px-3 max-w-[70%] shadow text-sm md:text-base">
            Let's get started with today's topic!
          </div>
        </div>
      </div>
      
      {/* Chat input */}
      <div className="p-3 md:p-4 border-t">
        <div className="flex rounded-full bg-gray-100 p-2">
          <input type="text" placeholder="Type a message..." className="flex-grow bg-transparent outline-none px-2 text-sm md:text-base" />
          <button className="btn btn-primary btn-sm rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Left Column - Join Status */}
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full md:w-1/2 p-4 md:p-8 flex flex-col justify-center items-center"
      >
        <div className="w-full max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">Joining Chat</h1>
          <p className="text-sm md:text-base text-gray-500 mb-6 md:mb-8 text-center">
            {isValidating ? "We're validating your invitation..." : "Welcome to the conversation!"}
          </p>

          {renderStatus()}

          <button 
            onClick={() => router.push('/')}
            className="btn btn-primary w-full mt-6"
          >
            Go to Home
          </button>
        </div>
      </motion.div>

      {/* Right Column - Chat Illustration */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full md:w-1/2 bg-indigo-100 p-4 md:p-8 flex justify-center items-center"
      >
        <div className="w-full max-w-md flex flex-col items-center">
          {renderChatIllustration()}
          
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-center">Join the conversation</h2>
          <p className="text-gray-600 text-center text-sm md:text-base">Connect with others and share your thoughts</p>
        </div>
      </motion.div>
    </div>
  );
}