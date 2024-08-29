import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebaseClient";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { getUsageStatus, FREE_TIER_LIMITS } from "@/lib/usageTracking";
import { User } from "@/types";


export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        emailOrUsername: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.emailOrUsername || !credentials?.password)
          return null;

        try {
          let email = credentials.emailOrUsername;

          // Check if the input is a username
          if (!email.includes("@")) {
            const usersRef = collection(db, "users");
            const q = query(
              usersRef,
              where("username", "==", credentials.emailOrUsername)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
              throw new Error("User not found");
            }

            email = querySnapshot.docs[0].data().email;
          }

          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            credentials.password
          );
          const userDocRef = doc(db, "users", userCredential.user.uid);
          const userDoc = await getDoc(userDocRef);
          let userData = userDoc.data();

          // If user data doesn't exist, initialize it
          if (!userData) {
            userData = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              username: userCredential.user.displayName,
              fullName: userCredential.user.displayName,
              preferredLang: "en", // Default language
              avatar: userCredential.user.photoURL,
              tier: "free", // Default tier
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, userData);
          } else if (!userData.tier) {
            userData.tier = "free";
            await setDoc(userDocRef, { tier: "free" }, { merge: true });
          }

          const usageStatus = await getUsageStatus(userCredential.user.uid);

          return {
            id: userCredential.user.uid,
            email: userCredential.user.email,
            name: userData.fullName || userCredential.user.displayName,
            username: userData.username,
            preferredLang: userData.preferredLang,
            image: userData.avatar,
            usageStatus,
            tier: userData.tier,
          };
        } catch (error) {
          console.error("Error in authorize:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.username = user.username;
        token.preferredLang = user.preferredLang;
        token.image = user.image;
        token.usageStatus = user.usageStatus;
        token.tier = user.tier;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.username = token.username;
        session.user.preferredLang = token.preferredLang;
        session.user.image = token.image;
        session.user.usageStatus = token.usageStatus;
        session.user.tier = token.tier;
        session.user.limits = FREE_TIER_LIMITS;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};
