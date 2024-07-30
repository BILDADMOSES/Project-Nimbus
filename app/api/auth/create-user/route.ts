import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import prisma from '@/prisma';
import { initFirebase } from '@/lib/firebase/firebaseAdmin';

initFirebase();

export async function POST(request: NextRequest) {
  console.log('Received request to create user');
  try {
    const body = await request.json();
    console.log('Request body:', body);

    const { firebaseUid, email, firstName, lastName, preferredLanguage } = body;

    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return NextResponse.json({ message: 'Missing or invalid Authorization header' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    try {
      console.log('Verifying ID token');
      const decodedToken = await getAuth().verifyIdToken(idToken);
      if (decodedToken.uid !== firebaseUid) {
        console.log('Token UID does not match provided firebaseUid');
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      console.log('Token verified successfully');
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    console.log('Checking for existing user');
    const existingUser = await prisma.user.findUnique({ where: { firebaseUid } });
    if (existingUser) {
      console.log('User already exists');
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    console.log('Creating new user');
    const newUser = await prisma.user.create({
      data: {
        firebaseUid,
        email,
        name: `${firstName} ${lastName}`,
        preferredLanguage,
      },
    });

    console.log('User created successfully:', newUser.id);
    return NextResponse.json({ message: 'User created successfully', userId: newUser.id }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}