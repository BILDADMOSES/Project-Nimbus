import { NextRequest, NextResponse } from 'next/server';
import { setupPusherServer } from '@/lib/pusher-server';
import { translateMessage, generateResponse, saveMessage } from '@/lib/chat-utils';
import prisma from '@/prisma';

const pusher = setupPusherServer();

export async function POST(request: NextRequest) {
  const { userId, roomId, roomType, content, language } = await request.json();
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
          // Save the message for the conversation
          const savedMessage = await prisma.message.create({
            data: {
              content,
              sender: { connect: { id: userId } },
              conversation: { connect: { id: roomId } },
            },
            include: { sender: true },
          });
      
          await pusher.trigger(`private-user-${otherUser.id}`, 'newMessage', {
            ...savedMessage,
          });
          console.log(`[${new Date().toISOString()}] Sent message to user ${otherUser.id}`);
        }
      } else if (roomType === 'ai') {
        const aiResponse = await generateResponse(content, language);
        console.log(`[${new Date().toISOString()}] Generated AI response for user ${userId} in AI chat ${roomId} and the language being ${language}`);
        const aiMessage = await saveMessage('AI', roomId, 'ai', aiResponse, language);
        await pusher.trigger(`private-${roomType}-${roomId}`, 'newMessage', aiMessage);
        console.log(`[${new Date().toISOString()}] Sent AI response to user ${userId} in AI chat ${roomId}`);
      }

      return NextResponse.json({ message: 'Message sent successfully' }, { status: 200 });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error sending message:`, error);
    await pusher.trigger(`private-user-${userId}`, 'error', { message: 'Failed to send message' });
    return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
  }
}