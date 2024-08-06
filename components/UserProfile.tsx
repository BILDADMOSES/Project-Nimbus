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
import { X, Camera, Edit, Key, Save } from "lucide-react";
import Image from "next/image";
import { languages } from "@/constants";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import ActionButton from "@/components/ActionButton";
import { InputField } from "@/components/InputField";
import ErrorAlert from "@/components/ErrorAlert";
import TranslucentCard from "@/components/TranslucentCard";
import { PasswordField } from "@/components/PasswordField";
import { PreferredLanguageSelect } from "@/components/PreferredLanguageSelect";

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
        <div className="p-6">
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

const UserAvatar: React.FC<{
  avatar: string;
  username: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ avatar, username, onAvatarChange }) => (
  <div className="flex flex-col items-center mb-4">
    <div className="relative mb-4">
      {avatar ? (
        <Image
          src={avatar}
          alt="User avatar"
          width={100}
          height={100}
          className="rounded-full border-4 border-base-300"
        />
      ) : (
        <div className="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center border-4 border-base-200">
          <span className="text-3xl text-base-content">
            {username.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <label
        htmlFor="avatar-upload"
        className="btn btn-circle btn-sm btn-primary absolute bottom-0 right-0"
      >
        <Camera size={16} />
      </label>
      <input
        type="file"
        id="avatar-upload"
        onChange={onAvatarChange}
        className="hidden"
      />
    </div>
    <h2 className="text-2xl font-bold text-base-content">{username}</h2>
  </div>
);

const EditProfileForm: React.FC<{
  userData: any;
  onFieldChange: any;
  onSubmit: any;
  onCancel: any;
}> = ({ userData, onFieldChange, onSubmit, onCancel }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {Object.entries(userData).map(([key, value]) => {
      if (key === "avatar") return null;
      if (key === "preferredLang") {
        return (
          <PreferredLanguageSelect
            key={key}
            value={value as string}
            onChange={onFieldChange}
            error={""}
          />
        );
      }
      return (
        <InputField
          placeholder={`Enter ${key}`}
          key={key}
          label={key.charAt(0).toUpperCase() + key.slice(1)}
          name={key}
          value={value as string}
          onChange={onFieldChange}
          type="text"
        />
      );
    })}
    <div className="flex justify-end space-x-2">
      <ActionButton label="Cancel" onClick={onCancel} className="btn-ghost" />
      <ActionButton
        label={
          <>
            <Save size={16} className="mr-2" /> Save Changes
          </>
        }
        type="submit"
        className="btn-primary"
      />
    </div>
  </form>
);

const ChangePasswordForm: React.FC<{
  passwordData: any;
  onFieldChange: any;
  onSubmit: any;
  onCancel: any;
}> = ({ passwordData, onFieldChange, onSubmit, onCancel }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {["currentPassword", "newPassword", "confirmNewPassword"].map((field) => (
      <PasswordField
        key={field}
        label={
          field.charAt(0).toUpperCase() +
          field.slice(1).replace(/([A-Z])/g, " $1")
        }
        name={field}
        value={passwordData[field]}
        onChange={onFieldChange}
      />
    ))}
    <div className="flex justify-end space-x-2">
      <ActionButton label="Cancel" onClick={onCancel} className="btn-ghost" />
      <ActionButton
        label={
          <>
            <Key size={16} className="mr-2" /> Change Password
          </>
        }
        type="submit"
        className="btn-primary"
      />
    </div>
  </form>
);

const UserInfo: React.FC<{
  userData: any;
  onEditProfile: any;
  onChangePassword: any;
}> = ({ userData, onEditProfile, onChangePassword }) => (
  <>
    {Object.entries(userData).map(([key, value]) => {
      if (key === "avatar" || !value) return null;
      return (
        <div key={key} className="mb-2">
          <span className="text-sm text-base-content/70">
            {key.charAt(0).toUpperCase() + key.slice(1)}:
          </span>
          <span className="ml-2 text-base-content">
            {key === "preferredLang"
              ? languages.find((lang) => lang.code === value)?.name || value
              : value}
          </span>
        </div>
      );
    })}
    <div className="flex justify-between mt-6">
      <ActionButton
        label={
          <>
            <Edit size={16} className="mr-2" /> Edit Profile
          </>
        }
        onClick={onEditProfile}
        className="btn-outline btn-primary btn-sm"
      />
      <ActionButton
        label={
          <>
            <Key size={16} className="mr-2" /> Change Password
          </>
        }
        onClick={onChangePassword}
        className="btn-outline btn-sm"
      />
    </div>
  </>
);
