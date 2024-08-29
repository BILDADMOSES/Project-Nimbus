import React from "react";

interface GroupNameInputProps {
  groupName: string;
  setGroupName: (name: string) => void;
}

const GroupNameInput: React.FC<GroupNameInputProps> = ({ groupName, setGroupName }) => {
  return (
    <div className="form-control mb-6">
      <label htmlFor="groupName" className="label">
        <span className="label-text">Group Name</span>
      </label>
      <input
        type="text"
        id="groupName"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        className="input input-bordered w-full"
        placeholder="Enter group name"
      />
    </div>
  );
};

export default GroupNameInput;