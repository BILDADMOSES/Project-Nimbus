import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { User, Users, X, Bot } from 'lucide-react'

interface User {
  id: string
  username: string
  email: string
}

interface CreateNewChatProps {
  chatType: 'private' | 'group' | 'ai'
  onClose: () => void
}

export default function CreateNewChat({ chatType, onClose }: CreateNewChatProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [groupName, setGroupName] = useState('')
  const { data: session } = useSession()

  const handleSearch = async () => {
    if (!searchTerm) return

    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('username', '>=', searchTerm), where('username', '<=', searchTerm + '\uf8ff'))
    const querySnapshot = await getDocs(q)

    const results = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as User))
      .filter(user => user.id !== session?.user?.id)

    setSearchResults(results)
  }

  const handleSelectUser = (user: User) => {
    if (!selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
    }
    setSearchTerm('')
    setSearchResults([])
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId))
  }

  const handleCreateChat = async () => {
    if (!session?.user?.id) return
    if (chatType === 'private' && selectedUsers.length !== 1) return
    if (chatType === 'group' && selectedUsers.length === 0) return

    try {
      const chatData = {
        type: chatType,
        participants: [session.user.id, ...selectedUsers.map(u => u.id)],
        createdAt: serverTimestamp(),
        createdBy: session.user.id,
        ...(chatType === 'group' && { name: groupName || 'New Group Chat' }),
        ...(chatType === 'ai' && { aiModel: 'gpt-3.5-turbo' }) // You can adjust this as needed
      }

      await addDoc(collection(db, 'chats'), chatData)
      onClose()
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            {chatType === 'private' && 'Create Private Chat'}
            {chatType === 'group' && 'Create Group Chat'}
            {chatType === 'ai' && 'Create AI Chat'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {chatType === 'group' && (
          <div className="mb-4">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#a060ff]"
              placeholder="Enter group name"
            />
          </div>
        )}

        {chatType !== 'ai' && (
          <>
            <div className="mb-4">
              <label htmlFor="searchUsers" className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="searchUsers"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#a060ff]"
                  placeholder="Enter username"
                />
                <button
                  onClick={handleSearch}
                  className="bg-[#a060ff] text-white px-4 py-2 rounded-r-md hover:bg-[#8040df] focus:outline-none focus:ring-2 focus:ring-[#a060ff]"
                >
                  Search
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Search Results</h3>
                <ul className="max-h-32 overflow-y-auto">
                  {searchResults.map(user => (
                    <li
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                    >
                      {user.username}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Users</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(user => (
                    <div
                      key={user.id}
                      className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm flex items-center"
                    >
                      {user.username}
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        className="ml-2 text-gray-600 hover:text-gray-800"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {chatType === 'ai' && (
          <div className="mb-4">
            <p className="text-sm text-gray-700">
              You're creating an AI chat. This will start a conversation with our AI assistant.
            </p>
          </div>
        )}

        <button
          onClick={handleCreateChat}
          className="w-full bg-[#a060ff] text-white rounded-md px-4 py-2 hover:bg-[#8040df] focus:outline-none focus:ring-2 focus:ring-[#a060ff]"
        >
          Create Chat
        </button>
      </div>
    </div>
  )
}