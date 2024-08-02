"use client"
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

const GroupChatContent = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get('uuid');

  if (!id) {
    return <div>Error: Group ID is missing</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ChatInterface chatId={id} chatType="group" />
    </QueryClientProvider>
  );
};

const GroupChatPage = () => {
  return (
    <Suspense fallback={<div>Loading group chat...</div>}>
      <GroupChatContent />
    </Suspense>
  );
};

export default GroupChatPage;