// @/server/pusher.ts
import Pusher from 'pusher';
import { translateMessage } from '../lib/utils/translation';
import { generateResponse } from '../lib/utils/aiChat';
import prisma from '../prisma';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
});

export function setupPusherServer() {
  return {
    handleJoin: async (userId: string, roomId: string, roomType: string) => {
      console.log(`[${new Date().toISOString()}] User ${userId} joined ${roomType} ${roomId}`);
      const messages = await getMessages(roomId, roomType);
      await pusher.trigger(`private-${roomType}-${roomId}`, 'roomHistory', messages);
      console.log(`[${new Date().toISOString()}] Sent room history to user ${userId} for ${roomType} ${roomId}`);
    },

    handleLeave: (userId: string, roomId: string, roomType: string) => {
      console.log(`[${new Date().toISOString()}] User ${userId} left ${roomType} ${roomId}`);
    },

    handleSendMessage: async (userId: string, roomId: string, roomType: string, content: string, language: string) => {
      console.log(`[${new Date().toISOString()}] Received message from user ${userId} in ${roomType} ${roomId}`);
      try {
        const message = await saveMessage(userId, roomId, roomType, content, language);
        console.log(`[${new Date().toISOString()}] Saved message from user ${userId} in ${roomType} ${roomId}`);
        
        if (roomType === 'group') {
          const group = await prisma.group.findUnique({
            where: { id: roomId },
            include: { members: { include: { user: true } } },
          });

          for (const member of group?.members ?? []) {
            const translatedContent = await translateMessage(content, language, member.user.preferredLanguage);
            console.log(`[${new Date().toISOString()}] Translated message for user ${member.user.id} in group ${roomId}`);
            await pusher.trigger(`private-user-${member.user.id}`, 'newMessage', {
              ...message,
              content: translatedContent,
            });
            console.log(`[${new Date().toISOString()}] Sent translated message to user ${member.user.id}`);
          }
        } else if (roomType === 'conversation') {
          const conversation = await prisma.conversation.findUnique({
            where: { id: roomId },
            include: { user1: true, user2: true },
          });

          const otherUser = conversation?.user1.id === userId ? conversation?.user2 : conversation?.user1;
          if (otherUser) {
            const translatedContent = await translateMessage(content, language, otherUser.preferredLanguage);
            console.log(`[${new Date().toISOString()}] Translated message for user ${otherUser.id} in conversation ${roomId}`);
            await pusher.trigger(`private-user-${otherUser.id}`, 'newMessage', {
              ...message,
              content: translatedContent,
            });
            console.log(`[${new Date().toISOString()}] Sent translated message to user ${otherUser.id}`);
          }
        } else if (roomType === 'ai') {
          const aiResponse = await generateResponse(content, language);
          console.log(`[${new Date().toISOString()}] Generated AI response for user ${userId} in AI chat ${roomId} and the language being ${language}`);
          const aiMessage = await saveMessage('AI', roomId, 'ai', aiResponse, language);
          await pusher.trigger(`private-${roomType}-${roomId}`, 'newMessage', aiMessage);
          console.log(`[${new Date().toISOString()}] Sent AI response to user ${userId} in AI chat ${roomId}`);
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error sending message:`, error);
        await pusher.trigger(`private-user-${userId}`, 'error', { message: 'Failed to send message' });
      }
    },
  };
}

async function getMessages(roomId: string, roomType: string) {
    console.log(`[${new Date().toISOString()}] Fetching messages for ${roomType} ${roomId}`);
    let messages: any[] | undefined;
    if (roomType === 'group') {
      messages = await prisma.message.findMany({
        where: { groupId: roomId },
        orderBy: { createdAt: 'asc' },
        include: { sender: true },
      });
    } else if (roomType === 'conversation') {
      messages = await prisma.message.findMany({
        where: { conversationId: roomId },
        orderBy: { createdAt: 'asc' },
        include: { sender: true },
      });
    } else if (roomType === 'ai') {
      messages = await prisma.aIMessage.findMany({
        where: { aiChatId: roomId },
        orderBy: { createdAt: 'asc' },
      });
    }
    console.log(`[${new Date().toISOString()}] Fetched ${messages?.length || 0} messages for ${roomType} ${roomId}`);
    return messages;
  }
  
  async function saveMessage(userId: string, roomId: string, roomType: string, content: string, language: string) {
    console.log(`[${new Date().toISOString()}] Saving message for user ${userId} in ${roomType} ${roomId}`);
    let savedMessage;
    if (roomType === 'group') {
      savedMessage = await prisma.message.create({
        data: {
          content,
          originalLanguage: language,
          senderId: userId,
          groupId: roomId,
        },
        include: { sender: true },
      });
    } else if (roomType === 'conversation') {
      savedMessage = await prisma.message.create({
        data: {
          content,
          originalLanguage: language,
          senderId: userId,
          conversationId: roomId,
        },
        include: { sender: true },
      });
    } else if (roomType === 'ai') {
      savedMessage = await prisma.aIMessage.create({
        data: {
          content,
          isUser: userId !== 'AI',
          aiChatId: roomId,
        },
      });
    }
    console.log(`[${new Date().toISOString()}] Saved message with ID ${savedMessage?.id} for user ${userId} in ${roomType} ${roomId}`);
    return savedMessage;
  }
  