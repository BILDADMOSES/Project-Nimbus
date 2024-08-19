import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({ label, name, value, onChange, error }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label className="label pl-0">
        <span className="label-text text-sm md:text-base text-base-content/80">{label}</span>
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          className={`input input-bordered w-full bg-base-100 pr-10 text-sm md:text-base ${error ? "input-error" : ""}`}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={20} className="text-base-content/50" /> : <Eye size={20} className="text-base-content/50" />}
        </button>
      </div>
      {/* {error && <p className="text-error text-xs mt-1">{error}</p>} */}
    </div>
  );
};
