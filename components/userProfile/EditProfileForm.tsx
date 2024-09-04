import React from "react";
import { Save } from "lucide-react";
import { InputField } from "@/components/InputField";
import { PreferredLanguageSelect } from "@/components/PreferredLanguageSelect";
import ActionButton from "@/components/ActionButton";

interface EditProfileFormProps {
  userData: any;
  onFieldChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  userData,
  onFieldChange,
  onSubmit,
  onCancel,
}) => (
  <form onSubmit={onSubmit} className="space-y-4 w-full max-w-md mx-auto px-4">
    {Object.entries(userData).map(([key, value]) => {
      if (key === "avatar") return null;
      if (key === "preferredLang") {
        return (
          <PreferredLanguageSelect
            key={key}
            value={value as string}
            onChange={onFieldChange}
            error={""}
          />
        );
      }
      return (
        <InputField
          placeholder={`Enter ${key}`}
          key={key}
          label={key.charAt(0).toUpperCase() + key.slice(1)}
          name={key}
          value={value as string}
          onChange={onFieldChange}
          type="text"
          className="w-full"
        />
      );
    })}
    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
      <ActionButton 
        label="Cancel" 
        onClick={onCancel} 
        className="btn-ghost w-full sm:w-auto"
      />
      <ActionButton
        label={
          <>
            <Save size={16} className="mr-2" /> Save Changes
          </>
        }
        type="submit"
        className="btn-primary w-full sm:w-auto"
      />
    </div>
  </form>
);

export default EditProfileForm;