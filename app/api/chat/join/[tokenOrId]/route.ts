import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { firestore } from "@/lib/firebase/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest, { params }: { params: { tokenOrId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { tokenOrId } = params;

    if (!tokenOrId) {
      return NextResponse.json({ message: 'Token or ID is required' }, { status: 400 });
    }

    const invitationRef = firestore.collection('invitations').where('token', '==', tokenOrId).limit(1);
    const invitationSnapshot = await invitationRef.get();

    if (!invitationSnapshot.empty) {
      const invitation = invitationSnapshot.docs[0].data();
      
      if (invitation.status !== 'PENDING') {
        return NextResponse.json({ message: 'Invitation is no longer valid' }, { status: 400 });
      }

      const chatRef = firestore.collection(invitation.chatType === 'group' ? 'groups' : 'conversations').doc(invitation.chatId);
      await chatRef.update({ members: FieldValue.arrayUnion(userId) });

      await invitationSnapshot.docs[0].ref.update({ status: 'ACCEPTED' });

      // Update user document, create if it doesn't exist
      const userRef = firestore.collection('users').doc(userId);
      await userRef.set({
        [`${invitation.chatType}Ids`]: FieldValue.arrayUnion(invitation.chatId)
      }, { merge: true });

      return NextResponse.json({ type: invitation.chatType, id: invitation.chatId }, { status: 200 });
    }

    // Direct join (no invitation)
    const groupRef = firestore.collection('groups').doc(tokenOrId);
    const groupDoc = await groupRef.get();
    if (groupDoc.exists) {
      await groupRef.update({ members: FieldValue.arrayUnion(userId) });
      await firestore.collection('users').doc(userId).set({
        groupIds: FieldValue.arrayUnion(tokenOrId)
      }, { merge: true });
      return NextResponse.json({ type: 'group', id: tokenOrId }, { status: 200 });
    }

    const conversationRef = firestore.collection('conversations').doc(tokenOrId);
    const conversationDoc = await conversationRef.get();
    if (conversationDoc.exists) {
      await conversationRef.update({ members: FieldValue.arrayUnion(userId) });
      await firestore.collection('users').doc(userId).set({
        conversationIds: FieldValue.arrayUnion(tokenOrId)
      }, { merge: true });
      return NextResponse.json({ type: 'conversation', id: tokenOrId }, { status: 200 });
    }

    return NextResponse.json({ message: 'Invalid invitation or chat ID' }, { status: 404 });
  } catch (error) {
    console.error('Error processing join request:', error);
    return NextResponse.json({ message: 'Failed to process join request' }, { status: 500 });
  }
}