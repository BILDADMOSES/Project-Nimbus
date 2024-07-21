import { NextApiRequest, NextApiResponse } from 'next';
import { setupPusherServer } from '@/server/pusher';

const pusherServer = setupPusherServer();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, roomId, roomType } = req.body;
    pusherServer.handleLeave(userId, roomId, roomType);
    res.status(200).json({ message: 'Left successfully' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}