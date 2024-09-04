import React from 'react';
import { UsageLimits, FREE_TIER_LIMITS } from '@/lib/usageTracking';

interface UsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  usageData: UsageLimits | null;
}

const UsageModal: React.FC<UsageModalProps> = ({ isOpen, onClose, usageData }) => {
  if (!isOpen || !usageData) return null;

  const renderUsageBar = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    return (
      <div className="w-full bg-base-200 rounded-full h-2.5 mb-1">
        <div 
          className="bg-primary h-2.5 rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="z-50 p-6 bg-base-100 rounded-lg shadow-xl">
      <h3 className="text-2xl font-bold mb-6 text-center text-base-content">Usage Status</h3>
      <ul className="space-y-4">
        <li>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-base-content">Messages</span>
            <span className="text-sm font-medium text-base-content">{usageData.messages} / {FREE_TIER_LIMITS.messages}</span>
          </div>
          {renderUsageBar(usageData.messages, FREE_TIER_LIMITS.messages)}
        </li>
        <li>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-base-content">Translations</span>
            <span className="text-sm font-medium text-base-content">{usageData.translations} / {FREE_TIER_LIMITS.translations}</span>
          </div>
          {renderUsageBar(usageData.translations, FREE_TIER_LIMITS.translations)}
        </li>
        <li>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-base-content">AI Interactions</span>
            <span className="text-sm font-medium text-base-content">{usageData.aiInteractions} / {FREE_TIER_LIMITS.aiInteractions}</span>
          </div>
          {renderUsageBar(usageData.aiInteractions, FREE_TIER_LIMITS.aiInteractions)}
        </li>
        <li>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-base-content">File Storage</span>
            <span className="text-sm font-medium text-base-content">
              {(usageData.fileStorage / (1024 * 1024)).toFixed(2)}MB / {FREE_TIER_LIMITS.fileStorage / (1024 * 1024)}MB
            </span>
          </div>
          {renderUsageBar(usageData.fileStorage, FREE_TIER_LIMITS.fileStorage)}
        </li>
        <li>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-base-content">Group Chats</span>
            <span className="text-sm font-medium text-base-content">{usageData.groupChats} / {FREE_TIER_LIMITS.groupChats}</span>
          </div>
          {renderUsageBar(usageData.groupChats, FREE_TIER_LIMITS.groupChats)}
        </li>
      </ul>
    </div>
  );
};

export default UsageModal;