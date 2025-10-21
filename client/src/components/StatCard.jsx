import Card from './Card';

const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle }) => {
  const colors = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm text-gray-600 mb-1 truncate">{title}</p>
          <h3 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`${colors[color]} p-2 md:p-3 lg:p-4 rounded-full text-white flex-shrink-0 ml-2`}>
            <Icon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;


