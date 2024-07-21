import prisma from '@/prisma'
import { translateMessage as translate } from './utils/translation'
import { generateResponse as generateAIResponse } from './utils/aiChat'

export async function getMessages(roomId: string, roomType: string) {
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

export async function saveMessage(userId: string, roomId: string, roomType: string, content: string, languageCode: string) {
    console.log(`[${new Date().toISOString()}] Saving message for user ${userId} in ${roomType} ${roomId}`);
    
    if (!languageCode) {
      throw new Error('Language code is required');
    }
    
    let savedMessage;
    if (roomType === 'group') {
      savedMessage = await prisma.message.create({
        data: {
          content,
          sender: {
            connect: { id: userId },
          },
          group: {
            connect: { id: roomId },
          },
        },
        include: { sender: true },
      });
    } else if (roomType === 'conversation') {
      savedMessage = await prisma.message.create({
        data: {
          content,
          sender: {
            connect: { id: userId },
          },
          conversation: {
            connect: { id: roomId },
          },
        },
        include: { sender: true },
      });
    } else if (roomType === 'ai') {
      savedMessage = await prisma.aIMessage.create({
        data: {
          content,
          isUser: userId !== 'AI',
          aiChat: {
            connect: { id: roomId },
          },
        },
      });
    }
    console.log(`[${new Date().toISOString()}] Saved message with ID ${savedMessage?.id} for user ${userId} in ${roomType} ${roomId}`);
    return savedMessage;
  }

export const translateMessage = translate;
export const generateResponse = generateAIResponse;