import React, { useState } from 'react';
import { motion } from "framer-motion";
import Link from 'next/link';

const FREE_TIER_LIMITS = {
  messages: 100,
  translations: 50,
  aiInteractions: 20,
  fileStorage: 50 * 1024 * 1024, // 50MB in bytes
  groupChats: 3,
  maxGroupMembers: 5
};

export default function PricingSection() {
  const [showFreeplanModal, setShowFreeplanModal] = useState(false);

  return (
    <section className="py-20 bg-base-200/80">
      <div className="container mx-auto px-4">
        <motion.h2 
          className="text-3xl font-bold text-center mb-12 text-base-content"
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Choose Your Plan
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <motion.div 
            className="bg-base-100 rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold mb-4 text-base-content">Free Plan</h3>
            <p className="text-base-content/70 mb-6">Get started with our basic features</p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-6">
              <li>{FREE_TIER_LIMITS.messages} messages per month</li>
              <li>{FREE_TIER_LIMITS.translations} translations per month</li>
              {/* <li>{FREE_TIER_LIMITS.aiInteractions} AI interactions per month</li> */}
              <li>{FREE_TIER_LIMITS.fileStorage / (1024 * 1024)}MB file storage</li>
              <li>{FREE_TIER_LIMITS.groupChats} group chats</li>
              <li>Up to {FREE_TIER_LIMITS.maxGroupMembers} members per group</li>
            </ul>
            <button 
              onClick={() => setShowFreeplanModal(true)}
              className="btn btn-primary w-full"
            >
              Get Started
            </button>
          </motion.div>

          {/* Paid Plan */}
          <motion.div 
            className="bg-base-100 rounded-lg shadow-lg p-6 opacity-50"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 0.5, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold mb-4 text-base-content">Pro Plan</h3>
            <p className="text-base-content/70 mb-6">$5/month (Coming Soon)</p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-6">
              <li>Unlimited messages</li>
              <li>Unlimited translations</li>
              {/* <li>100 AI interactions per month</li> */}
              <li>1GB file storage</li>
              <li>10 group chats</li>
              <li>Up to 20 members per group</li>
            </ul>
            <button 
              className="btn btn-primary w-full cursor-not-allowed"
              disabled
            >
              Coming Soon
            </button>
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div 
            className="bg-base-100 rounded-lg shadow-lg p-6 opacity-50"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 0.5, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h3 className="text-2xl font-bold mb-4 text-base-content">Enterprise Plan</h3>
            <p className="text-base-content/70 mb-6">Custom pricing (Coming Soon)</p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-6">
              <li>Unlimited everything</li>
              <li>Dedicated support</li>
              <li>Advanced analytics</li>
              <li>Custom integrations</li>
              <li>SLA guarantees</li>
            </ul>
            <button 
              className="btn btn-primary w-full cursor-not-allowed"
              disabled
            >
              Contact Sales (Coming Soon)
            </button>
          </motion.div>
        </div>
      </div>

      {/* Free Plan Modal */}
      {showFreeplanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-base-content">Free Plan Features</h3>
            <ul className="list-disc list-inside space-y-2 text-base-content/70">
              <li>{FREE_TIER_LIMITS.messages} messages per month</li>
              <li>{FREE_TIER_LIMITS.translations} translations per month</li>
              {/* <li>{FREE_TIER_LIMITS.aiInteractions} AI interactions per month</li> */}
              <li>{FREE_TIER_LIMITS.fileStorage / (1024 * 1024)}MB file storage</li>
              <li>{FREE_TIER_LIMITS.groupChats} group chats</li>
              <li>Up to {FREE_TIER_LIMITS.maxGroupMembers} members per group</li>
            </ul>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowFreeplanModal(false)}
                className="btn btn-ghost"
              >
                Close
              </button>
              <Link
              href="/signup"
              >
              <button
                className="btn btn-primary"
              >
                Sign Up
              </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}