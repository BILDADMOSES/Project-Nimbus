import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/authOptions';
import prisma from '@/prisma';

export const GET = async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        lastMessage: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
      },
      include: {
        lastMessage: true,
        user1: true,
        user2: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const aiChats = await prisma.aIChat.findMany({
      where: {
        userId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const chats = [
        ...groups.map((group) => ({
          id: group.id,
          name: group.name,
          type: 'group',
          lastMessage: group.lastMessage?.content || '',
          lastMessageTimestamp: group.lastMessage?.createdAt,
          unreadCount: 0, // Implement unread message count logic
        })),
        ...conversations.map((conversation) => ({
          id: conversation.id,
          name: conversation.user1.id === userId ? conversation.user2.name : conversation.user1.name,
          type: 'conversation',
          lastMessage: conversation.lastMessage?.content || '',
          lastMessageTimestamp: conversation.lastMessage?.createdAt,
          unreadCount: 0, // Implement unread message count logic
        })),
        ...aiChats.map((aiChat) => ({
          id: aiChat.id,
          name: aiChat.name,
          type: 'ai',
          lastMessage: aiChat.messages[0]?.content || '',
          lastMessageTimestamp: aiChat.messages[0]?.createdAt,
          unreadCount: 0, // Implement unread message count logic
        })),
      ];

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
};
