import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
  writeBatch,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { checkAndIncrementUsage, FREE_TIER_LIMITS } from "@/lib/usageTracking";
import { User } from "@/types";
import toast from "react-hot-toast";

export const useCreateChat = (
  chatType: "private" | "group" | "ai",
  userId: string | undefined,
  isFreeTier: boolean,
  groupChatCount: number
) => {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [createWithoutUsers, setCreateWithoutUsers] = useState(false);
  const [chatLink, setChatLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"username" | "email">("username");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isGroupNameTaken, setIsGroupNameTaken] = useState(false);

  useEffect(() => {
    const checkGroupName = async () => {
      if (chatType === "group" && groupName.trim()) {
        const groupQuery = query(
          collection(db, "chats"),
          where("type", "==", "group"),
          where("name", "==", groupName.trim())
        );
        const querySnapshot = await getDocs(groupQuery);
        setIsGroupNameTaken(!querySnapshot.empty);
      }
    };

    checkGroupName();
  }, [chatType, groupName]);

  const handleCreateChat = async (closeFunc: () => void) => {
    if (!userId) return;
    if (chatType === "private" && selectedUsers.length > 1) {
      setError("Only one user can be added to a private chat.");
      return;
    }
    if (
      chatType === "group" &&
      selectedUsers.length === 0 &&
      !createWithoutUsers
    ) {
      setError(
        "Please add at least one user to the group chat or choose to create without users."
      );
      return;
    }
    if (chatType === "group" && isGroupNameTaken) {
      setError("A group with this name already exists. Please choose a different name.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (chatType === "group" && isFreeTier) {
        if (groupChatCount >= FREE_TIER_LIMITS.groupChats) {
          setError("You've reached the maximum number of group chats for the free tier. Please upgrade to create more.");
          setIsLoading(false);
          return;
        }
        
        if (selectedUsers.length + 1 > FREE_TIER_LIMITS.maxGroupMembers!) {
          setError(`Free tier is limited to ${FREE_TIER_LIMITS.maxGroupMembers} members per group chat. Please upgrade to add more members.`);
          setIsLoading(false);
          return;
        }
      }

      if (chatType === "private" && selectedUsers.length === 1) {
        // Check if a private chat with the selected user already exists
        const privateChatQuery = query(
          collection(db, "chats"),
          where("type", "==", "private"),
          where("participants", "array-contains", userId)
        );
        const querySnapshot = await getDocs(privateChatQuery);
        const existingChat = querySnapshot.docs.find(doc => 
          doc.data().participants.includes(selectedUsers[0].id)
        );

        if (existingChat) {
          setError("A chat with this user already exists.");
          setIsLoading(false);
          return;
        }
      }

      const chatData = {
        type: chatType,
        participants: [userId],
        createdAt: serverTimestamp(),
        createdBy: userId,
        ...(chatType === "group" && { name: groupName || "New Group Chat" }),
        ...(chatType === "ai" && { aiModel: "gpt-3.5-turbo" }),
      };

      const docRef = await addDoc(collection(db, "chats"), chatData);
      const chatId = docRef.id;
  
      if (chatType === "ai") {
        setSuccessMessage("AI chat created successfully!");
        toast.success("AI chat created successfully!");

        closeFunc();
        // TODO: Redirect to the new AI chat here
        // router.push(`/chat/${chatId}`)
      } else if (chatType === "private") {
        if (selectedUsers.length === 1 && !createWithoutUsers) {
          await updateDoc(doc(db, "chats", chatId), {
            participants: arrayUnion(selectedUsers[0].id),
          });
          setSuccessMessage("Private chat created successfully!");
          toast.success("Private chat created successfully!");
          closeFunc();
        } else if (createWithoutUsers) {
          const invitationLink = `${window.location.origin}/invite?token=${chatId}`;
          setChatLink(invitationLink);
          setSuccessMessage(
            "Private chat created. Share the invitation link to add a user."
          );
          toast.success("Private chat created. Share the invitation link to add a user.");
        }
      } else if (chatType === "group") {
        if (!createWithoutUsers) {
          const batch = writeBatch(db);
          selectedUsers.forEach((user) => {
            const chatRef = doc(db, "chats", chatId);
            batch.update(chatRef, {
              participants: arrayUnion(user.id),
            });
          });
          await batch.commit();
          setSuccessMessage("Group chat created and users added successfully!");
          toast.success("Group chat created and users added successfully!");
          closeFunc();
        } else {
          const invitationLink = `${window.location.origin}/invite?token=${chatId}`;
          setChatLink(invitationLink);
          setSuccessMessage(
            "Group chat created. Share the invitation link to add users."
          );
          toast.success("Group chat created. Share the invitation link to add users.");

        }
  
        if (isFreeTier) {
          await checkAndIncrementUsage(userId, "groupChats");
        }
      }
  
      setSelectedUsers([]);
      setGroupName("");
      setCreateWithoutUsers(false);
    } catch (error) {
      console.error("Error creating chat:", error);
      setError("Failed to create chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(chatLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleInvite = async (email: string) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const chatData = {
        type: "private",
        participants: [userId],
        createdAt: serverTimestamp(),
        createdBy: userId,
      };

      const docRef = await addDoc(collection(db, "chats"), chatData);
      const chatId = docRef.id;

      const invitationLink = `${window.location.origin}/invite?token=${chatId}`;

      await addDoc(collection(db, "invitations"), {
        chatId: chatId,
        email: email,
        sentAt: serverTimestamp(),
      });

      setChatLink(invitationLink);
      setSuccessMessage("Invitation sent successfully!");
    } catch (error) {
      console.error("Error sending invitation:", error);
      setError("Failed to send invitation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) return;

    const usersRef = collection(db, "users");
    let q;
    if (searchType === "username") {
      q = query(usersRef, where("username", "==", searchTerm));
    } else {
      q = query(usersRef, where("email", "==", searchTerm));
    }
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const user = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data(),
      } as User;
      if (user.id !== userId) {
        setSelectedUsers((prevUsers) => {
          if (!prevUsers.some((u) => u.id === user.id)) {
            return [...prevUsers, user];
          }
          return prevUsers;
        });
      }
    } else {
      setShowInvite(true);
      setInviteEmail(searchType === "email" ? searchTerm : "");
    }
    setSearchTerm("");
  };

  return {
    groupName,
    setGroupName,
    selectedUsers,
    setSelectedUsers,
    createWithoutUsers,
    setCreateWithoutUsers,
    chatLink,
    isLoading,
    error,
    successMessage,
    linkCopied,
    handleCreateChat,
    handleCopyLink,
    handleInvite,
    handleSearch,
    searchTerm,
    setSearchTerm,
    searchType,
    setSearchType,
    showInvite,
    setShowInvite,
    inviteEmail,
    setInviteEmail,
    isGroupNameTaken,
  };
};