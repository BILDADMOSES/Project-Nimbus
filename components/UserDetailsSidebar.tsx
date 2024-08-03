import React from 'react'
import Image from 'next/image'
import { X, FileIcon, ImageIcon } from 'lucide-react'

interface UserData {
  id: string;
  username: string;
  email: string;
  image?: string;
}

interface Message {
  id: string;
  content: string;
  type: 'image' | 'file';
  fileUrl?: string;
}

interface UserDetailsSidebarProps {
  user: UserData;
  chatType: 'private' | 'group';
  sharedFiles: Message[];
  onClose: () => void;
}

const UserDetailsSidebar: React.FC<UserDetailsSidebarProps> = ({ user, chatType, sharedFiles, onClose }) => {
  return (
    <div className="w-80 bg-white border-l h-full overflow-y-auto">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">User Details</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>
      <div className="p-4 flex flex-col items-center">
        <Image
          src={user.image || '/default-avatar.png'}
          alt={user.username}
          width={120}
          height={120}
          className="rounded-full mb-4"
        />
        <h3 className="text-lg font-semibold">{user.username}</h3>
        <p className="text-gray-500">{user.email}</p>
        <p className="text-sm text-gray-400 mt-2">{chatType === 'private' ? 'Private Chat' : 'Group'}</p>
      </div>
      <div className="p-4 border-t">
        <h4 className="text-lg font-semibold mb-2">Shared Files</h4>
        <ul className="space-y-2">
          {sharedFiles.map((file) => (
            <li key={file.id} className="flex items-center">
              {file.type === 'image' ? (
                <ImageIcon size={20} className="mr-2 text-blue-500" />
              ) : (
                <FileIcon size={20} className="mr-2 text-green-500" />
              )}
              <a 
                href={file.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-blue-600 hover:underline"
              >
                {file.content}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default UserDetailsSidebar