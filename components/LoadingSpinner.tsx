import React from "react";

interface LoadingSpinnerProps {
  message?: string;
  isVisible?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  isVisible = true,
  className = "",
}) => {
  if (!isVisible) return null;

  return (
    <div className={`text-center ${className}`}>
      <div className="loading loading-spinner loading-lg text-primary"></div>
      {message && (
        <p className="mt-4 text-sm md:text-base text-base-content/70">
          {message}
        </p>
      )}
    </div>
  );
};

const BlurredLoadingSpinner = () => {
  return (
    <div className="fixed inset-0 bg-base-200 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="loading loading-spinner loading-lg text-primary"></div>
    </div>
  );
};

export { LoadingSpinner, BlurredLoadingSpinner };
