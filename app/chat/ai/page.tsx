"use client"
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

const AIChatContent = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get('uuid');

  if (!id) {
    return <div>Error: AI Chat ID is missing</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ChatInterface chatId={id} chatType="ai" />
    </QueryClientProvider>
  );
};

const AIChatPage = () => {
  return (
    <Suspense fallback={<div>Loading AI chat...</div>}>
      <AIChatContent />
    </Suspense>
  );
};

export default AIChatPage;