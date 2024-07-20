import { ChatType } from '@/types';

interface ChatTypeSelectProps {
  selectedType: ChatType | null;
  onSelect: (type: ChatType) => void;
}

const chatTypes: { type: ChatType; label: string; description: string }[] = [
  { type: 'oneOnOne', label: 'One-on-One Chat', description: 'Private conversation with another user' },
  { type: 'group', label: 'Multilingual Group', description: 'Chat with multiple users across languages' },
  { type: 'ai', label: 'AI Language Partner', description: 'Practice with an AI to improve your skills' },
];

export const ChatTypeSelect: React.FC<ChatTypeSelectProps> = ({ selectedType, onSelect }) => {
  return (
    <div className="mb-6">
      <h2 className="text-sm md:text-base text-gray-500 mb-6 md:mb-8 text-center">Choose Your Chat Type</h2>
      <div className="space-y-4">
        {chatTypes.map(({ type, label, description }) => (
          <div
            key={type}
            className={`p-4 border rounded-md cursor-pointer transition-colors ${
              selectedType === type ? 'border-primary bg-primary-content' : 'border-base-300 hover:border-primary'
            }`}
            onClick={() => onSelect(type)}
          >
            <h3 className="font-semibold">{label}</h3>
            <p className="text-sm text-base-content">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
