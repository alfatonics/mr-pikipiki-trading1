import { FiPackage, FiCheckCircle, FiTool, FiTruck } from 'react-icons/fi';

const InventoryWidget = ({ data }) => {
  const inventoryItems = [
    {
      label: 'In Stock',
      value: data?.inStock || 0,
      icon: FiCheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    },
    {
      label: 'Sold',
      value: data?.sold || 0,
      icon: FiPackage,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    {
      label: 'In Repair',
      value: data?.inRepair || 0,
      icon: FiTool,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    },
    {
      label: 'In Transit',
      value: data?.inTransit || 0,
      icon: FiTruck,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    }
  ];

  const total = inventoryItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Inventory Status</h3>
      <div className="space-y-4">
        {inventoryItems.map((item, index) => {
          const Icon = item.icon;
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          
          return (
            <div key={index} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${item.bg} ${item.border} border group-hover:shadow-md transition-shadow`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">{item.value}</span>
                  <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${item.bg.replace('bg-', 'bg-').replace('-50', '-400')}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Total Motorcycles</span>
          <span className="text-lg font-bold text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
};

export default InventoryWidget;
