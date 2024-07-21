import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/prisma';
import { authOptions } from '../../auth/authOptions';

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { languageCode } = await request.json();

    await prisma.user.update({
      where: { email: session.user.email || "" },
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
}