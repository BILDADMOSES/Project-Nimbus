import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { firestore } from '@/lib/firebase/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const firebaseUid = session.user.id;

    // Get Firestore instance
    const db = firestore;

    // Fetch the last conversation
    const conversationsRef = db.collection('conversations');
    let query = conversationsRef.where('members', 'array-contains', firebaseUid);

    try {
      // Try to order by updatedAt
      query = query.orderBy('updatedAt', 'desc');
    } catch (error) {
      console.warn('Unable to order by updatedAt, falling back to default order');
    }

    query = query.limit(1);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json({ conversation: null });
    }

    const lastConversation = snapshot.docs[0].data();
    lastConversation.id = snapshot.docs[0].id;

    // Fetch member details
    const memberPromises = lastConversation.members.map(async (memberId: string) => {
      const memberDoc = await db.collection('users').doc(memberId).get();
      const memberData = memberDoc.data();
      return {
        id: memberId,
        name: memberData?.name,
        email: memberData?.email,
      };
    });

    const members = await Promise.all(memberPromises);

    return NextResponse.json({
      conversation: {
        ...lastConversation,
        members,
      }
    });

  } catch (error) {
    console.error('Error fetching last conversation:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}