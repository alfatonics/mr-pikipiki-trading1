import Card from './Card';

const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle, trend, trendValue }) => {
  const colorSchemes = {
    primary: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      accent: 'text-blue-700'
    },
    success: {
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      accent: 'text-emerald-700'
    },
    warning: {
      gradient: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      accent: 'text-amber-700'
    },
    danger: {
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-50',
      icon: 'text-red-600',
      accent: 'text-red-700'
    },
    info: {
      gradient: 'from-cyan-500 to-cyan-600',
      bg: 'bg-cyan-50',
      icon: 'text-cyan-600',
      accent: 'text-cyan-700'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      accent: 'text-purple-700'
    }
  };

  const scheme = colorSchemes[color] || colorSchemes.primary;

  return (
    <Card className={`${scheme.bg} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 rounded-2xl`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 truncate uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 truncate tracking-tight font-mono">{value}</h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 truncate font-medium">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center mt-2">
              <span className={`text-xs sm:text-sm font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                {trend === 'up' ? '↗' : '↘'} {trendValue}
              </span>
              <span className="text-xs text-gray-500 ml-1 font-medium">vs last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`bg-gradient-to-r ${scheme.gradient} p-4 rounded-2xl text-white flex-shrink-0 ml-4 shadow-lg`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;


