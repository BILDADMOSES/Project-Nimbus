import React from "react";
import { motion } from "framer-motion";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`card w-[70%] bg-base-100 shadow-xl backdrop-blur-md bg-opacity-80 ${
      className || ""
    }`}
  >
    <div className="card-body flex flex-col md:flex-row">{children}</div>
  </motion.div>
);
