const Checkbox = ({
  checked,
  onChange,
  label,
  sublabel,
  disabled = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <label
      className={`
        flex items-center gap-3 cursor-pointer group
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={`
            ${sizeClasses[size]}
            appearance-none rounded-md border-2 border-dark-500 bg-dark-800/50
            checked:bg-neon-green checked:border-neon-green
            focus:outline-none focus:ring-2 focus:ring-neon-green/30
            transition-all duration-200 cursor-pointer
            disabled:cursor-not-allowed
          `}
        />
        {checked && (
          <svg
            className={`
              absolute inset-0 ${sizeClasses[size]} pointer-events-none
              text-dark-950 p-0.5
            `}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
      {(label || sublabel) && (
        <div>
          {label && (
            <span className="text-white font-medium group-hover:text-neon-green transition-colors">
              {label}
            </span>
          )}
          {sublabel && (
            <p className="text-dark-400 text-sm">{sublabel}</p>
          )}
        </div>
      )}
    </label>
  );
};

export default Checkbox;
