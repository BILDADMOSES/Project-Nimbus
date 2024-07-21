"use client"
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';

const OneOnOnePage = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get('uuid');

  return <ChatInterface chatId={id as string} chatType="conversation" />;
};

export default OneOnOnePage;