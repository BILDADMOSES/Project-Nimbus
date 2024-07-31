"use client"
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import { QueryClient, QueryClientProvider } from 'react-query'


const queryClient = new QueryClient()


const OneOnOneContent = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get('uuid');

  if (!id) {
    return <div>Error: Conversation ID is missing</div>;
  }

  return ( <QueryClientProvider client={queryClient}>
    <ChatInterface />
  </QueryClientProvider>);
};

const OneOnOnePage = () => {
  return (
    <Suspense fallback={<div>Loading conversation...</div>}>
      <OneOnOneContent />
    </Suspense>
  );
};

export default OneOnOnePage;