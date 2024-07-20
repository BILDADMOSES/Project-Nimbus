import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { CreateChatParams, Chat } from "@/types/chat";

const prisma = new PrismaClient();

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
        });
        chat = {
          id: conversation.id,
          inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL}/chat/join?token=${conversation.id}`,
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

export async function createChat(params: CreateChatParams): Promise<Chat> {
  const response = await fetch("/api/chat/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Failed to create chat");
  }

  return response.json();
}
