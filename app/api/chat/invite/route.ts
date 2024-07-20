import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/prisma";
import { MailtrapClient } from "mailtrap";

const TOKEN = process.env.MAILTRAP_TOKEN;
const SENDER_EMAIL = process.env.MAILTRAP_SENDER_EMAIL;

const client = new MailtrapClient({ token: TOKEN as string });

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { chatId, emails, chatType } = await request.json();
    const inviterId = session.user.id;

    let chat;
    if (chatType === "group") {
      chat = await prisma.group.findUnique({ where: { id: chatId } });
    } else if (chatType === "oneOnOne") {
      chat = await prisma.conversation.findUnique({ where: { id: chatId } });
    }

    if (!chat) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    const invitations = await Promise.all(
      emails.map(async (email: string) => {
        const token = uuidv4();
        const invitation = await prisma.invitation.create({
          data: {
            email,
            token,
            inviterId,
            groupId: chatType === "group" ? chatId : undefined,
            conversationId: chatType === "oneOnOne" ? chatId : undefined,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
          },
        });

        // Generate the invitation link
        const invitationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/chat/join?token=${token}`;
        console.log(`Invitation link for ${email}: ${invitationLink}`);

        try {
          await client.send({
            from: { name: "ChatEasy Team", email: SENDER_EMAIL as string },
            to: [{ email }],
            subject: "You've been invited to join a chat!",
            text: `Hello,\n\nYou've been invited to join a chat. Click the link below to join:\n\n${invitationLink}\n\nThis link will expire in 7 days.\n\nBest regards,\nChatEasy Team`,
          });
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          throw emailError;
        }

        return invitation;
      })
    );

    return NextResponse.json(
      { message: "Invitations sent successfully", invitations },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending invitations:", error);
    return NextResponse.json(
      { message: "Error sending invitations" },
      { status: 500 }
    );
  }
}
