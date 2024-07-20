import NextAuth from "next-auth"
export interface SignInForm {
    email: string;
    password: string;
  }

export interface SignUpForm {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
  }
  
  export interface SignUpError {
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }
  
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
  }
}

export interface Language {
    code: string;
    name: string;
  }
  
  export type ChatType = 'oneOnOne' | 'group' | 'ai';
  
  export interface CreateChatParams {
    language: string;
    chatType: ChatType;
    inviteEmail?: string;
  }
  
  export interface Chat {
    id: string;
    inviteLink: string;
  }

  export interface InviteMemberProps {
    email: string;
    onChange: (email: string) => void;
    inviteLink: string;
  }