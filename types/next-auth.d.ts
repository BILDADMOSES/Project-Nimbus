import type { DefaultUser } from "next-auth/core/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      preferredLanguage: string;
    } & DefaultUser;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    preferredLanguage: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    preferredLanguage: string;
  }
}
