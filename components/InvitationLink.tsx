import React from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

interface InvitationLinkProps {
  chatLink: string;
  linkCopied: boolean;
  handleCopyLink: () => void;
}

const InvitationLink: React.FC<InvitationLinkProps> = ({
  chatLink,
  linkCopied,
  handleCopyLink,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <h3 className="text-xl font-medium text-base-content mb-3">
        Invitation Link
      </h3>
      <div className="flex items-center bg-base-200 p-4 rounded-lg">
        <input
          type="text"
          value={chatLink}
          readOnly
          className="bg-transparent flex-1 outline-none text-base-content mr-2"
        />
        <button
          onClick={handleCopyLink}
          className={`btn ${linkCopied ? "btn-success" : "btn-primary"}`}
        >
          {linkCopied ? (
            <>
              <Check size={20} className="mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy size={20} className="mr-2" />
              Copy
            </>
          )}
        </button>
      </div>
      <p className="text-sm text-base-content/70 mt-2">
        Share this link to invite others to the chat.
      </p>
    </motion.div>
  );
};

export default InvitationLink;