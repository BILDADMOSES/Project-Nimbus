// @/server/websocket.ts
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { translateMessage } from '../lib/utils/translation';
import { generateResponse } from '../lib/utils/aiChat';
import prisma from '../prisma';

export function setupWebSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'https://chat-easy-six.vercel.app',
      methods: ['GET', 'POST'],
    },
  });

  const userSockets = new Map<string, Set<string>>();

  io.on('connection', (socket: Socket) => {
    console.log(`[${new Date().toISOString()}] New client connected: ${socket.id}`);

    socket.on('authenticate', (userId: string) => {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);
      console.log(`[${new Date().toISOString()}] User ${userId} authenticated with socket ${socket.id}`);
    });

    socket.on('join', async ({ userId, roomId, roomType }) => {
      socket.join(roomId);
      console.log(`[${new Date().toISOString()}] User ${userId} joined ${roomType} ${roomId}`);

      // Send room history
      const messages = await getMessages(roomId, roomType);
      socket.emit('roomHistory', messages);
      console.log(`[${new Date().toISOString()}] Sent room history to user ${userId} for ${roomType} ${roomId}`);
    });

    socket.on('leave', ({ userId, roomId, roomType }) => {
      socket.leave(roomId);
      console.log(`[${new Date().toISOString()}] User ${userId} left ${roomType} ${roomId}`);
    });

    socket.on('sendMessage', async ({ userId, roomId, roomType, content, language }) => {
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
            const memberSockets = userSockets.get(member.user.id);
            if (memberSockets) {
              memberSockets.forEach(socketId => {
                io.to(socketId).emit('newMessage', {
                  ...message,
                  content: translatedContent,
                });
                console.log(`[${new Date().toISOString()}] Sent translated message to user ${member.user.id} socket ${socketId}`);
              });
            }
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
            const otherUserSockets = userSockets.get(otherUser.id);
            if (otherUserSockets) {
              otherUserSockets.forEach(socketId => {
                io.to(socketId).emit('newMessage', {
                  ...message,
                  content: translatedContent,
                });
                console.log(`[${new Date().toISOString()}] Sent translated message to user ${otherUser.id} socket ${socketId}`);
              });
            }
          }
        } else if (roomType === 'ai') {
          const aiResponse = await generateResponse(content, language);
          console.log(`[${new Date().toISOString()}] Generated AI response for user ${userId} in AI chat ${roomId} and the language being ${language}`);
          const aiMessage = await saveMessage('AI', roomId, 'ai', aiResponse, language);
          socket.emit('newMessage', aiMessage);
          console.log(`[${new Date().toISOString()}] Sent AI response to user ${userId} in AI chat ${roomId}`);
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error sending message:`, error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}`);
      userSockets.forEach((sockets, userId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          console.log(`[${new Date().toISOString()}] Removed socket ${socket.id} for user ${userId}`);
          if (sockets.size === 0) {
            userSockets.delete(userId);
            console.log(`[${new Date().toISOString()}] Removed all sockets for user ${userId}`);
          }
          return;
        }
      });
    });
  });

  return io;
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

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function saveMessage(userId: string, roomId: string, roomType: string, content: string, languageCode: string) {
  console.log(`[${new Date().toISOString()}] Saving message for user ${userId} in ${roomType} ${roomId}`);
  let savedMessage;
  if (roomType === 'group') {
    savedMessage = await prisma.message.create({
      data: {
        content,
        originalLanguage: languageCode,
        language: {
          connect: { code: languageCode },
        },
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
        originalLanguage: languageCode,
        language: {
          connect: { code: languageCode },
        },
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
