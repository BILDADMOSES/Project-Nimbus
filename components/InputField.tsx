import React from "react";

interface InputFieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  error,
  className,
}) => (
  <div>
    <label className="label pl-0">
      <span className="label-text text-sm md:text-base text-base-content/80">
        {label}
      </span>
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`input input-bordered w-full bg-base-100 text-sm md:text-base ${
        error ? "input-error" : ""
      } ${className || ""}`}
    />
    {error && <p className="text-error text-xs mt-1">{error}</p>}
  </div>
);
