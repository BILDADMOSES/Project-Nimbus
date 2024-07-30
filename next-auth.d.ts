import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      firebaseUid: string
      preferredLanguage: string
      // other user properties
    }
  }
  interface User {
    firebaseUid: string
    preferredLanguage: string
    // other user properties
  }
}