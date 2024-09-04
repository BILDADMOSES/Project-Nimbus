import React from "react";

interface CreateWithoutUsersCheckboxProps {
  createWithoutUsers: boolean;
  setCreateWithoutUsers: (value: boolean) => void;
}

const CreateWithoutUsersCheckbox: React.FC<CreateWithoutUsersCheckboxProps> = ({
  createWithoutUsers,
  setCreateWithoutUsers,
}) => {
  return (
    <div className="form-control mb-6">
      <label className="label cursor-pointer flex-col sm:flex-row items-start sm:items-center gap-2">
        <input
          type="checkbox"
          checked={createWithoutUsers}
          onChange={(e) => setCreateWithoutUsers(e.target.checked)}
          className="checkbox checkbox-primary"
        />
        <span className="label-text text-xs sm:text-sm">
          Create chat without adding users (generate invitation link)
        </span>
      </label>
    </div>
  );
};

export default CreateWithoutUsersCheckbox;