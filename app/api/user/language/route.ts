import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/prisma';
import { authOptions } from '../../auth/authOptions';
import { firestore } from '@/lib/firebase/firebaseAdmin';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const firebaseUid = session.user.id;
    console.log("Authenticated user:", firebaseUid);

    const { languageCode } = await request.json();
    console.log("Updating language to:", languageCode);

    // Check if the user exists in Prisma
    let user = await prisma.user.findUnique({
      where: { firebaseUid: firebaseUid },
    });

    if (!user) {
      console.log("User not found in Prisma database. Attempting to create...");
      // If the user doesn't exist in Prisma, create them
      try {
        user = await prisma.user.create({
          data: {
            firebaseUid: firebaseUid,
            name: session.user.name || 'Unknown',
            email: session.user.email || 'unknown@example.com',
            preferredLanguage: languageCode,
          },
        });
        console.log("User created in Prisma:", user.firebaseUid);
      } catch (createError) {
        console.error("Error creating user in Prisma:", createError);
        return NextResponse.json(
          { message: 'Failed to create user in database', error: createError instanceof Error ? createError.message : 'Unknown error' },
          { status: 500 }
        );
      }
    } else {
      // Update the existing user in Prisma
      user = await prisma.user.update({
        where: { firebaseUid: firebaseUid },
        data: { preferredLanguage: languageCode },
      });
      console.log("Updated user in Prisma:", user.firebaseUid);
    }

    // Update the user in Firestore
    await firestore.collection('users').doc(firebaseUid).set({
      preferredLanguage: languageCode
    }, { merge: true });

    console.log("Updated user data in Firestore");

    return NextResponse.json(
      { message: 'User language updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user language:', error);
    return NextResponse.json(
      { message: 'Failed to update user language', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}