import React, { useRef } from 'react';
import Image from 'next/image';
import { UserCircle, Camera } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface UserAvatarProps {
  onImageChange: (file: File) => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ onImageChange }) => {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageChange(file);
    }
  };

  return (
    <div className="relative">
      <div className="w-10 h-10 rounded-full overflow-hidden">
        {session?.user?.image ? (
          <Image
            src={session.user.image}
            alt="User avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-base-300">
            <UserCircle className="h-8 w-8 text-base-content/50" />
          </div>
        )}
      </div>
      <button 
        onClick={handleImageClick} 
        className="absolute bottom-0 right-0 bg-primary text-primary-content rounded-full p-1"
      >
        <Camera size={12} />
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
};

export default UserAvatar;