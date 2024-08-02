import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { firestore } from '@/lib/firebase/firebaseAdmin';

async function getLastChat(db: FirebaseFirestore.Firestore, userId: string, collectionName: string) {
  const ref = db.collection(collectionName);
  let query = ref.where('members', 'array-contains', userId);

  try {
    query = query.orderBy('updatedAt', 'desc');
  } catch (error) {
    console.warn(`Unable to order by updatedAt in ${collectionName}, falling back to default order`);
  }

  query = query.limit(1);
  const snapshot = await query.get();

  if (snapshot.empty) {
    return null;
  }

  const lastChat = snapshot.docs[0].data();
  lastChat.id = snapshot.docs[0].id;
  lastChat.type = collectionName.slice(0, -1); // Remove 's' from the end
  return lastChat;
}

async function fetchMemberDetails(db: FirebaseFirestore.Firestore, memberIds: string[]) {
  const memberPromises = memberIds.map(async (memberId: string) => {
    const memberDoc = await db.collection('users').doc(memberId).get();
    const memberData = memberDoc.data();
    return {
      id: memberId,
      name: memberData?.name,
      email: memberData?.email,
    };
  });

  return Promise.all(memberPromises);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const db = firestore;

    // Try to fetch last conversation
    let lastChat = await getLastChat(db, userId, 'conversations');

    // If no conversation, try to fetch last AI chat
    if (!lastChat) {
      lastChat = await getLastChat(db, userId, 'aiChats');
    }

    // If no AI chat, try to fetch last group
    if (!lastChat) {
      lastChat = await getLastChat(db, userId, 'groups');
    }

    // If no chat found at all
    if (!lastChat) {
      return NextResponse.json({ chat: null });
    }

    // Fetch member details if it's a conversation or group
    if (lastChat.type !== 'aiChat' && lastChat.members) {
      const members = await fetchMemberDetails(db, lastChat.members);
      lastChat.members = members;
    }

    return NextResponse.json({ chat: lastChat });

  } catch (error) {
    console.error('Error fetching last chat:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}