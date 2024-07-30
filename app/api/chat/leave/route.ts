import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { firestore } from "@/lib/firebase/firebaseAdmin";
import prisma from "@/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { chatId, chatType } = await request.json();
    const userId = session.user.id;

    // Update Firestore
    const chatRef = firestore.collection(`${chatType}s`).doc(chatId);
    await chatRef.update({
      members: firestore.FieldValue.arrayRemove(userId)
    });

    // Update MongoDB
    let updateField;
    switch (chatType) {
      case 'group':
        updateField = 'groupIds';
        break;
      case 'conversation':
        updateField = 'conversationIds';
        break;
      case 'ai':
        updateField = 'aiChatIds';
        break;
      default:
        throw new Error('Invalid chat type');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        [updateField]: {
          set: await prisma.user
            .findUnique({ where: { id: userId } })
            .then((user) => user?.[updateField].filter((id) => id !== chatId) || [])
        }
      }
    });

    // If it's a group chat and the user is the owner, assign a new owner or delete the group
    if (chatType === 'group') {
      const groupDoc = await chatRef.get();
      const groupData = groupDoc.data();
      if (groupData && groupData.ownerId === userId) {
        const remainingMembers = groupData.members.filter((memberId: string) => memberId !== userId);
        if (remainingMembers.length > 0) {
          // Assign the first remaining member as the new owner
          await chatRef.update({ ownerId: remainingMembers[0] });
        } else {
          // If no members left, delete the group
          await chatRef.delete();
        }
      }
    }

    return NextResponse.json({ message: "Successfully left the chat" });
  } catch (error) {
    console.error('Error leaving chat:', error);
    return NextResponse.json({ error: 'Failed to leave chat' }, { status: 500 });
  }
}