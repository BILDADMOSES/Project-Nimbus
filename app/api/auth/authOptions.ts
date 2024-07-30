import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { auth } from "@/lib/firebase/firebaseAdmin";
import { Prisma } from "@prisma/client";
import prisma from "@/prisma";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Create or update user in Firebase
          const firebaseUser = await auth.getUserByEmail(user.email!).catch(() => null);
          
          if (!firebaseUser) {
            await auth.createUser({
              uid: user.id,
              email: user.email!,
              displayName: user.name!,
              photoURL: user.image,
            });
          } else {
            await auth.updateUser(firebaseUser.uid, {
              displayName: user.name!,
              photoURL: user.image,
            });
          }

          // Create or update user in your database (e.g., MongoDB via Prisma)
          const dbUser = await prisma.user.upsert({
            where: { email: user.email! },
            update: {
              firebaseUid: firebaseUser ? firebaseUser.uid : user.id,
              name: user.name!,
              avatar: user.image,
            },
            create: {
              firebaseUid: firebaseUser ? firebaseUser.uid : user.id,
              email: user.email!,
              name: user.name!,
              avatar: user.image,
              preferredLanguage: "en",
            },
          } as Prisma.UserUpsertArgs);

          user.id = dbUser.id; // Set the user id
          return true;
        } catch (error) {
          console.error("Error syncing user data:", error);
          return false;
        }
      }
      return false;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!; // Use the token's sub as the user id
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id; // Ensure the user's id is in the token
      }
      return token;
    },
  },
  pages: {
    signIn: "/sign-in",
    newUser: "/sign-up",
  },
};