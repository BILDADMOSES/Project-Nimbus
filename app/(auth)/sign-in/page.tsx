import { NextAuthOptions } from "next-auth";
import { FirebaseAdapter } from "@next-auth/firebase-adapter";
import { cert } from "firebase-admin/app";
import { initFirebase } from "@/lib/firebase/firebaseAdmin";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/prisma";

const firebaseAdminApp = initFirebase();

export const authOptions: NextAuthOptions = {
  adapter: FirebaseAdapter(firebaseAdminApp),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Sync user data with MongoDB
        const mongoUser = await prisma.user.upsert({
          where: { email: user.email! },
          update: {
            firebaseUid: user.id,
            name: user.name!,
            avatar: user.image,
          },
          create: {
            firebaseUid: user.id,
            email: user.email!,
            name: user.name!,
            avatar: user.image,
            preferredLanguage: "en", // Default language
          },
        });
        return true;
      }
      return false;
    },
    async session({ session, token }) {
      if (session.user) {
        const mongoUser = await prisma.user.findUnique({
          where: { firebaseUid: token.sub! },
        });
        session.user.id = mongoUser?.id;
        session.user.preferredLanguage = mongoUser?.preferredLanguage;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
};