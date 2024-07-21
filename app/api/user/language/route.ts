import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/prisma';
import { authOptions } from '../../auth/authOptions';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (req.method === 'PUT') {
    const { languageCode } = req.body;

    try {
      await prisma.user.update({
        where: { email: session.user.email || ""},
        data: { preferredLanguage: languageCode },
      });

      return NextResponse.json(
        { message: 'User language updated successfully' },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error updating user language:', error);
      return NextResponse.json(
        { message: 'Failed to update user language' },
        { status: 500 }
      );
    }
  } else {
    return NextResponse.json(
      { message: 'Method not allowed' },
      { status: 405 }
    );
  }
}