import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { comparePasswords } from "@/lib/utils/password";
import prisma from "@/prisma";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        if (!user) {
          return null;
        }
        const userPassword = user.password || "";
        const isPasswordValid = await comparePasswords(credentials.password, userPassword);
        if (!isPasswordValid) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          preferredLanguage: user.preferredLanguage,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.preferredLanguage = user.preferredLanguage;
      }
      // Include the provider in the token
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.preferredLanguage = token.preferredLanguage as string;
        // Include the provider in the session
        session.provider = token.provider as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Handle Google sign-in
        const existingUser = await prisma.user.findUnique({
          where: { email: profile?.email },
        });

        if (!existingUser) {
          // Create a new user if they don't exist
          await prisma.user.create({
            data: {
              email: profile?.email,
              name: profile?.name,
              // Set default preferred language or get it from profile if available
              preferredLanguage: "en",
            },
          });
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // If the url starts with baseUrl, allow it
      if (url.startsWith(baseUrl)) return url;
      // Allows relative callback URLs
      if (url.startsWith("/")) return new URL(url, baseUrl).toString();
      return baseUrl;
    },
  },
  pages: {
    signIn: "/sign-in",
    newUser: "/sign-up",
  },
};