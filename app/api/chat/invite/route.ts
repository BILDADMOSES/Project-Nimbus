import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/prisma";
import { firestore } from "@/lib/firebase/firebaseAdmin";
import { MailtrapClient } from "mailtrap";

const TOKEN = process.env.MAILTRAP_TOKEN;
const SENDER_EMAIL = process.env.MAILTRAP_SENDER_EMAIL;

const client = new MailtrapClient({ token: TOKEN as string });

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { chatId, emails, chatType } = await request.json();
    const inviterId = session.user.id;

    const chatRef = firestore.collection(chatType === "group" ? "groups" : "conversations").doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    const invitations = await Promise.all(
      emails.map(async (email: string) => {
        const token = uuidv4();
        const invitation = await prisma.invitation.create({
          data: { email, token, inviterId, chatId, chatType, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        });

        const invitationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/chat/join?token=${token}`;
        await client.send({
          from: { name: "ChatEasy Team", email: SENDER_EMAIL as string },
          to: [{ email }],
          subject: "You've been invited to join a chat!",
          text: `Hello,\n\nYou've been invited to join a chat. Click the link below to join:\n\n${invitationLink}\n\nThis link will expire in 7 days.\n\nBest regards,\nChatEasy Team`,
        });

        return invitation;
      })
    );

    return NextResponse.json({ message: "Invitations sent successfully", invitations }, { status: 200 });
  } catch (error) {
    console.error("Error sending invitations:", error);
    return NextResponse.json({ message: "Error sending invitations" }, { status: 500 });
  }
}

export async function joinChat(request: NextRequest, { params }: { params: { tokenOrId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { tokenOrId } = params;
  const userId = session.user.id;

  try {
    const invitation = await prisma.invitation.findUnique({ where: { token: tokenOrId } });

    if (invitation) {
      if (invitation.status !== 'PENDING') {
        return NextResponse.json({ message: 'Invitation is no longer valid' }, { status: 400 });
      }

      const chatRef = firestore.collection(invitation.chatType === 'group' ? 'groups' : 'conversations').doc(invitation.chatId);
      await chatRef.update({ members: firestore.FieldValue.arrayUnion(userId) });

      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { [`${invitation.chatType}Ids`]: { push: invitation.chatId } },
      });

      return NextResponse.json({ type: invitation.chatType, id: invitation.chatId });
    }

    // Direct join (no invitation)
    const groupRef = firestore.collection('groups').doc(tokenOrId);
    const groupDoc = await groupRef.get();
    if (groupDoc.exists) {
      await groupRef.update({ members: firestore.FieldValue.arrayUnion(userId) });
      await prisma.user.update({
        where: { id: userId },
        data: { groupIds: { push: tokenOrId } },
      });
      return NextResponse.json({ type: 'group', id: tokenOrId });
    }

    const conversationRef = firestore.collection('conversations').doc(tokenOrId);
    const conversationDoc = await conversationRef.get();
    if (conversationDoc.exists) {
      await conversationRef.update({ members: firestore.FieldValue.arrayUnion(userId) });
      await prisma.user.update({
        where: { id: userId },
        data: { conversationIds: { push: tokenOrId } },
      });
      return NextResponse.json({ type: 'conversation', id: tokenOrId });
    }

    return NextResponse.json({ message: 'Invalid invitation or chat ID' }, { status: 404 });
  } catch (error) {
    console.error('Error processing join request:', error);
    return NextResponse.json({ message: 'Failed to process join request' }, { status: 500 });
  }
}