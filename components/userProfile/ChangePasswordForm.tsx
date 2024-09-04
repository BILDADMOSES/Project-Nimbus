import React from "react";
import { Key } from "lucide-react";
import { PasswordField } from "@/components/PasswordField";
import ActionButton from "@/components/ActionButton";

interface ChangePasswordFormProps {
  passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  };
  onFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  passwordData,
  onFieldChange,
  onSubmit,
  onCancel,
}) => (
  <form onSubmit={onSubmit} className="space-y-4 w-full max-w-md mx-auto px-4">
    {["currentPassword", "newPassword", "confirmNewPassword"].map((field) => (
      <PasswordField
        key={field}
        label={
          field.charAt(0).toUpperCase() +
          field.slice(1).replace(/([A-Z])/g, " $1")
        }
        name={field}
        value={passwordData[field as keyof typeof passwordData]}
        onChange={onFieldChange}
        className="w-full"
      />
    ))}
    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
      <ActionButton 
        label="Cancel" 
        onClick={onCancel} 
        className="btn-ghost w-full sm:w-auto"
      />
      <ActionButton
        label={
          <>
            <Key size={16} className="mr-2" /> Change Password
          </>
        }
        type="submit"
        className="btn-primary w-full sm:w-auto"
      />
    </div>
  </form>
);

export default ChangePasswordForm;