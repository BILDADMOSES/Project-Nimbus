// app/api/chat/route.ts
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
      where: { firebaseUid: userId },
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
      
      for (const doc of groupDocs.docs) {
        const data = doc.data();
        const unreadCount = await getUnreadCount(doc.id, 'groups', userId);
        chats.push({
          id: doc.id,
          name: data.name,
          type: 'group',
          lastMessage: data.lastMessage?.content || '',
          lastMessageTimestamp: data.lastMessage?.createdAt?.toDate() || null,
          unreadCount,
        });
      }
    }

    // Fetch conversations
    const conversationIds = userDoc.conversations.map(conv => conv.id);
    if (conversationIds.length > 0) {
      const conversationDocs = await firestore.collection('conversations')
        .where(FieldPath.documentId(), 'in', conversationIds)
        .get();
      
      for (const doc of conversationDocs.docs) {
        const data = doc.data();
        const unreadCount = await getUnreadCount(doc.id, 'conversations', userId);
        const otherUserId = data.members.find(memberId => memberId !== userId);
        const isOnline = await checkOnlineStatus(otherUserId);
        chats.push({
          id: doc.id,
          name: otherUserId || 'Unknown',
          type: 'conversation',
          lastMessage: data.lastMessage?.content || '',
          lastMessageTimestamp: data.lastMessage?.createdAt?.toDate() || null,
          unreadCount,
          isOnline,
        });
      }
    }

    // Fetch AI chats
    const aiChatIds = userDoc.aiChats.map(chat => chat.id);
    if (aiChatIds.length > 0) {
      const aiChatDocs = await firestore.collection('aiChats')
        .where(FieldPath.documentId(), 'in', aiChatIds)
        .get();
      
      for (const doc of aiChatDocs.docs) {
        const data = doc.data();
        const unreadCount = await getUnreadCount(doc.id, 'aiChats', userId);
        chats.push({
          id: doc.id,
          name: data.name,
          type: 'ai',
          lastMessage: data.lastMessage?.content || '',
          lastMessageTimestamp: data.lastMessage?.createdAt?.toDate() || null,
          unreadCount,
        });
      }
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
    const { type, name, action } = body;
    const userId = session.user.id;

    if (action === 'create') {
      return await createChat(type, name, userId);
    } else if (action === 'sendMessage') {
      return await sendMessage(body, userId);
    } else if (action === 'markAsRead') {
      return await markAsRead(body, userId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createChat(type, name, userId) {
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
            connect: { firebaseUid: userId }
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
            connect: { firebaseUid: userId }
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
      throw new Error('Invalid chat type');
  }

  return NextResponse.json({ id: chatId, type });
}

async function sendMessage(body, userId) {
  const { chatId, chatType: originalChatType, content, fileUrl } = body;

  // Determine the correct collection name
  let collectionName = originalChatType;
  if (originalChatType === 'conversation') {
    collectionName = 'conversations';
  }

  const messageData = {
    content,
    senderId: userId,
    createdAt: FieldValue.serverTimestamp(),
    fileUrl: fileUrl || null,
    readBy: [userId],
  };

  try {
    // Start a new batch
    const batch = firestore.batch();

    // Reference to the chat document
    const chatRef = firestore.collection(collectionName).doc(chatId);

    // Reference to the new message document
    const messageRef = chatRef.collection('messages').doc();

    // Add the new message
    batch.set(messageRef, messageData);

    // Update the chat document
    batch.set(chatRef, {
      lastMessage: {
        content: content || 'Attachment sent',
        createdAt: FieldValue.serverTimestamp(),
        senderId: userId,
      },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true }); // Use merge: true to update or create the document

    // Commit the batch
    await batch.commit();

    return NextResponse.json({ id: messageRef.id, ...messageData });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

async function markAsRead(body, userId) {
  const { chatId, chatType, messageId } = body;

  await firestore.collection(chatType).doc(chatId)
    .collection('messages').doc(messageId)
    .update({
      readBy: FieldValue.arrayUnion(userId)
    });

  return NextResponse.json({ success: true });
}

async function getUnreadCount(chatId, chatType, userId) {
  const messagesRef = firestore.collection(chatType).doc(chatId).collection('messages');
  const unreadQuery = messagesRef.where('readBy', 'array-contains', userId);
  const unreadSnapshot = await unreadQuery.get();
  return unreadSnapshot.size;
}

async function checkOnlineStatus(userId) {
  const userStatusRef = firestore.collection('onlineUsers').doc(userId);
  const userStatusDoc = await userStatusRef.get();
  return userStatusDoc.exists && userStatusDoc.data().online;
}