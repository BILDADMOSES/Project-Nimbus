import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebase } from '@/lib/firebase/firebaseAdmin';

initFirebase();

export async function GET(req: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    // Extract the token
    const idToken = authHeader.split('Bearer ')[1];

    // Verify the Firebase token
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const firebaseUid = decodedToken.uid;

    // Get Firestore instance
    const db = getFirestore();

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
      return NextResponse.json({"conversation":null});
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