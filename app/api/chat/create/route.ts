import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { ChatType } from "@/types/chat";
import { firestore } from "@/lib/firebase/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import prisma from "@/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: {
      language: string;
      chatType: ChatType;
      inviteEmails: string[];
    } = await request.json();
    const userId: string = session.user.id;

    // Check if the user exists in Prisma
    let user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
    if (!user) {
      console.log(`User with ID ${userId} not found in Prisma. Attempting to create...`);
      // If the user doesn't exist, create them
      user = await prisma.user.create({
        data: {
          id: userId,
          firebaseUid: userId, // Assuming firebaseUid is the same as id
          name: session.user.name || 'Unknown',
          email: session.user.email || 'unknown@example.com',
          preferredLanguage: body.language,
        },
      });
      console.log(`User created in Prisma with ID: ${user.id}`);
    }

    let chatData;
    let prismaChat;

    switch (body.chatType) {
      case "group":
        prismaChat = await prisma.group.create({
          data: {
            name: "New Group",
            users: {
              connect: { firebaseUid: userId }
            }
          }
        });

        await firestore.collection("groups").doc(prismaChat.id).set({
          ownerId: userId,
          name: "New Group",
          defaultLanguage: body.language,
          members: [userId],
          createdAt: FieldValue.serverTimestamp(),
        });

        await prisma.user.update({
          where: { firebaseUid: userId },
          data: {
            groupIds: {
              push: prismaChat.id
            }
          }
        });

        chatData = {
          id: prismaChat.id,
          inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL}/chat/join?token=${prismaChat.id}`,
        };
        break;

      case "oneOnOne":
        prismaChat = await prisma.conversation.create({
          data: {
            users: {
              connect: { firebaseUid: userId }
            }
          }
        });

        await firestore.collection("conversations").doc(prismaChat.id).set({
          defaultLanguage: body.language,
          members: [userId],
          createdAt: FieldValue.serverTimestamp(),
        });

        await prisma.user.update({
          where: { firebaseUid: userId },
          data: {
            conversationIds: {
              push: prismaChat.id
            }
          }
        });

        chatData = {
          id: prismaChat.id,
          inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL}/chat/join?token=${prismaChat.id}`,
        };
        break;

      case "ai":
        prismaChat = await prisma.aiChat.create({
          data: {
            name: "New AI Chat",
            user: {
              connect: { firebaseUid: userId }
            }
          }
        });

        await firestore.collection("aiChats").doc(prismaChat.id).set({
          userId,
          language: body.language,
          createdAt: FieldValue.serverTimestamp(),
        });

        chatData = {
          id: prismaChat.id,
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid chat type" }, { status: 400 });
    }

    return NextResponse.json(chatData);
  } catch (error) {
    console.error("Error creating chat:", error);
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: "Failed to create chat", 
        details: error.message,
        stack: error.stack 
      }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}