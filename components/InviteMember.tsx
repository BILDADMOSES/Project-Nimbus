import { useState } from "react";
import QRCode from "qrcode.react";
import { Copy, Check, Send } from "lucide-react";

import { InviteMemberProps } from "@/types/invite";

export const InviteMember: React.FC<InviteMemberProps> = ({
  emails,
  onAdd,
  onRemove,
  inviteLink,
  isOneOnOne,
  onSendInvitations,
}) => {
  const [email, setEmail] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const handleAddEmail = () => {
    if (email && !emails.includes(email)) {
      onAdd(email);
      setEmail("");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="mb-6">
      <h2 className="text-sm md:text-base text-gray-500 mb-6 md:mb-8 text-center">
        Invite {isOneOnOne ? "a Member" : "Members"}
      </h2>

      <div className="mb-8">
        <h3 className="text-sm md:text-base text-gray-500 font-medium mb-2">
          Add by Email
        </h3>
        <div className="flex mb-4">
          <input
            type="email"
            id="email"
            className="flex-grow input input-bordered"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
          />
          <button
            onClick={handleAddEmail}
            className="btn btn-primary ml-2"
            disabled={isOneOnOne && emails.length > 0}
          >
            Add
          </button>
        </div>
        {emails.length > 0 && (
          <div>
            <h4 className="text-md font-medium mb-2">Invited Members</h4>
            <ul className="list-disc list-inside mb-4">
              {emails.map((invitedEmail) => (
                <li
                  key={invitedEmail}
                  className="flex items-center justify-between"
                >
                  {invitedEmail}
                  <button
                    onClick={() => onRemove(invitedEmail)}
                    className="btn btn-ghost btn-xs"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={onSendInvitations}
              className="btn btn-primary w-full"
            >
              <Send size={20} className="mr-2" />
              Send Invitations
            </button>
          </div>
        )}
      </div>

      <div className="divider">OR</div>

      <div className="mb-8">
        <h3 className="text-sm md:text-base text-gray-500">
          Share Invite Link
        </h3>
        <div className="flex items-center mb-4">
          <input
            type="text"
            readOnly
            value={inviteLink}
            className="flex-grow input input-bordered"
          />
          <button
            onClick={copyToClipboard}
            className={`btn ml-2 ${isCopied ? "btn-success" : "btn-primary"}`}
            aria-label={isCopied ? "Copied" : "Copy to clipboard"}
          >
            {isCopied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
      </div>

      <div className="divider">OR</div>

      <div className="flex flex-col items-center">
        <h3 className="text-lg font-medium mb-4">Scan QR Code to Join</h3>
        <div className="p-4 bg-white rounded-lg shadow-md">
          <QRCode
            value={inviteLink}
            size={200}
            level="H"
            includeMargin={true}
            bgColor="transparent"
            fgColor="#000000"
          />
        </div>
        <p className="mt-4 text-center text-sm text-base-content">
          Scan this QR code with a mobile device to join the chat instantly.
        </p>
      </div>
    </div>
  );
};
