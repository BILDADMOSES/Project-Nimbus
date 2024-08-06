import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { User, X, Bot, Mail, Check, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  username: string;
  email: string;
}

interface CreateNewChatProps {
  chatType: "private" | "group" | "ai";
  onClose: () => void;
}

export default function CreateNewChat({
  chatType,
  onClose,
}: CreateNewChatProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"username" | "email">(
    "username"
  );
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [chatLink, setChatLink] = useState("");
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createWithoutUsers, setCreateWithoutUsers] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

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
      if (user.id !== session?.user?.id) {
        handleSelectUser(user);
      }
    } else {
      setShowInvite(true);
      setInviteEmail(searchType === "email" ? searchTerm : "");
    }
    setSearchTerm("");
  };

  const handleSelectUser = (user: User) => {
    if (!selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setShowInvite(false);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((user) => user.id !== userId));
  };

  const handleInvite = async () => {
    if (!session?.user?.id) return;
    setIsLoading(true);
    try {
      const chatData = {
        type: "private",
        participants: [session.user.id],
        createdAt: serverTimestamp(),
        createdBy: session.user.id,
      };

      const docRef = await addDoc(collection(db, "chats"), chatData);
      const chatId = docRef.id;

      const invitationLink = `${window.location.origin}/invite?token=${chatId}`;

      await sendInvitation(invitationLink, inviteEmail);

      setChatLink(invitationLink);
      setShowInvite(false);
      onClose();
    } catch (error) {
      console.error("Error sending invitation:", error);
      setError("Failed to send invitation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvitation = async (link: string, email: string) => {
    console.log(`Invitation sent to ${email}: ${link}`);

    await addDoc(collection(db, "invitations"), {
      chatId: link.split("/").pop(),
      email: email,
      sentAt: serverTimestamp(),
    });
  };

  const handleCreateChat = async () => {
    if (!session?.user?.id) return;
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

    setIsLoading(true);
    setError(null);
    try {
      const chatData = {
        type: chatType,
        participants: [session.user.id],
        createdAt: serverTimestamp(),
        createdBy: session.user.id,
        ...(chatType === "group" && { name: groupName || "New Group Chat" }),
        ...(chatType === "ai" && { aiModel: "gpt-3.5-turbo" }),
      };

      const docRef = await addDoc(collection(db, "chats"), chatData);
      const chatId = docRef.id;

      if (chatType === "ai") {
        setSuccessMessage("AI chat created successfully!");
        // TODO: Redirect to the new AI chat here
        // router.push(`/chat/${chatId}`)
      } else if (chatType === "private") {
        if (selectedUsers.length === 1 && !createWithoutUsers) {
          await updateDoc(doc(db, "chats", chatId), {
            participants: arrayUnion(selectedUsers[0].id),
          });
          setSuccessMessage("Private chat created successfully!");
        } else if (createWithoutUsers) {
          const invitationLink = `${window.location.origin}/invite?token=${chatId}`;
          setChatLink(invitationLink);
          setSuccessMessage(
            "Private chat created. Share the invitation link to add a user."
          );
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
        } else {
          const invitationLink = `${window.location.origin}/invite?token=${chatId}`;
          setChatLink(invitationLink);
          setSuccessMessage(
            "Group chat created. Share the invitation link to add users."
          );
        }
      }

      // Reset state after successful creation
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-base-200 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-base-100 rounded-lg p-8 w-full max-w-2xl shadow-xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-base-content">
              {chatType === "private" && "Create Private Chat"}
              {chatType === "group" && "Create Group Chat"}
              {chatType === "ai" && "Create AI Chat"}
            </h2>
            <button onClick={onClose} className="btn btn-ghost btn-circle">
              <X size={24} />
            </button>
          </div>

          {chatType === "group" && (
            <div className="form-control mb-6">
              <label htmlFor="groupName" className="label">
                <span className="label-text">Group Name</span>
              </label>
              <input
                type="text"
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Enter group name"
              />
            </div>
          )}

          {chatType !== "ai" && (
            <>
              <div className="form-control mb-6">
                <label htmlFor="searchUsers" className="label">
                  <span className="label-text">Add User</span>
                </label>
                <div className="flex mb-2">
                  <select
                    value={searchType}
                    onChange={(e) =>
                      setSearchType(e.target.value as "username" | "email")
                    }
                    className="select select-bordered flex-shrink-0 mr-2"
                  >
                    <option value="username">Username</option>
                    <option value="email">Email</option>
                  </select>
                  <input
                    type="text"
                    id="searchUsers"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input input-bordered flex-grow"
                    placeholder={`Enter ${searchType}`}
                  />
                  <button
                    onClick={handleSearch}
                    className="btn btn-primary ml-2"
                  >
                    Add
                  </button>
                </div>
              </div>

              {showInvite && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div className="alert alert-info">
                    <Mail className="flex-shrink-0 mr-2" />
                    <span>User not found. Send an invitation?</span>
                  </div>
                  <div className="flex mt-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="input input-bordered flex-grow"
                      placeholder="Enter email"
                    />
                    <button
                      onClick={handleInvite}
                      className="btn btn-primary ml-2"
                    >
                      Invite
                    </button>
                  </div>
                </motion.div>
              )}

              {selectedUsers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-base-content/70 mb-2">
                    Selected Users
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="badge badge-primary badge-outline gap-2"
                      >
                        <User size={14} />
                        {user.username}
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="btn btn-ghost btn-xs btn-circle"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-control mb-6">
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createWithoutUsers}
                    onChange={(e) => setCreateWithoutUsers(e.target.checked)}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text">
                    Create chat without adding users (generate invitation link)
                  </span>
                </label>
              </div>
            </>
          )}

          {chatType === "ai" && (
            <div className="alert alert-info mb-6">
              <Bot className="flex-shrink-0 mr-2" />
              <span>
                You're creating an AI chat. This will start a private
                conversation with our AI assistant.
              </span>
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-4">
              <X className="flex-shrink-0 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success mb-4">
              <Check className="flex-shrink-0 mr-2" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            onClick={handleCreateChat}
            disabled={isLoading}
            className={`btn btn-primary w-full text-sm md:text-base ${
              isLoading ? "loading" : ""
            }`}
          >
            {isLoading ? "Creating..." : "Create Chat"}
          </button>

          {chatLink && chatType !== "ai" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <h3 className="text-xl font-medium text-base-content mb-3">
                Invitation Link
              </h3>
              <div className="flex items-center bg-base-200 p-4 rounded-lg">
                <input
                  type="text"
                  value={chatLink}
                  readOnly
                  className="bg-transparent flex-1 outline-none text-base-content mr-2"
                />
                <button
                  onClick={handleCopyLink}
                  className={`btn ${
                    linkCopied ? "btn-success" : "btn-primary"
                  }`}
                >
                  {linkCopied ? (
                    <>
                      <Check size={20} className="mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={20} className="mr-2" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-base-content/70 mt-2">
                Share this link to invite others to the chat.
              </p>
            </motion.div>
          )}

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="btn btn-ghost">
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
      {isLoading && (
        <div className="fixed inset-0 bg-base-200 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      )}
    </AnimatePresence>
  );
}
