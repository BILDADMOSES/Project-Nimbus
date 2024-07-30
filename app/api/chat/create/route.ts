import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { ChatType } from "@/types/chat";
import { firestore } from "@/lib/firebase/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

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

    let chatRef;
    let chatData;

    switch (body.chatType) {
      case "group":
      case "oneOnOne":
        chatRef = await firestore.collection(body.chatType === "group" ? "groups" : "conversations").add({
          ownerId: userId,
          defaultLanguage: body.language,
          members: [userId],
          createdAt: FieldValue.serverTimestamp(),
        });

        chatData = {
          id: chatRef.id,
          inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL}/chat/join?token=${chatRef.id}`,
        };
        break;

      case "ai":
        chatRef = await firestore.collection("aiChats").add({
          userId,
          language: body.language,
          createdAt: FieldValue.serverTimestamp(),
        });

        chatData = {
          id: chatRef.id,
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid chat type" }, { status: 400 });
    }

    return NextResponse.json(chatData);
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  }
}