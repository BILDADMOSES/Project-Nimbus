interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-56 rounded-lg shadow-lg bg-base-100 ring-1 ring-base-content ring-opacity-5 z-50">
      <div
        className="py-1"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="options-menu"
      >
        <div className="px-4 py-2 text-sm font-medium text-base-content border-b border-base-300">
          {title}
        </div>
        {children}
      </div>
    </div>
  );
};

interface DropdownItemProps {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ onClick, icon, children }) => {
  return (
    <button
      className="flex items-center w-full px-4 py-2 text-sm text-base-content hover:bg-base-200 focus:outline-none focus:bg-base-200"
      onClick={onClick}
    >
      {icon && <span className="mr-2">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};