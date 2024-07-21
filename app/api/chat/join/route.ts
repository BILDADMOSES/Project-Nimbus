import { NextRequest, NextResponse } from 'next/server';
import { setupPusherServer } from '@/lib/pusher-server';
import { getMessages } from '@/lib/chat-utils';

const pusher = setupPusherServer();

export async function POST(request: NextRequest) {
  const { userId, roomId, roomType } = await request.json();
  console.log(`[${new Date().toISOString()}] User ${userId} joined ${roomType} ${roomId}`);
  const messages = await getMessages(roomId, roomType);
  await pusher.trigger(`private-${roomType}-${roomId}`, 'roomHistory', messages);
  console.log(`[${new Date().toISOString()}] Sent room history to user ${userId} for ${roomType} ${roomId}`);
  return NextResponse.json({ message: 'Joined successfully' }, { status: 200 });
}