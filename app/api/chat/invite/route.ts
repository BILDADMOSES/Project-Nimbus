import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { chatId, emails, chatType } = await request.json();
    const inviterId = session.user.id;

    let chat;
    if (chatType === 'group') {
      chat = await prisma.group.findUnique({ where: { id: chatId } });
    } else if (chatType === 'oneOnOne') {
      chat = await prisma.conversation.findUnique({ where: { id: chatId } });
    }

    if (!chat) {
      return NextResponse.json({ message: 'Chat not found' }, { status: 404 });
    }

    const invitations = await Promise.all(
      emails.map(async (email: string) => {
        const token = uuidv4();
        const invitation = await prisma.invitation.create({
          data: {
            email,
            token,
            inviterId,
            groupId: chatType === 'group' ? chatId : undefined,
            conversationId: chatType === 'oneOnOne' ? chatId : undefined,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
          },
        });

        // send an email with the invitation link
        console.log(`Invitation link for ${email}: ${process.env.NEXT_PUBLIC_BASE_URL}/join/${token}`);

        return invitation;
      })
    );

    return NextResponse.json({ message: 'Invitations sent successfully', invitations }, { status: 200 });
  } catch (error) {
    console.error('Error sending invitations:', error);
    return NextResponse.json({ message: 'Error sending invitations' }, { status: 500 });
  }
}