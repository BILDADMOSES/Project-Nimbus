import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { firestore } from "@/lib/firebase/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(request.url);
  const isSSE = url.searchParams.get('sse') === 'true';

  if (isSSE) {
    return handleSSE(request, userId);
  } else {
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const lastTimestamp = url.searchParams.get('lastTimestamp');

    try {
      const { chats, nextCursor } = await fetchChats(userId, page, lastTimestamp);
      return NextResponse.json({ chats, nextCursor });
    } catch (error) {
      console.error('Error fetching chats:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;
    const userId = session.user.id;

    switch (action) {
      case 'sendMessage':
        return await sendMessage(body, userId);
      case 'setTypingIndicator':
        return await setTypingIndicator(body, userId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleSSE(request: NextRequest, userId: string) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = (eventType: string, data: any) => {
    writer.write(encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`));
  };

  // Set up Firestore listeners
  const unsubscribeChats = firestore.collection('conversations')
    .where('members', 'array-contains', userId)
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const chatData = change.doc.data();
          sendEvent('chatUpdate', {
            id: change.doc.id,
            ...chatData,
            lastMessage: chatData.lastMessage || null,
          });
        }
      });
    }, (error) => {
      console.error('Error in chats listener:', error);
      sendEvent('error', { message: 'Error in chats listener' });
    });

  // Online status listener
  const unsubscribeOnlineStatus = firestore.collection('userStatus')
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const userData = change.doc.data();
          sendEvent('onlineStatus', {
            userId: change.doc.id,
            isOnline: userData.online,
          });
        }
      });
    }, (error) => {
      console.error('Error in online status listener:', error);
      sendEvent('error', { message: 'Error in online status listener' });
    });

  // Typing indicator listener
  const unsubscribeTyping = firestore.collection('typingIndicators')
    .where('receiverId', '==', userId)
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const typingData = change.doc.data();
          sendEvent('typingIndicator', {
            chatId: typingData.chatId,
            userId: typingData.userId,
            isTyping: typingData.isTyping,
          });
        }
      });
    }, (error) => {
      console.error('Error in typing indicator listener:', error);
      sendEvent('error', { message: 'Error in typing indicator listener' });
    });

  // Cleanup function
  request.signal.addEventListener('abort', () => {
    unsubscribeChats();
    unsubscribeOnlineStatus();
    unsubscribeTyping();
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
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
  
  // Implement pagination
  const CHATS_PER_PAGE = 10;
  const startIndex = page * CHATS_PER_PAGE;
  const paginatedChats = chats.slice(startIndex, startIndex + CHATS_PER_PAGE);

  if (paginatedChats.length === CHATS_PER_PAGE && chats.length > startIndex + CHATS_PER_PAGE) {
    nextCursor = paginatedChats[CHATS_PER_PAGE - 1].lastMessageTimestamp;
  }

  return { chats: paginatedChats, nextCursor };
}

async function createChat(body: any, userId: string) {
  const { type, name, otherUserId } = body;
  
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
        members: [userId, otherUserId],
        createdAt: FieldValue.serverTimestamp(),
        lastMessage: null,
      });
      chatId = chatRef.id;
      await prisma.conversation.create({
        data: {
          id: chatId,
          users: {
            connect: [{ firebaseUid: userId }, { firebaseUid: otherUserId }]
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

  const collectionName = chatType === 'conversation' ? 'conversations' : chatType + 's';

  const messageData = {
    content,
    senderId: userId,
    createdAt: FieldValue.serverTimestamp(),
    fileUrl: fileUrl || null,
    readBy: [userId],
  };

  try {
    const batch = firestore.batch();

    const chatRef = firestore.collection(collectionName).doc(chatId);
    const messageRef = chatRef.collection('messages').doc();

    batch.set(messageRef, messageData);

    batch.update(chatRef, {
      lastMessage: {
        content: content || 'Attachment sent',
        createdAt: FieldValue.serverTimestamp(),
        senderId: userId,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({ id: messageRef.id, ...messageData });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

async function markAsRead(body: any, userId: string) {
  const { chatId, chatType, messageId } = body;

  const collectionName = chatType === 'conversation' ? 'conversations' : chatType + 's';

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

async function setTypingIndicator(body: any, userId: string) {
  const { chatId, isTyping } = body;

  try {
    const typingRef = firestore.collection('typingIndicators').doc(`${chatId}_${userId}`);
    
    await typingRef.set({
      chatId,
      userId,
      isTyping,
      timestamp: FieldValue.serverTimestamp()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting typing indicator:', error);
    return NextResponse.json({ error: 'Failed to set typing indicator' }, { status: 500 });
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

async function getUnreadCount(chatId: string, chatType: string, userId: string): Promise<number> {
  try {
    const collectionName = chatType === 'conversation' ? 'conversations' : chatType + 's';
    const chatRef = firestore.collection(collectionName).doc(chatId);
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