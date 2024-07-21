"use client"
import { useRouter, useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';

const AIChatPage = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get('uuid');

  return <ChatInterface chatId={id as string} chatType="ai" />;
};

export default AIChatPage;