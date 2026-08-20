const LoadingSpinner = ({ size = 'md', color }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-2',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`
          ${sizeClasses[size] || sizeClasses.md} 
          border-solid border-white/15
          rounded-full animate-spin
        `}
        style={{ borderTopColor: color || 'var(--color-accent, #6366f1)' }}
      />
    </div>
  );
};

export default LoadingSpinner;
