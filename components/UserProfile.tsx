import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebaseClient";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import upload from "@/lib/upload";
import { X } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import ActionButton from "@/components/ActionButton";
import ErrorAlert from "@/components/ErrorAlert";
import TranslucentCard from "@/components/TranslucentCard";
import UserAvatar from "./userProfile/UserAvatar";
import EditProfileForm from "./userProfile/EditProfileForm";
import ChangePasswordForm from "./userProfile/ChangePasswordForm";
import UserInfo from "./userProfile/UserInfo";

interface UserProfilePopupProps {
  onClose: () => void;
  position: { top: number; left: number };
}

export default function UserProfilePopup({
  onClose,
  position,
}: UserProfilePopupProps) {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    fullName: "",
    preferredLang: "",
    avatar: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        const userRef = doc(db, "users", session.user.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData({
            username: data.username || "",
            email: data.email || "",
            fullName: data.fullName || "",
            preferredLang: data.preferredLang || "",
            avatar: data.avatar || "",
          });
        }
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [session]);

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordFieldChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    if (!session?.user?.id) return;

    try {
      const userRef = doc(db, "users", session.user.id);
      await updateDoc(userRef, userData);

      await update({
        ...session,
        user: {
          ...session.user,
          name: userData.username,
          image: userData.avatar,
        },
      });

      setIsEditing(false);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError("New passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("User not found");

      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.newPassword);

      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      setError(
        "Failed to change password. Please check your current password and try again."
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setError("");
      try {
        const avatarUrl = await upload(file);
        setUserData((prev) => ({ ...prev, avatar: avatarUrl }));

        if (session?.user?.id) {
          const userRef = doc(db, "users", session.user.id);
          await updateDoc(userRef, { avatar: avatarUrl });

          await update({
            ...session,
            user: {
              ...session.user,
              image: avatarUrl,
            },
          });
        }
      } catch (err) {
        setError("Failed to upload image. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <TranslucentCard
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-40 w-96 overflow-hidden"
    >
      <ActionButton
        label={<X size={20} />}
        onClick={onClose}
        className="btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
      />
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="p-6 md: py-12 md:h-[600px] md:overflow-auto scrollbar-hide">
          <UserAvatar
            avatar={userData.avatar}
            username={userData.username}
            onAvatarChange={handleAvatar}
          />

          {error && <ErrorAlert message={error} />}

          {isEditing ? (
            <EditProfileForm
              userData={userData}
              onFieldChange={handleFieldChange}
              onSubmit={handleSubmit}
              onCancel={() => setIsEditing(false)}
            />
          ) : isChangingPassword ? (
            <ChangePasswordForm
              passwordData={passwordData}
              onFieldChange={handlePasswordFieldChange}
              onSubmit={handlePasswordChange}
              onCancel={() => setIsChangingPassword(false)}
            />
          ) : (
            <UserInfo
              userData={userData}
              onEditProfile={() => setIsEditing(true)}
              onChangePassword={() => setIsChangingPassword(true)}
            />
          )}
        </div>
      )}
    </TranslucentCard>
  );
}