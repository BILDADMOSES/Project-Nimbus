import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-base-100 rounded-lg shadow-xl max-w-md w-full overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-base-content">Upgrade to Pro Plan</h3>
              <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-base-content/70">$5/month (Coming Soon)</p>
              <ul className="list-disc list-inside space-y-2 text-base-content/70">
                <li>Unlimited messages</li>
                <li>Unlimited translations</li>
                <li>1GB file storage</li>
                <li>10 group chats</li>
                <li>Up to 20 members per group</li>
              </ul>
              <button 
                className="btn btn-primary w-full cursor-not-allowed mt-4"
                disabled
              >
                Coming Soon
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradeModal;