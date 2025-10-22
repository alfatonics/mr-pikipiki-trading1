import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiPackage, FiUsers, FiUserCheck, FiFileText, 
  FiTruck, FiTool, FiBarChart2, FiSettings, FiCheckCircle, FiClock,
  FiX, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { useState } from 'react';

const ModernSidebar = ({ user, menuItems, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 relative ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo Section */}
      <div className="px-6 py-4 border-b border-gray-200 relative z-10 h-16 flex items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img 
              src="/logo.png" 
              alt="MR PIKIPIKI Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center" style={{display: 'none'}}>
              <span className="text-white font-bold text-lg">MP</span>
            </div>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">MR PIKIPIKI</h1>
              <p className="text-xs text-gray-500 truncate">Trading Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${
                isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
              }`} />
              {!isCollapsed && (
                <span className="font-medium text-sm truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className={`flex items-center space-x-3 ${
          isCollapsed ? 'justify-center' : ''
        }`}>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {user?.fullName?.charAt(0) || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center space-x-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <FiChevronRight className="w-4 h-4" />
          ) : (
            <>
              <FiChevronLeft className="w-4 h-4" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ModernSidebar;
