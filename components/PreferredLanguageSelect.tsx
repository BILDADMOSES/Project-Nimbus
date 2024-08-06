import React from 'react';
import { languages } from '@/constants';

interface PreferredLanguageSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
}

export const PreferredLanguageSelect: React.FC<PreferredLanguageSelectProps> = ({ value, onChange, error }) => {
  return (
    <div>
      <label className="label pl-0">
        <span className="label-text text-sm md:text-base text-base-content/80">
          Preferred Language
        </span>
      </label>
      <select
        name="preferredLang"
        value={value}
        onChange={onChange}
        className={`select select-bordered w-full bg-base-100 text-sm md:text-base ${
          error ? "select-error" : ""
        }`}
      >
        <option value="">Select a language</option>
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-error text-xs mt-1">{error}</p>
      )}
    </div>
  );
};