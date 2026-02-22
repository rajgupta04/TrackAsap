import { motion } from 'framer-motion';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-neon-green',
  iconBg = 'bg-neon-green/10',
  trend,
  trendUp,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-4 md:p-6 glass-hover"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-dark-400 text-xs md:text-sm font-medium truncate">{title}</p>
          <h3 className="text-xl md:text-3xl font-bold text-white mt-1 md:mt-2 truncate">{value}</h3>
          {subtitle && (
            <p className="text-dark-500 text-xs md:text-sm mt-1 truncate">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs md:text-sm font-medium ${
                  trendUp ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="text-dark-500 text-xs hidden sm:inline">vs last week</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${iconBg} flex-shrink-0`}>
            <Icon className={`w-5 h-5 md:w-6 md:h-6 ${iconColor}`} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
