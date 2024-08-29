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

export default UserInfo;