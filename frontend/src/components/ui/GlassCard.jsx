import { motion } from 'framer-motion';

const GlassCard = ({
  children,
  className = '',
  hover = true,
  glow = false,
  padding = 'p-4 md:p-6',
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        glass-card ${padding}
        ${hover ? 'glass-hover' : ''}
        ${glow ? 'neon-border' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
