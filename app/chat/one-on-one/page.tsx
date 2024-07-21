"use client"
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';

const OneOnOneContent = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get('uuid');

  return <ChatInterface chatId={id as string} chatType="conversation" />;
};

const OneOnOnePage = () => {
  return (
    <Suspense fallback={<div>Loading conversation...</div>}>
      <OneOnOneContent />
    </Suspense>
  );
};

export default OneOnOnePage;