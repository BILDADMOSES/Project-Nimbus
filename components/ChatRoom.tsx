import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  where,
  limit,
  startAfter,
  getDocs,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";
import { format, isToday, isYesterday } from "date-fns";
import ChatHeader from "@/components/ChatHeader";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";
import UserDetailsSidebar from "@/components/UserDetailsSidebar";
import { Message, ChatData, UserData } from "@/types";
import Image from "next/image";

const MESSAGES_PER_PAGE = 30;

interface ChatRoomProps {
  chatId: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ chatId }) => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [participants, setParticipants] = useState<{ [key: string]: UserData }>(
    {}
  );
  const [isUserDetailsSidebarOpen, setIsUserDetailsSidebarOpen] =
    useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [sharedFiles, setSharedFiles] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [participantLanguages, setParticipantLanguages] = useState<string[]>(
    []
  );
  const router = useRouter();

  const loadMoreMessages = useCallback(async () => {
    if (!chatId || !session?.user?.id || !hasMore) return;

    const lastMessage = messages[0];
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy("timestamp", "desc"),
      startAfter(lastMessage?.timestamp || new Date()),
      limit(MESSAGES_PER_PAGE)
    );

    const querySnapshot = await getDocs(q);
    const newMessages: Message[] = [];
    querySnapshot.forEach((doc) => {
      newMessages.push({ id: doc.id, ...doc.data() } as Message);
    });

    if (newMessages.length < MESSAGES_PER_PAGE) {
      setHasMore(false);
    }

    setMessages((prevMessages) => [...newMessages.reverse(), ...prevMessages]);
  }, [chatId, session, hasMore, messages]);

  useEffect(() => {
    if (!chatId || !session?.user?.id) return;

    const fetchChatData = async () => {
      const chatDoc = await getDoc(doc(db, "chats", chatId));
      if (chatDoc.exists()) {
        const data = chatDoc.data() as ChatData;
        setChatData({ id: chatDoc.id, ...data });

        // Fetch all participants' data
        const participantsData: { [key: string]: UserData } = {};
        for (const participantId of data.participants) {
          const userDoc = await getDoc(doc(db, "users", participantId));
          if (userDoc.exists()) {
            participantsData[participantId] = {
              id: participantId,
              ...userDoc.data(),
            } as UserData;
          }
        }
        setParticipants(participantsData);

        if (data.type === "private") {
          const otherParticipantId = data.participants.find(
            (p) => p !== session.user.id
          );
          if (otherParticipantId) {
            setSelectedUser(participantsData[otherParticipantId]);
          }
        }

        // Set participant languages for group chats
        if (data.type === "group") {
          const languages = new Set<string>();
          Object.values(participantsData).forEach((user) => {
            if (user.preferredLang) {
              languages.add(user.preferredLang);
            }
          });
          setParticipantLanguages(Array.from(languages));
        }
      }
    };
    fetchChatData();

    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy("timestamp", "desc"),
      limit(MESSAGES_PER_PAGE)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        fetchedMessages.unshift({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(fetchedMessages);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, session]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreMessages();
        }
      },
      { threshold: 0.1 }
    );
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreMessages, hasMore]);

  useEffect(() => {
    const currentObserver = observerRef.current;
    const currentLastMessageRef = lastMessageRef.current;

    if (messages.length > 0 && currentObserver && currentLastMessageRef) {
      currentObserver.observe(currentLastMessageRef);
    }

    return () => {
      if (currentObserver && currentLastMessageRef) {
        currentObserver.unobserve(currentLastMessageRef);
      }
    };
  }, [messages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (chatId) {
      const q = query(
        collection(db, `chats/${chatId}/messages`),
        where("type", "in", ["image", "file"]),
        orderBy("timestamp", "desc")
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const files: Message[] = [];
        querySnapshot.forEach((doc) => {
          files.push({ id: doc.id, ...doc.data() } as Message);
        });
        setSharedFiles(files);
      });
      return () => unsubscribe();
    }
  }, [chatId]);

  // Dummy translation function (replace with actual translation service)
  const translateMessage = async (
    message: string,
    targetLang: string
  ): Promise<string> => {
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY;
    const API_URL = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_URL;

    const translateText = async (text: string, targetLanguage: string) => {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          target: targetLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      return data.data.translations[0].translatedText;
    };
    const translatedMessage = await translateText(message, targetLang);

    return translatedMessage;
  };

  const sendMessage = async (content: string, file?: File) => {
    if ((!content.trim() && !file) || !session?.user?.id) return;

    try {
      let messageData: Partial<Message> = {
        senderId: session.user.id,
        timestamp: serverTimestamp(),
        originalContent: content, // Store the original message
      };

      if (file) {
        const storageRef = ref(storage, `chats/${chatId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        messageData = {
          ...messageData,
          type: file.type.startsWith("image/") ? "image" : "file",
          content: file.name,
          fileUrl: downloadURL,
        };
      } else {
        messageData = {
          ...messageData,
          type: "text",
        };

        if (chatData?.type === "private") {
          const otherParticipantId = chatData.participants.find(
            (p) => p !== session.user.id
          );
          if (otherParticipantId) {
            const userDoc = await getDoc(doc(db, "users", otherParticipantId));
            if (userDoc.exists()) {
              const userData = userDoc.data() as UserData;
              const translatedContent = await translateMessage(
                content,
                userData.preferredLang || "en"
              );
              messageData.content = translatedContent;
            }
          }
        } else if (chatData?.type === "group") {
          const translations: { [key: string]: string } = {};
          await Promise.all(
            participantLanguages.map(async (lang) => {
              translations[lang] = await translateMessage(content, lang);
            })
          );
          messageData.content = translations;
        } else if (chatData?.type === "ai") {
          // For AI chat, we don't translate the message
          messageData.content = content;
        }
      }
      console.log("ADDING MESSAGE", messageData);
      await addDoc(collection(db, `chats/${chatId}/messages`), messageData);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const renderMessage = (message: Message) => {
    if (message.senderId === session?.user?.id) {
      return (
        message.originalContent ||
        (typeof message.content === "string" ? message.content : "")
      );
    }

    if (chatData?.type === "group" && typeof message.content === "object") {
      const userLang = session?.user?.preferredLang || "en";
      if (message.content[userLang]) {
        return message.content[userLang];
      } else {
        // Fallback: translate the original message and update the content
        translateAndUpdateMessage(message, userLang);
        return message.originalContent || "";
      }
    }

    return typeof message.content === "string" ? message.content : "";
  };

  const translateAndUpdateMessage = async (
    message: Message,
    targetLang: string
  ) => {
    if (!message.originalContent) return;

    const translatedContent = await translateMessage(
      message.originalContent,
      targetLang
    );
    const updatedContent = {
      ...message.content,
      [targetLang]: translatedContent,
    };

    await updateDoc(doc(db, `chats/${chatId}/messages`, message.id), {
      content: updatedContent,
    });
  };

  const handleBlockUser = async (userId: string) => {
    if (!session?.user?.id) return;

    try {
      // Add the blocked user to the current user's blocked list
      await updateDoc(doc(db, "users", session.user.id), {
        blockedUsers: arrayUnion(userId),
      });

      // Remove the blocked user from the chat participants
      await updateDoc(doc(db, "chats", chatId), {
        participants: arrayRemove(userId),
      });

      // Close the sidebar and redirect to the chat list
      setIsUserDetailsSidebarOpen(false);
      router.push("/chat");
    } catch (error) {
      console.error("Error blocking user:", error);
      // Handle error: show error message
    }
  };

  const handleLeaveGroup = async () => {
    if (!session?.user?.id) return;

    try {
      // Remove the current user from the chat participants
      await updateDoc(doc(db, "chats", chatId), {
        participants: arrayRemove(session.user.id),
      });

      // Close the sidebar and redirect to the chat list
      setIsUserDetailsSidebarOpen(false);
      router.push("/chat");
    } catch (error) {
      console.error("Error leaving group:", error);
      // Handle error: show error message
    }
  };

  const handleDeleteChat = async () => {
    if (!session?.user?.id) return;

    try {
      // Delete the chat document
      await deleteDoc(doc(db, "chats", chatId));

      // Delete all messages in the chat
      const messagesQuery = query(collection(db, `chats/${chatId}/messages`));
      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // Close the sidebar and redirect to the chat list
      setIsUserDetailsSidebarOpen(false);
      router.push("/chat");
    } catch (error) {
      console.error("Error deleting chat:", error);
      // Handle error: show error message
    }
  };

  const renderDateDivider = (date: Date) => {
    let dateString;
    if (isToday(date)) {
      dateString = "Today";
    } else if (isYesterday(date)) {
      dateString = "Yesterday";
    } else {
      dateString = format(date, "MMMM d, yyyy");
    }
    return (
      <div className="text-center my-4">
        <span className="bg-base-300 text-base-content px-2 py-1 rounded-full text-sm">
          {dateString}
        </span>
      </div>
    );
  };

  const renderUserAvatar = (userId: string) => {
    const user = participants[userId];
    if (!user) return null;

    if (user.image) {
      return (
        <Image
          src={user.image}
          alt={user.username}
          width={40}
          height={40}
          className="rounded-full"
        />
      );
    } else {
      return (
        <div className="avatar placeholder">
          <div className="bg-neutral-focus text-neutral-content rounded-full w-10">
            <span className="text-xl">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      );
    }
  };

  if (isLoading || !chatData) {
    return (
      <div className="fixed inset-0 bg-base-200 bg-opacity-50 backdrop-blur-sm flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex max-h-[90vh] ">
      <div className="flex-1 flex flex-col bg-base-100 bg-opacity-0 backdrop-blur-md rounded-lg shadow-lg overflow-hidden">
        <ChatHeader
          chatData={chatData}
          participants={participants}
          currentUserId={session?.user?.id}
          onOpenSidebar={() => {
            setSelectedUser(
              chatData.type === "private"
                ? participants[
                    chatData.participants.find((p) => p !== session?.user?.id)!
                  ]
                : null
            );
            setIsUserDetailsSidebarOpen(true);
          }}
        />
        
          <MessageList
            messages={messages}
            participants={participants}
            currentUserId={session?.user?.id}
            chatType={chatData.type}
            hasMore={hasMore}
            lastMessageRef={lastMessageRef}
            chatContainerRef={chatContainerRef}
            renderMessage={renderMessage}
          />
        
        <MessageInput onSendMessage={sendMessage} />
      </div>
      {isUserDetailsSidebarOpen && (
        <UserDetailsSidebar
          user={
            selectedUser ||
            participants[
              chatData.participants.find((p) => p !== session?.user?.id)!
            ] ||
            undefiined
          }
          chatType={chatData.type}
          sharedFiles={sharedFiles}
          onClose={() => setIsUserDetailsSidebarOpen(false)}
          participants={
            chatData.type === "group" ? Object.values(participants) : undefined
          }
          onBlockUser={handleBlockUser}
          onLeaveGroup={handleLeaveGroup}
          onDeleteChat={handleDeleteChat}
        />
      )}
    </div>
  );
};

export default ChatRoom;
