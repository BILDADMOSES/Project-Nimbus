import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { CreateChatParams, Chat } from "@/types/chat";
import prisma from "@/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CreateChatParams = await request.json();
    const userId: string = session.user.id?.toString();

    let chat: Chat;

    switch (body.chatType) {
      case "group":
        const group = await prisma.group.create({
          data: {
            name: "New Group", // You might want to allow users to set this
            ownerId: userId,
            defaultLanguage: body.language,
          },
        });
        chat = {
          id: group.id,
          inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL}/chat/join?token=${group.id}`,
        };
        break;

        case "oneOnOne":
          const conversation = await prisma.conversation.create({
            data: {
              userId1: userId,
              userId2: userId,
              // userId2 will be set when the invitation is accepted
            },
            include: {
              user1: true,
              user2: true,
            },
          });
          const otherUser = conversation.user1.id === userId ? conversation.user2 : conversation.user1;
          chat = {
            id: conversation.id,
            name: otherUser.name,
            inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL}/chat/join?token=${conversation.id}`,
          };
          break;
        
        case "ai":
          const aiChat = await prisma.aIChat.create({
            data: {
              userId,
              name: "AI Chat",
              language: body.language,
            },
          });
          chat = {
            id: aiChat.id,
            name: aiChat.name,
            inviteLink: "",
          };
          break;

      case "ai":
        // Implement AI chat creation
        return NextResponse.json(
          { error: "AI chat creation not implemented" },
          { status: 501 }
        );

      default:
        return NextResponse.json(
          { error: "Invalid chat type" },
          { status: 400 }
        );
    }

    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}
