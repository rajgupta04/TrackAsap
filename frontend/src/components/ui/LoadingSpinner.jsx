const LoadingSpinner = ({ size = 'md', color = 'neon-green' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`
          ${sizeClasses[size]} 
          border-4 border-dark-700 
          border-t-${color} 
          rounded-full animate-spin
        `}
        style={{ borderTopColor: color === 'neon-green' ? '#39FF14' : color }}
      />
    </div>
  );
};

export default LoadingSpinner;
