import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { v4 as uuidv4 } from "uuid";
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

    const invitationsRef = firestore.collection('invitations');
    const invitations = await Promise.all(
      emails.map(async (email: string) => {
        const token = uuidv4();
        const invitationDoc = invitationsRef.doc();
        await invitationDoc.set({
          email,
          token,
          inviterId,
          chatId,
          chatType,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        const invitationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/chat/join?token=${token}`;
        await client.send({
          from: { name: "ChatEasy Team", email: SENDER_EMAIL as string },
          to: [{ email }],
          subject: "You've been invited to join a chat!",
          text: `Hello,\n\nYou've been invited to join a chat. Click the link below to join:\n\n${invitationLink}\n\nThis link will expire in 7 days.\n\nBest regards,\nChatEasy Team`,
        });

        return { id: invitationDoc.id, email, token };
      })
    );

    return NextResponse.json({ message: "Invitations sent successfully", invitations }, { status: 200 });
  } catch (error) {
    console.error("Error sending invitations:", error);
    return NextResponse.json({ message: "Error sending invitations" }, { status: 500 });
  }
}