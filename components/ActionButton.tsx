import React from "react";
import Link from "next/link";

interface ActionButtonProps {
  label: string | React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  href?: string;
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onClick,
  href,
  className,
  type,
}) => {
  const baseClasses = `btn ${className || ""}`;

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {label}
      </Link>
    );
  }

  return (
    <button className={baseClasses} onClick={onClick} type={type}>
      {label}
    </button>
  );
};

export default ActionButton;
