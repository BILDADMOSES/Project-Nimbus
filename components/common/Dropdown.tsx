const Dropdown = ({ isOpen, onClose, title, children }) => {
    return (
      <>
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg bg-base-100 ring-1 ring-base-content ring-opacity-5 z-50">
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
              <div className="px-4 py-2 text-sm font-medium text-base-content border-b border-base-300">{title}</div>
              {children}
            </div>
          </div>
        )}
      </>
    )
  }

  
  const DropdownItem = ({ onClick, children }) => {
    return (
      <button
        onClick={onClick}
        className="block w-full text-left px-4 py-2 text-sm text-base-content hover:bg-base-200 transition-colors duration-150"
        role="menuitem"
      >
        {children}
      </button>
    )
  }

export { Dropdown, DropdownItem }