import React from "react";
import Image from "next/image";
import { Camera } from "lucide-react";

interface UserAvatarProps {
  avatar: string;
  username: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ avatar, username, onAvatarChange }) => (
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

export default UserAvatar;