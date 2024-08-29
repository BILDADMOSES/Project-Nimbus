import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { User } from "@/types";

export const useUserSearch = (
  setSelectedUsers: React.Dispatch<React.SetStateAction<User[]>>
) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"username" | "email">("username");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

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
      setSelectedUsers((prevUsers) => {
        if (!prevUsers.some((u) => u.id === user.id)) {
          return [...prevUsers, user];
        }
        return prevUsers;
      });
      setShowInvite(false);
    } else {
      setShowInvite(true);
      setInviteEmail(searchType === "email" ? searchTerm : "");
    }
    setSearchTerm("");
  };

  return {
    searchTerm,
    setSearchTerm,
    searchType,
    setSearchType,
    showInvite,
    setShowInvite,
    inviteEmail,
    setInviteEmail,
    handleSearch,
  };
};