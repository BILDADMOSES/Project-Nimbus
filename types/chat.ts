export interface ChatProps {
  roomId: string;
  roomType: "group" | "conversation" | "ai";
}

export interface CreateChatParams {
  language: string;
  chatType: "oneOnOne" | "group" | "ai";
}

export type ChatType = "oneOnOne" | "group" | "ai";

export interface CreateChatParams {
  language: string;
  chatType: ChatType;
  inviteEmail?: string;
}

export interface Chat {
  id: string;
  inviteLink: string;
  name?: string;
}


export interface ChatTypeSelectProps {
  selectedType: ChatType | null;
  onSelect: (type: ChatType) => void;
}
