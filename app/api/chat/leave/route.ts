import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { userId, roomId, roomType } = await request.json();
  console.log(`[${new Date().toISOString()}] User ${userId} left ${roomType} ${roomId}`);
  return NextResponse.json({ message: 'Left successfully' }, { status: 200 });
}