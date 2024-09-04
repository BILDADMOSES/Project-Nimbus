import { create } from "zustand";

interface ChatType {
  selectedChatType: "private" | "group" | "ai" | null;
  setSelectedChatType: (chatType: "private" | "group" | "ai" | null) => void;
}

const useChatTypeStore = create<ChatType>((set) => ({
  selectedChatType: null,
  setSelectedChatType: (selectedChatType: "private" | "group" | "ai" | null) =>
    set({ selectedChatType }),
}));

export default useChatTypeStore;
