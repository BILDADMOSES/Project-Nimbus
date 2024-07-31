import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id; // This should be the Firebase UID
  const { isOnline } = await request.json();

  try {
    const userStatusRef = firebaseAdmin.firestore.collection('userStatus').doc(userId);
    await userStatusRef.set({
      online: isOnline,
      lastSeen: FieldValue.serverTimestamp()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const userStatusRef = firebaseAdmin.firestore.collection('userStatus').doc(userId);
    const userStatus = await userStatusRef.get();

    if (!userStatus.exists) {
      return NextResponse.json({ error: "User status not found" }, { status: 404 });
    }

    const data = userStatus.data();
    const isOnline = data?.online || false;
    const lastSeen = data?.lastSeen?.toDate() || null;

    return NextResponse.json({ isOnline, lastSeen });
  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}