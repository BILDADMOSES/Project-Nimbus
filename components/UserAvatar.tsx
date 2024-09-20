import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { UserCircle, Camera } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

interface UserAvatarProps {
  onImageChange: (file: File) => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ onImageChange }) => {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    fullName: "",
    preferredLang: "",
    avatar: "",
  });

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
        {userData ? (
          <Image
            src={userData.avatar}
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