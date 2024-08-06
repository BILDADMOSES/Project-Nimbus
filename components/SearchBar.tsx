import { Search } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function SearchBar({
  searchTerm,
  setSearchTerm,
}: SearchBarProps) {
  return (
    <div className="relative p-4">
      <input
        type="text"
        placeholder="Search chats..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="input input-bordered w-full pl-10 pr-4"
      />
      <Search
        className="absolute left-7 top-1/2 transform -translate-y-1/2 text-base-content/50"
        size={20}
      />
    </div>
  );
}
