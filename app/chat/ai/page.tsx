"use client"
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';

const AIChatContent = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get('uuid');

  return <ChatInterface chatId={id as string} chatType="ai" />;
};

const AIChatPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AIChatContent />
    </Suspense>
  );
};

export default AIChatPage;