import { useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  Firestore,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useSession } from "next-auth/react";
import SearchBar from "@/components/SearchBar";
import ChatItem from "@/components/ChatItem";
import useChatStore from "@/store/useChatStore"; 

interface ChatListProps {
  userId: string;
  onChatSelect: (chatId: string) => void;
}

export default function ChatList({ userId, onChatSelect }: ChatListProps) {
  const {
    chats,
    filteredChats,
    isLoading,
    searchTerm,
    setChats,
    setFilteredChats,
    setLoading,
    setSearchTerm,
    setSelectedChatId,
  } = useChatStore();

  const { data: session } = useSession();

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db as Firestore, "chats"),
      where("participants", "array-contains", userId)
    );
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const chatsPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const chatData = docSnapshot.data();
        const messagesQuery = query(
          collection(db as Firestore, `chats/${docSnapshot.id}/messages`),
          orderBy("timestamp", "desc"),
          limit(1)
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        const lastMessage = messagesSnapshot.docs[0]?.data();

        let chatName = chatData.name || "";
        let avatar = "";

        if (chatData.type === "private") {
          const otherParticipantId = chatData.participants.find(
            (p) => p !== userId
          );
          if (otherParticipantId) {
            const userDocRef = doc(
              db as Firestore,
              "users",
              otherParticipantId
            );
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              chatName = userData?.username || "Unknown User";
              avatar = userData?.avatar || "";
            }
          }
        } else if (chatData.type === "group") {
          chatName = chatData.name || "Unnamed Group";
        } else if (chatData.type === "ai") {
          chatName = "AI Chat";
        }

        let lastMessageContent = "No messages yet";
        if (lastMessage) {
          if (lastMessage.senderId === userId) {
            lastMessageContent = lastMessage.originalContent || "Empty message";
          } else {
            const userLanguage = session?.user?.preferredLang || 'en';
            lastMessageContent = lastMessage.content?.[userLanguage] || lastMessage.originalContent || "Empty message";
          }
        }

        return {
          id: docSnapshot.id,
          name: chatName,
          type: chatData.type,
          lastMessage: lastMessageContent,
          lastMessageTime: lastMessage?.timestamp?.toDate() || new Date(),
          participants: chatData.participants,
          avatar: avatar,
        };
      });

      const chatsData = await Promise.all(chatsPromises);
      const sortedChats = chatsData.sort(
        (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
      );
      setChats(sortedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, session, setChats, setLoading]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredChats(chats);
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const filtered = chats.filter((chat) => {
        const nameMatch = chat.name.toLowerCase().includes(lowerSearchTerm);
        const messageMatch = chat.lastMessage.toLowerCase().includes(lowerSearchTerm);
        return nameMatch || messageMatch;
      });
      setFilteredChats(filtered);
    }
  }, [searchTerm, chats, setFilteredChats]);

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    onChatSelect(chatId);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col  ">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <div className="flex-1  \">
        {filteredChats.length === 0 ? (
          <p className="text-base-content/70 text-center p-4">
            No chats found.
          </p>
        ) : (
          <ul className="space-y-1 max-h-[410px] scrollbar-hide overflow-y-scroll p-4">
            {filteredChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                onChatSelect={handleChatSelect} 
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
