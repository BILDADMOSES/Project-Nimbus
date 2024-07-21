import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import prisma from "@/prisma";

export async function POST(request: NextRequest, { params }: { params: { tokenOrId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { tokenOrId } = params;
  const userId = session.user.id;

  console.log(`Processing join request for tokenOrId: ${tokenOrId}, userId: ${userId}`);

  try {
    // Check if it's an invitation token
    const invitation = await prisma.invitation.findUnique({
      where: { token: tokenOrId },
      include: { group: true, conversation: true },
    });

    if (invitation) {
      console.log(`Found invitation: ${JSON.stringify(invitation)}`);
      if (invitation.status !== 'PENDING') {
        return NextResponse.json({ message: 'Invitation is no longer valid' }, { status: 400 });
      }

      if (invitation.group) {
        // Handle group invitation
        await prisma.groupUser.create({
          data: { userId, groupId: invitation.group.id },
        });
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED' },
        });
        return NextResponse.json({ type: 'group', id: invitation.group.id });
      } else if (invitation.conversation) {
        // Handle conversation invitation
        await prisma.conversation.update({
          where: { id: invitation.conversation.id },
          data: { userId2: userId },
        });
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED' },
        });
        return NextResponse.json({ type: 'conversation', id: invitation.conversation.id });
      }
    }

    // If not an invitation, check if it's a direct group or conversation ID
    const group = await prisma.group.findUnique({ where: { id: tokenOrId } });
    if (group) {
      console.log(`Found group: ${JSON.stringify(group)}`);
      const existingMember = await prisma.groupUser.findUnique({
        where: { userId_groupId: { userId, groupId: group.id } },
      });
      if (!existingMember) {
        await prisma.groupUser.create({
          data: { userId, groupId: group.id },
        });
      }
      return NextResponse.json({ type: 'group', id: group.id });
    }

    const conversation = await prisma.conversation.findUnique({ where: { id: tokenOrId } });
    if (conversation) {
      console.log(`Found conversation: ${JSON.stringify(conversation)}`);
      if (conversation.userId1 !== userId && conversation.userId2 !== userId) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { userId2: userId },
        });
      }
      return NextResponse.json({ type: 'conversation', id: conversation.id });
    }

    console.log(`No matching invitation, group, or conversation found for tokenOrId: ${tokenOrId}`);
    return NextResponse.json({ message: 'Invalid invitation or chat ID' }, { status: 404 });
  } catch (error) {
    console.error('Error processing join request:', error);
    return NextResponse.json({ message: 'Failed to process join request', error: JSON.stringify(error) }, { status: 500 });
  }
}