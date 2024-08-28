import NextAuth from "next-auth"
import { UsageLimits } from "@/lib/usageTracking"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string | null;
      preferredLang?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      usageStatus?: UsageLimits;
      tier?: string;
      limits?: UsageLimits;
    }
  }

  interface User {
    id: string;
    username?: string | null;
    preferredLang?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    usageStatus?: UsageLimits;
    tier?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string | null;
    preferredLang?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    usageStatus?: UsageLimits;
    tier?: string;
  }
}