import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../authOptions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (session) {
    res.redirect('/api/auth/session');
  } else {
    res.redirect('/sign-in?error=GoogleAuthFailed');
  }
}