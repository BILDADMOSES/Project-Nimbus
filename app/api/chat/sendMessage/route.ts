import { NextApiRequest, NextApiResponse } from 'next';
import { setupPusherServer } from '@/server/pusher';

const pusherServer = setupPusherServer();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, roomId, roomType, content, language } = req.body;
    await pusherServer.handleSendMessage(userId, roomId, roomType, content, language);
    res.status(200).json({ message: 'Message sent successfully' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}