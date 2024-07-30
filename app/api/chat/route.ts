import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { firestore } from "@/lib/firebase/firebaseAdmin";
import { FieldPath, FieldValue } from 'firebase-admin/firestore';
import prisma from "@/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const userDoc = await prisma.user.findUnique({
      where: { id: userId },
      include: { groups: true, conversations: true, aiChats: true }
    });

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const chats = [];

    // Fetch groups
    const groupIds = userDoc.groups.map(group => group.id);
    if (groupIds.length > 0) {
      const groupDocs = await firestore.collection('groups')
        .where(FieldPath.documentId(), 'in', groupIds)
        .get();
      
      groupDocs.forEach(doc => {
        const data = doc.data();
        chats.push({
          id: doc.id,
          name: data.name,
          type: 'group',
          lastMessage: data.lastMessage?.content || '',
          lastMessageTimestamp: data.lastMessage?.createdAt?.toDate() || null,
          unreadCount: 0, // Implement unread count logic
        });
      });
    }

    // Fetch conversations
    const conversationIds = userDoc.conversations.map(conv => conv.id);
    if (conversationIds.length > 0) {
      const conversationDocs = await firestore.collection('conversations')
        .where(FieldPath.documentId(), 'in', conversationIds)
        .get();
      
      conversationDocs.forEach(doc => {
        const data = doc.data();
        chats.push({
          id: doc.id,
          name: data.members.find(memberId => memberId !== userId) || 'Unknown',
          type: 'conversation',
          lastMessage: data.lastMessage?.content || '',
          lastMessageTimestamp: data.lastMessage?.createdAt?.toDate() || null,
          unreadCount: 0, // Implement unread count logic
        });
      });
    }

    // Fetch AI chats
    const aiChatIds = userDoc.aiChats.map(chat => chat.id);
    if (aiChatIds.length > 0) {
      const aiChatDocs = await firestore.collection('aiChats')
        .where(FieldPath.documentId(), 'in', aiChatIds)
        .get();
      
      aiChatDocs.forEach(doc => {
        const data = doc.data();
        chats.push({
          id: doc.id,
          name: data.name,
          type: 'ai',
          lastMessage: data.lastMessage?.content || '',
          lastMessageTimestamp: data.lastMessage?.createdAt?.toDate() || null,
          unreadCount: 0, // Implement unread count logic
        });
      });
    }

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, name } = body;
    const userId = session.user.id;

    let chatRef;
    let chatId;
    switch (type) {
      case 'group':
        chatRef = await firestore.collection('groups').add({
          name,
          members: [userId],
          createdAt: FieldValue.serverTimestamp(),
          lastMessage: null,
        });
        chatId = chatRef.id;
        await prisma.group.create({
          data: {
            id: chatId,
            name,
            users: {
              connect: { id: userId }
            }
          }
        });
        break;
      case 'conversation':
        chatRef = await firestore.collection('conversations').add({
          members: [userId],
          createdAt: FieldValue.serverTimestamp(),
          lastMessage: null,
        });
        chatId = chatRef.id;
        await prisma.conversation.create({
          data: {
            id: chatId,
            users: {
              connect: { id: userId }
            }
          }
        });
        break;
      case 'ai':
        chatRef = await firestore.collection('aiChats').add({
          name,
          userId,
          createdAt: FieldValue.serverTimestamp(),
          lastMessage: null,
        });
        chatId = chatRef.id;
        await prisma.aIChat.create({
          data: {
            id: chatId,
            name,
            userId
          }
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid chat type' }, { status: 400 });
    }

    return NextResponse.json({ id: chatId, type });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}