import { NextRequest, NextResponse } from 'next/server';
import { setupPusherServer } from '@/lib/pusher-server';

const pusherServer = setupPusherServer();

export async function POST(request: NextRequest) {
  const { event, channel, data } = await request.json();
  await pusherServer.trigger(channel, event, data);
  return NextResponse.json({ message: 'Event triggered successfully' }, { status: 200 });
}