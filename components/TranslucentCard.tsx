import React from "react";

interface TranslucentCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const TranslucentCard: React.FC<TranslucentCardProps> = ({
  children,
  className = "",
  style = {},
}) => (
  <div
    className={`bg-base-200 bg-opacity-80 backdrop-blur-md rounded-lg shadow-xl ${className}`}
    style={style}
  >
    {children}
  </div>
);

export default TranslucentCard;
