import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/firebaseClient"; // Client-side auth
import { firestore } from "@/lib/firebase/firebaseAdmin"; // Server-side admin Firestore

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        try {
          // Authenticate with Firebase
          const userCredential = await signInWithEmailAndPassword(
            firebaseAuth,
            credentials.email,
            credentials.password
          );
          const firebaseUser = userCredential.user;

          // Get or create user in Firestore
          const userRef = firestore.collection('users').doc(firebaseUser.uid);
          const userSnap = await userRef.get();

          let dbUser;
          if (!userSnap.exists) {
            dbUser = {
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
              avatar: firebaseUser.photoURL,
              preferredLanguage: "en",
            };
            await userRef.set(dbUser);
          } else {
            dbUser = userSnap.data();
          }

          console.log("Authenticated user:", dbUser);

          return {
            id: firebaseUser.uid,
            email: dbUser.email,
            name: dbUser.name,
            image: dbUser.avatar,
            preferredLanguage: dbUser.preferredLanguage,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        // This is the initial sign in
        return {
          ...token,
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          preferredLanguage: user.preferredLanguage,
        };
      }
      // Subsequent requests will have the token but not the user
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.image = token.image;
      session.user.preferredLanguage = token.preferredLanguage;

      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
    newUser: "/sign-up",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);