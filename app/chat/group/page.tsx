"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';

const GroupChatContent = () => {
  const searchParams = useSearchParams();
  const groupId = searchParams.get('uuid');

  if (!groupId) {
    return <div>Error: Group ID is missing</div>;
  }

  return <ChatInterface initialSelectedRoom={{ id: groupId, type: 'group' }} />;
};

const GroupChatPage = () => {
  return (
    <Suspense fallback={<div>Loading group chat...</div>}>
      <GroupChatContent />
    </Suspense>
  );
};

export default GroupChatPage;