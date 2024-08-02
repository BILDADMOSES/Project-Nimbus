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
  console.log('API: GET request received');
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    console.log('API: Unauthorized request');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(request.url);
  const isSSE = url.searchParams.get('sse') === 'true';

  if (isSSE) {
    console.log('API: Handling SSE request for user', userId);
    return handleSSE(request, userId);
  } else {
    console.log('API: Non-SSE request received');
    return NextResponse.json({ error: 'SSE connection required' }, { status: 400 });
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
      case 'updateOnlineStatus':
        return await updateOnlineStatus(userId, body.isOnline);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

async function handleSSE(request: NextRequest, userId: string) {
  console.log('handleSSE: Starting SSE handling for user', userId);
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = (eventType: string, data: any) => {
    console.log(`handleSSE: Sending ${eventType} event`, data);
    writer.write(encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`));
  };

  const sendChatList = async () => {
    try {
      const chatList = await fetchAllChats(userId);
      sendEvent('chatList', chatList);
    } catch (error) {
      console.error('Error fetching chat list:', error);
      sendEvent('error', { message: 'Failed to fetch chat list' });
    }
  };

  const setupListener = (name: string, listener: () => () => void): () => void => {
    try {
      return listener();
    } catch (error) {
      console.error(`Error setting up ${name} listener:`, error);
      sendEvent('error', { message: `Failed to set up ${name} listener` });
      return () => {}; // Return a no-op function if listener setup fails
    }
  };

  // Set up Firestore listeners
  const unsubscribeChats = setupListener('chats', () =>
    firestore.collection('conversations')
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
      })
  );

  const unsubscribeTyping = setupListener('typing indicator', () =>
    firestore.collection('typingIndicators')
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
      })
  );

  const unsubscribeNewMessages = setupListener('new messages', () =>
    firestore.collectionGroup('messages')
      .where('createdAt', '>', new Date())
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const messageData = change.doc.data();
            const chatId = change.doc.ref.parent.parent?.id;
            if (chatId) {
              sendEvent('newMessage', {
                id: change.doc.id,
                chatId,
                ...messageData,
              });
            }
          }
        });
      }, (error) => {
        console.error('Error in new messages listener:', error);
        sendEvent('error', { message: 'Error in new messages listener' });
      })
  );

  const unsubscribeReadReceipts = setupListener('read receipts', () =>
    firestore.collectionGroup('messages')
      .where('readBy', 'array-contains', userId)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const messageData = change.doc.data();
            const chatId = change.doc.ref.parent.parent?.id;
            if (chatId) {
              sendEvent('readReceipt', {
                chatId,
                messageId: change.doc.id,
                userId,
              });
            }
          }
        });
      }, (error) => {
        console.error('Error in read receipts listener:', error);
        sendEvent('error', { message: 'Error in read receipts listener' });
      })
  );

  const unsubscribeOnlineStatus = setupListener('online status', () =>
    firestore.collection('userStatus')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const userData = change.doc.data();
            sendEvent('onlineStatus', {
              userId: change.doc.id,
              isOnline: userData.online,
              lastSeen: userData.lastSeen ? userData.lastSeen.toDate().toISOString() : null,
            });
          }
        });
      }, (error) => {
        console.error('Error in online status listener:', error);
        sendEvent('error', { message: 'Error in online status listener' });
      })
  );

  // Cleanup function
  const cleanup = () => {
    console.log('handleSSE: Cleaning up listeners');
    unsubscribeChats();
    unsubscribeOnlineStatus();
    unsubscribeTyping();
    unsubscribeNewMessages();
    unsubscribeReadReceipts();
  };

  request.signal.addEventListener('abort', cleanup);

  try {
    // Send initial chat list
    console.log('handleSSE: Sending initial chat list');
    await sendChatList();

    console.log('handleSSE: Returning SSE response');
    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('handleSSE: Unexpected error', error);
    sendEvent('error', { message: 'Unexpected error occurred' });
    cleanup();
    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}

async function fetchAllChats(userId: string) {
  const chats = [];

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

    chats.push({
      id: convDoc.id,
      name: otherUserName,
      type: 'conversation',
      lastMessage: data.lastMessage || null,
      lastMessageTimestamp: data.lastMessage?.createdAt || null,
      unreadCount: data.unreadCount?.[userId] || 0,
      isOnline,
    });
  }

  // Fetch groups
  const groupsSnapshot = await firestore.collection('groups')
    .where('members', 'array-contains', userId)
    .get();

  for (const groupDoc of groupsSnapshot.docs) {
    const data = groupDoc.data();
    chats.push({
      id: groupDoc.id,
      name: data.name,
      type: 'group',
      lastMessage: data.lastMessage || null,
      lastMessageTimestamp: data.lastMessage?.createdAt || null,
      unreadCount: data.unreadCount?.[userId] || 0,
    });
  }

  // Fetch AI chats
  const aiChatsSnapshot = await firestore.collection('aiChats')
    .where('userId', '==', userId)
    .get();

  for (const aiChatDoc of aiChatsSnapshot.docs) {
    const data = aiChatDoc.data();
    chats.push({
      id: aiChatDoc.id,
      name: data.name,
      type: 'ai',
      lastMessage: data.lastMessage || null,
      lastMessageTimestamp: data.lastMessage?.createdAt || null,
      unreadCount: data.unreadCount || 0,
    });
  }

  return chats;
}

async function sendMessage(body: any, userId: string) {
  const { chatId, chatType, content, fileUrl } = body;

  const collectionName = chatType === 'conversation' ? 'conversations' : chatType + 's';

  const messageData = {
    content,
    senderId: userId,
    createdAt: FieldValue.serverTimestamp(),
    fileUrl: fileUrl || null,
    readBy: [userId], // Initialize with the sender having read the message
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
      [`unreadCount.${userId}`]: 0, // Reset unread count for the sender
    });

    // Increment unread count for other members
    const chatDoc = await chatRef.get();
    const chatData = chatDoc.data();
    if (chatData && chatData.members) {
      chatData.members.forEach((memberId) => {
        if (memberId !== userId) {
          batch.update(chatRef, {
            [`unreadCount.${memberId}`]: FieldValue.increment(1),
          });
        }
      });
    }

    await batch.commit();

    // Fetch the created message to return with server timestamp
    const createdMessage = await messageRef.get();
    const createdMessageData = createdMessage.data();

    return NextResponse.json({ 
      id: messageRef.id, 
      ...createdMessageData,
      createdAt: createdMessageData.createdAt.toDate().toISOString()
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
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


async function updateOnlineStatus(userId: string, isOnline: boolean) {
  try {
    const userStatusRef = firestore.collection('userStatus').doc(userId);

    await userStatusRef.set({
      online: isOnline,
      lastChanged: FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`User ${userId} online status updated to ${isOnline}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating online status:', error);
    return NextResponse.json({ error: 'Failed to update online status' }, { status: 500 });
  }
}


async function markAsRead(body: any, userId: string) {
  const { chatId, chatType, messageId } = body;

  if (!chatId || !chatType || !messageId) {
    console.error('markAsRead: Missing required parameters', { chatId, chatType, messageId });
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const collectionName = chatType === 'conversation' ? 'conversations' : chatType + 's';

  try {
    const chatRef = firestore.collection(collectionName).doc(chatId);

    await firestore.runTransaction(async (transaction) => {
      const chatDoc = await transaction.get(chatRef);
      
      if (!chatDoc.exists) {
        console.error(`markAsRead: Chat not found. Collection: ${collectionName}, ChatId: ${chatId}`);
        throw new Error('Chat not found');
      }

      const chatData = chatDoc.data();
      
      if (!chatData.members || !chatData.members.includes(userId)) {
        console.error(`markAsRead: User ${userId} is not a member of chat ${chatId}`);
        throw new Error('User is not a member of this chat');
      }

      const messageRef = chatRef.collection('messages').doc(messageId);
      const messageDoc = await transaction.get(messageRef);

      if (!messageDoc.exists) {
        console.error(`markAsRead: Message not found. ChatId: ${chatId}, MessageId: ${messageId}`);
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data();

      if (messageData.senderId !== userId && !messageData.readBy.includes(userId)) {
        transaction.update(messageRef, {
          readBy: FieldValue.arrayUnion(userId)
        });

        transaction.update(chatRef, {
          [`unreadCount.${userId}`]: FieldValue.increment(-1)
        });
      }
    });

    console.log(`markAsRead: Successfully marked message as read. ChatId: ${chatId}, MessageId: ${messageId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json({ error: error.message || 'Failed to mark message as read' }, { status: 500 });
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