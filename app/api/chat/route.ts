import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { firestore } from "@/lib/firebase/firebaseAdmin";
import { FieldValue } from 'firebase-admin/firestore';
import prisma from "@/prisma";
import { ref, set, onDisconnect } from "firebase/database";
import { database } from "@/lib/firebase/firebaseClient";


export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '0', 10);
  const lastTimestamp = url.searchParams.get('lastTimestamp');

  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { chats, nextCursor } = await fetchChats(userId, page, lastTimestamp);


    return NextResponse.json({ chats, nextCursor });
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

    switch (action) {
      case 'create':
        return await createChat(type, name, userId);
      case 'sendMessage':
        return await sendMessage(body, userId);
      case 'markAsRead':
        return await markAsRead(body, userId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


async function fetchChats(userId: string, page: number, lastTimestamp: string | null) {
  console.log('Fetching chats for user:', userId, 'Page:', page, 'Last timestamp:', lastTimestamp);
  const chats = [];
  let nextCursor = null;

  async function fetchAllMessages(chatId: string, collectionName: string) {
    const messagesSnapshot = await firestore.collection(collectionName)
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .get();

    return messagesSnapshot.docs.map(msgDoc => {
      const msgData = msgDoc.data();
      return {
        id: msgDoc.id,
        content: msgData.content,
        senderId: msgData.senderId,
        createdAt: msgData.createdAt.toDate().toISOString(),
        fileUrl: msgData.fileUrl || null,
        readBy: msgData.readBy || [],
      };
    });
  }

  // Fetch conversations
  const conversationsSnapshot = await firestore.collection('conversations')
    .where('members', 'array-contains', userId)
    .get();

  console.log('Conversations found:', conversationsSnapshot.docs.length);

  for (const convDoc of conversationsSnapshot.docs) {
    const data = convDoc.data();
    const otherUserId = data.members.find(memberId => memberId !== userId);
    
    const otherUserDoc = await firestore.collection('users').doc(otherUserId).get();
    const otherUserName = otherUserDoc.exists ? otherUserDoc.data().name : 'Unknown';
    const isOnline = await checkOnlineStatus(otherUserId);
    const messages = await fetchAllMessages(convDoc.id, 'conversations');

    chats.push({
      id: convDoc.id,
      name: otherUserName,
      type: 'conversation',
      messages: messages,
      lastMessage: messages[0]?.content || '',
      lastMessageTimestamp: messages[0]?.createdAt || null,
      unreadCount: messages.filter(msg => msg.senderId !== userId && !msg.readBy.includes(userId)).length,
      isOnline,
    });
  }

  // Fetch groups
  const groupsSnapshot = await firestore.collection('groups')
    .where('members', 'array-contains', userId)
    .get();

  console.log('Groups found:', groupsSnapshot.docs.length);

  for (const groupDoc of groupsSnapshot.docs) {
    const data = groupDoc.data();
    const messages = await fetchAllMessages(groupDoc.id, 'groups');

    chats.push({
      id: groupDoc.id,
      name: data.name,
      type: 'group',
      messages: messages,
      lastMessage: messages[0]?.content || '',
      lastMessageTimestamp: messages[0]?.createdAt || null,
      unreadCount: messages.filter(msg => msg.senderId !== userId && !msg.readBy.includes(userId)).length,
    });
  }

  // Fetch AI chats
  const aiChatsSnapshot = await firestore.collection('aiChats')
    .where('userId', '==', userId)
    .get();

  console.log('AI Chats found:', aiChatsSnapshot.docs.length);

  for (const aiChatDoc of aiChatsSnapshot.docs) {
    const data = aiChatDoc.data();
    const messages = await fetchAllMessages(aiChatDoc.id, 'aiChats');

    chats.push({
      id: aiChatDoc.id,
      name: data.name,
      type: 'ai',
      messages: messages,
      lastMessage: messages[0]?.content || '',
      lastMessageTimestamp: messages[0]?.createdAt || null,
      unreadCount: messages.filter(msg => !msg.readBy.includes(userId)).length,
    });
  }
  
  chats.sort((a, b) => {
    const timeA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
    const timeB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
    return timeB - timeA;
  });
  
  // Sort messages within each chat, oldest first
  chats.forEach(chat => {
    if (chat.messages && Array.isArray(chat.messages)) {
      chat.messages.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
    }
  });
  
  console.log("Sorted Chat List:", chats);

  // Implement pagination
  const CHATS_PER_PAGE = 10;
  const startIndex = page * CHATS_PER_PAGE;
  const paginatedChats = chats.slice(startIndex, startIndex + CHATS_PER_PAGE);

  if (paginatedChats.length === CHATS_PER_PAGE && chats.length > startIndex + CHATS_PER_PAGE) {
    nextCursor = paginatedChats[CHATS_PER_PAGE - 1].lastMessageTimestamp;
  }

  console.log('Total chats:', chats.length);
  console.log('Paginated chats:', paginatedChats.length);
  console.log('Next cursor:', nextCursor);

  return { chats: paginatedChats, nextCursor };
}

async function createChat(type: string, name: string, userId: string) {
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

async function sendMessage(body: any, userId: string) {
  const { chatId, chatType, content, fileUrl } = body;

  const collectionName = chatType === 'conversation' ? 'conversations' : chatType;

  const messageData = {
    content,
    senderId: userId,
    createdAt: FieldValue.serverTimestamp(),
    fileUrl: fileUrl || null,
    readBy: [], // Initialize readBy as an empty array
  };

  try {
    const batch = firestore.batch();

    const chatRef = firestore.collection(collectionName).doc(chatId);
    const messageRef = chatRef.collection('messages').doc();

    batch.set(messageRef, messageData);

    const chatDoc = await chatRef.get();
    const chatData = chatDoc.data() || {};

    const updateData = {
      lastMessage: {
        content: content || 'Attachment sent',
        createdAt: FieldValue.serverTimestamp(),
        senderId: userId,
      },
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (chatData.members && Array.isArray(chatData.members)) {
      chatData.members.forEach(memberId => {
        if (memberId !== userId) {
          updateData[`unreadCount.${memberId}`] = FieldValue.increment(1);
        }
      });
    }

    batch.set(chatRef, updateData, { merge: true });

    await batch.commit();

    return NextResponse.json({ id: messageRef.id, ...messageData });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

async function markAsRead(body: any, userId: string) {
  const { chatId, chatType, messageId } = body;

  const collectionName = chatType === 'conversation' ? 'conversations' : chatType;

  try {
    const chatRef = firestore.collection(collectionName).doc(chatId);

    await firestore.runTransaction(async (transaction) => {
      const chatDoc = await transaction.get(chatRef);
      
      if (!chatDoc.exists) {
        throw new Error('Chat not found');
      }

      const chatData = chatDoc.data();
      
      if (!chatData.members.includes(userId)) {
        throw new Error('User is not a member of this chat');
      }

      const messageRef = chatRef.collection('messages').doc(messageId);
      const messageDoc = await transaction.get(messageRef);

      if (!messageDoc.exists) {
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data();

      if (messageData.senderId !== userId && !messageData.readBy.includes(userId)) {
        transaction.update(messageRef, {
          readBy: FieldValue.arrayUnion(userId)
        });

        transaction.update(chatRef, {
          [`unreadCount.${userId}`]: 0
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json({ error: error.message || 'Failed to mark message as read' }, { status: 500 });
  }
}

async function getUnreadCount(chatId: string, chatType: string, userId: string): Promise<number> {
  try {
    const chatRef = firestore.collection(chatType).doc(chatId);
    const messagesRef = chatRef.collection('messages');
    
    const allMessages = await messagesRef.get();
    
    const unreadCount = allMessages.docs.reduce((count, doc) => {
      const messageData = doc.data();
      if (messageData.senderId !== userId && !messageData.readBy.includes(userId)) {
        return count + 1;
      }
      return count;
    }, 0);
    
    return unreadCount;
  } catch (error) {
    console.error(`Error getting unread count for ${chatType} ${chatId}:`, error);
    return 0;
  }
}

export async function updateUserStatus(userId: string, isOnline: boolean) {
  const userStatusRef = ref(database, `status/${userId}`);
  await set(userStatusRef, { 
    online: isOnline,
    lastSeen: Date.now()
  });
  if (isOnline) {
    onDisconnect(userStatusRef).set({ 
      online: false,
      lastSeen: Date.now()
    });
  }
}

async function checkOnlineStatus(userId: string): Promise<boolean> {
  try {
    const userStatusRef = firestore.collection('userStatus').doc(userId);
    const snapshot = await userStatusRef.get();
    
    if (!snapshot.exists) {
      return false;
    }
    
    const data = snapshot.data();
    const isOnline = data?.online || false;
    const lastSeen = data?.lastSeen?.toDate();
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return isOnline && lastSeen && lastSeen > fiveMinutesAgo;
  } catch (error) {
    console.error('Error checking online status:', error);
    return false;
  }
}