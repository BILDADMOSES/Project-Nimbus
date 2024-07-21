import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authOptions';
import prisma from '@/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const lastConversation = await prisma.conversation.findFirst({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (lastConversation) {
      return NextResponse.json({ conversation: lastConversation });
    } else {
      return NextResponse.json({ message: 'No conversations found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching last conversation:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  runtime: 'edge',
};