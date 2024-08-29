import React from 'react';
import { UsageLimits, FREE_TIER_LIMITS } from '@/lib/usageTracking';

interface UsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  usageData: UsageLimits | null;
}

const UsageModal: React.FC<UsageModalProps> = ({ isOpen, onClose, usageData }) => {
  if (!isOpen || !usageData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Usage Status</h3>
        <ul className="space-y-2">
          <li>Messages: {usageData.messages} / {FREE_TIER_LIMITS.messages}</li>
          <li>Translations: {usageData.translations} / {FREE_TIER_LIMITS.translations}</li>
          <li>AI Interactions: {usageData.aiInteractions} / {FREE_TIER_LIMITS.aiInteractions}</li>
          <li>File Storage: {(usageData.fileStorage / (1024 * 1024)).toFixed(2)}MB / {FREE_TIER_LIMITS.fileStorage / (1024 * 1024)}MB</li>
          <li>Group Chats: {usageData.groupChats} / {FREE_TIER_LIMITS.groupChats}</li>
        </ul>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsageModal;