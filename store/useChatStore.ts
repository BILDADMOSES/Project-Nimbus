// src/store/useChatStore.ts
import { create } from "zustand";

interface Chat {
  id: string;
  name: string;
  type: "private" | "group" | "ai";
  lastMessage: string;
  lastMessageTime: Date;
  participants: string[];
  avatar?: string;
}

interface ChatStore {
  chats: Chat[];
  filteredChats: Chat[];
  isLoading: boolean;
  searchTerm: string;
  selectedChatId: string | null;
  setChats: (chats: Chat[]) => void;
  setFilteredChats: (filtered: Chat[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchTerm: (term: string) => void;
  setSelectedChatId: (chatId: string | null) => void;
}

const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  filteredChats: [],
  isLoading: true,
  searchTerm: "",
  selectedChatId: null,
  setChats: (chats) => set({ chats, filteredChats: chats }),
  setFilteredChats: (filtered) => set({ filteredChats: filtered }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedChatId: (chatId) => set({ selectedChatId: chatId }),
}));

export default useChatStore;
