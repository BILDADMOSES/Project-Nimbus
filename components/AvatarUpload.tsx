import React from 'react';
import { Camera } from 'lucide-react';

interface AvatarUploadProps {
  avatarPreview: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ avatarPreview, handleFileChange }) => (
  <div className="flex justify-center mb-6">
    <div className="relative">
      <div className="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center overflow-hidden">
        {avatarPreview ? (
          <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
        ) : (
          <Camera size={32} className="text-base-content/50" />
        )}
      </div>
      <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-primary-content rounded-full p-2 cursor-pointer">
        <Camera size={16} />
      </label>
      <input
        id="avatar-upload"
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
    </div>
  </div>
);