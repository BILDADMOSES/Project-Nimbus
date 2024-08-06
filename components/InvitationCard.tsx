// components/AuthCard.tsx
import React from "react";
import { motion } from "framer-motion";

interface InvitationCardProps {
  children: React.ReactNode;
  className?: string;
}

const InvitationCard: React.FC<InvitationCardProps> = ({
  children,
  className,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`card bg-base-100 shadow-xl backdrop-blur-md bg-opacity-80 ${
      className || ""
    }`}
  >
    <div className="card-body">{children}</div>
  </motion.div>
);

export default InvitationCard;
