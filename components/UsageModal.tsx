import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { UsageLimits, FREE_TIER_LIMITS } from '@/lib/usageTracking';
import UpgradeModal from './UpgradeModal';

interface UsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  usageData: UsageLimits | null;
}

const UsageModal: React.FC<UsageModalProps> = ({ isOpen, onClose, usageData }) => {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  if (!isOpen || !usageData) return null;

  const renderUsageBar = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    let barColor = 'bg-primary';
    if (percentage >= 90) barColor = 'bg-error';
    else if (percentage >= 75) barColor = 'bg-warning';

    return (
      <div className="w-full bg-base-200 rounded-full h-2.5 mb-1">
        <div 
          className={`${barColor} h-2.5 rounded-full transition-all duration-300 ease-in-out`} 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    );
  };

  const renderLimitWarning = (used: number, total: number, type: string) => {
    const percentage = (used / total) * 100;
    if (percentage >= 90) {
      return (
        <div className="flex items-center mt-1 text-error text-sm">
          <AlertTriangle size={16} className="mr-1" />
          <span>Critical: {percentage.toFixed(1)}% of {type} limit used</span>
        </div>
      );
    } else if (percentage >= 75) {
      return (
        <div className="flex items-center mt-1 text-warning text-sm">
          <AlertTriangle size={16} className="mr-1" />
          <span>Warning: {percentage.toFixed(1)}% of {type} limit used</span>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="z-50 p-6 bg-base-100 rounded-lg shadow-xl">
        <h3 className="text-2xl font-bold mb-6 text-center text-base-content">Usage Status</h3>
        <ul className="space-y-4">
          {Object.entries(usageData).map(([key, value]) => (
            <li key={key}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-base-content">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
                <span className="text-sm font-medium text-base-content">
                  {key === 'fileStorage' 
                    ? `${(value / (1024 * 1024)).toFixed(2)}MB / ${FREE_TIER_LIMITS[key as keyof UsageLimits] / (1024 * 1024)}MB`
                    : `${value} / ${FREE_TIER_LIMITS[key as keyof UsageLimits]}`
                  }
                </span>
              </div>
              {renderUsageBar(value, FREE_TIER_LIMITS[key as keyof UsageLimits])}
              {renderLimitWarning(value, FREE_TIER_LIMITS[key as keyof UsageLimits], key)}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <p className="text-sm text-base-content/70 text-center">
            Upgrade your plan to increase your usage limits and unlock additional features.
          </p>
          <button 
            className="btn btn-primary w-full mt-4"
            onClick={() => setIsUpgradeModalOpen(true)}
          >
            Upgrade Plan
          </button>
        </div>
      </div>
      <UpgradeModal 
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
};

export default UsageModal;