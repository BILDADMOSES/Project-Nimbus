import React from 'react'
import Image from 'next/image'
import { X, FileIcon, ImageIcon, FileText, Music, Video, Archive } from 'lucide-react'
import { format } from 'date-fns'

interface UserData {
  id: string;
  username: string;
  email: string;
  image?: string;
  fullName?: string;
  joinDate?: any;
  location?: string;
  language?: string;
}

interface SharedFile {
  id: string;
  content: string;
  type: 'image' | 'file';
  fileUrl?: string;
  timestamp: any;
}

interface UserDetailsSidebarProps {
  user: UserData;
  chatType: 'private' | 'group';
  sharedFiles: SharedFile[];
  onClose: () => void;
}

const UserDetailsSidebar: React.FC<UserDetailsSidebarProps> = ({ user, chatType, sharedFiles, onClose }) => {
  const formatDate = (timestamp: any) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return format(timestamp.toDate(), 'MMM d, yyyy HH:mm')
    } else if (timestamp instanceof Date) {
      return format(timestamp, 'MMM d, yyyy HH:mm')
    } else if (timestamp && !isNaN(new Date(timestamp).getTime())) {
      return format(new Date(timestamp), 'MMM d, yyyy HH:mm')
    }
    return 'Invalid date'
  }
  
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon size={24} className="text-primary" />;
      case 'pdf':
        return <FileText size={24} className="text-red-500" />;
      case 'audio':
        return <Music size={24} className="text-yellow-500" />;
      case 'video':
        return <Video size={24} className="text-purple-500" />;
      case 'archive':
        return <Archive size={24} className="text-orange-500" />;
      default:
        return <FileIcon size={24} className="text-secondary" />;
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-base-200 shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-base-300">
        <h2 className="text-xl font-bold">User Details</h2>
        <button onClick={onClose} className="btn btn-ghost btn-circle">
          <X size={24} />
        </button>
      </div>
      
      <div className="flex flex-col items-center p-4">
        <div className="avatar mb-4">
          <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
            <Image
              src={user.image || '/default-avatar.png'}
              alt={user.username}
              width={96}
              height={96}
            />
          </div>
        </div>
        <h3 className="text-lg font-semibold">{user.fullName || user.username}</h3>
        <p className="text-sm text-base-content/70">{user.email}</p>
        <div className="badge badge-primary mt-2">{chatType === 'private' ? 'Private Chat' : 'Group'}</div>
      </div>
      
      <div className="divider"></div>
      
      <div className="p-4">
        <h4 className="text-lg font-semibold mb-4">Shared Files</h4>
        <div className="space-y-4">
          {sharedFiles.map((file) => (
            <div key={file.id} className="card bg-base-100 shadow-sm rounded-md">
              <div className="card-body p-2">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {file.type === 'image' ? (
                      <div className="w-16 h-16 relative">
                        <Image
                          src={file.fileUrl || '/placeholder-image.jpg'}
                          alt={file.content}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-md"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-base-300 rounded-md flex items-center justify-center">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-sm font-semibold">{file.content}</h3>
                    <p className="text-xs text-base-content/70">
                      {formatDate(file.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="card-actions justify-end mt-2">
                  <a 
                    href={file.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary"
                  >
                    {file.type === 'image' ? 'View' : 'Download'}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default UserDetailsSidebar
