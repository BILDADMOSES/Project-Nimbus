import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LimitWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: string;
  currentUsage: number;
  limit: number;
}

const LimitWarningModal: React.FC<LimitWarningModalProps> = ({
  isOpen,
  onClose,
  limitType,
  currentUsage,
  limit,
}) => {
  const percentage = (currentUsage / limit) * 100;
  const isExceeded = currentUsage >= limit;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full m-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {isExceeded ? 'Limit Reached' : 'Approaching Limit'}
              </h2>
              <button
                onClick={onClose}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mb-4">
              <p>
                You have {isExceeded ? 'reached' : 'almost reached'} your{' '}
                {limitType} limit.
              </p>
              <p className="mt-2">
                Current usage: {currentUsage} / {limit} ({percentage.toFixed(1)}
                %)
              </p>
            </div>
            <div className="w-full bg-base-200 rounded-full h-2.5 mb-4">
              <div
                className={`h-2.5 rounded-full ${
                  isExceeded ? 'bg-error' : 'bg-warning'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-base-content/70">
              {isExceeded
                ? 'Please upgrade your plan to continue using this feature.'
                : 'Consider upgrading your plan to avoid interruptions.'}
            </p>
            <div className="mt-6 flex justify-end">
              <button onClick={onClose} className="btn btn-primary">
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LimitWarningModal;