import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    res.status(401).send('Unauthorized');
    return;
  }

  const { socket_id, channel_name } = req.body;

  const auth = pusher.authorizeChannel(socket_id, channel_name);
  res.send(auth);
}