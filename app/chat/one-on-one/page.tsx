"use client"
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';

const OneOnOneContent = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get('uuid');

  if (!id) {
    return <div>Error: Conversation ID is missing</div>;
  }

  return <ChatInterface initialSelectedRoom={{ id, type: 'conversation' }} />;
};

const OneOnOnePage = () => {
  return (
    <Suspense fallback={<div>Loading conversation...</div>}>
      <OneOnOneContent />
    </Suspense>
  );
};

export default OneOnOnePage;