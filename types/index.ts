export interface Message {
    id: string;
    content: string | { [key: string]: string }; 
    originalContent?: string; 
    senderId: string;
    timestamp: any;
    type: 'text' | 'image' | 'file';
    fileUrl?: string;
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