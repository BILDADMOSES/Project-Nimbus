import React from "react";
import { Edit, Key } from "lucide-react";
import ActionButton from "@/components/ActionButton";
import { languages } from "@/constants";

interface UserInfoProps {
  userData: {
    [key: string]: string;
  };
  onEditProfile: () => void;
  onChangePassword: () => void;
}

const UserInfo: React.FC<UserInfoProps> = ({
  userData,
  onEditProfile,
  onChangePassword,
}) => (
  <div className="w-full max-w-md mx-auto px-4">
    {Object.entries(userData).map(([key, value]) => {
      if (key === "avatar" || !value) return null;
      return (
        <div key={key} className="mb-2 flex flex-wrap justify-between">
          <span className="text-sm sm:text-base text-base-content/70">
            {key.charAt(0).toUpperCase() + key.slice(1)}:
          </span>
          <span className="text-sm sm:text-base text-base-content text-right">
            {key === "preferredLang"
              ? languages.find((lang) => lang.code === value)?.name || value
              : value}
          </span>
        </div>
      );
    })}
    <div className="flex flex-col sm:flex-row justify-between mt-6 space-y-2 sm:space-y-0">
      <ActionButton
        label={
          <>
            <Edit size={16} className="mr-2" /> Edit Profile
          </>
        }
        onClick={onEditProfile}
        className="btn-outline btn-primary btn-sm sm:btn-md w-full sm:w-auto"
      />
      <ActionButton
        label={
          <>
            <Key size={16} className="mr-2" /> Change Password
          </>
        }
        onClick={onChangePassword}
        className="btn-outline btn-sm sm:btn-md w-full sm:w-auto"
      />
    </div>
  </div>
);

export default UserInfo;