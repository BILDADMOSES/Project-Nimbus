import { UsageLimits } from "@/lib/usageTracking"

export interface Message {
    id: string;
    content: string | { [key: string]: string }; 
    originalContent?: string; 
    senderId: string;
    timestamp: any;
    type: 'text' | 'image' | 'file';
    fileUrl?: string;
    chatId: string;
  }
  export interface ChatData {
    id: string;
    type: 'private' | 'group';
    name?: string;
    participants: string[];
  }
  
  export interface UserData {
    id: string;
    username: string;
    preferredLang?: string | null;
    email: string;
    image?: string;
  }

  export interface User {
    id: string;
    username?: string | null;
    preferredLang?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    usageStatus?: UsageLimits;
    tier?: string;
  }