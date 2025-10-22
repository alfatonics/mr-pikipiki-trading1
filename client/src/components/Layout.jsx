import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, FiPackage, FiUsers, FiUserCheck, FiFileText, 
  FiTruck, FiTool, FiBarChart2, FiSettings, FiLogOut, FiMenu, FiX, FiCheckCircle, FiClock 
} from 'react-icons/fi';
import { useState } from 'react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/', icon: FiHome, label: 'Dashboard', roles: ['all'] },
    { path: '/motorcycles', icon: FiPackage, label: 'Motorcycles', roles: ['admin', 'sales', 'registration'] },
    { path: '/suppliers', icon: FiUsers, label: 'Suppliers', roles: ['admin', 'sales'] },
    { path: '/customers', icon: FiUserCheck, label: 'Customers', roles: ['admin', 'sales', 'secretary'] },
    { path: '/contracts', icon: FiFileText, label: 'Contracts', roles: ['admin', 'sales', 'secretary'] },
    { path: '/transport', icon: FiTruck, label: 'Transport', roles: ['admin', 'transport', 'sales'] },
    { path: '/repairs', icon: FiTool, label: 'Repairs', roles: ['admin', 'staff'] },
    { path: '/my-jobs', icon: FiTool, label: 'My Jobs', roles: ['mechanic'] },
    { path: '/my-requests', icon: FiClock, label: 'My Requests', roles: ['sales', 'mechanic', 'transport', 'registration', 'secretary', 'staff'] },
    { path: '/approvals', icon: FiCheckCircle, label: 'Approvals', roles: ['admin', 'sales'] },
    { path: '/reports', icon: FiBarChart2, label: 'Reports', roles: ['admin', 'sales'] },
    { path: '/users', icon: FiSettings, label: 'Users', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes('all') || item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-primary-800 to-primary-900 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-primary-700">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
            {/* Company Logo */}
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain flex-shrink-0"
              onError={(e) => e.target.style.display = 'none'}
            />
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold truncate">MR PIKIPIKI</h1>
              <p className="text-xs text-primary-200 truncate">Trading Management</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-primary-200 flex-shrink-0"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-4 sm:mt-6 px-3 sm:px-4">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-2 sm:space-x-3 px-3 py-2.5 sm:px-4 sm:py-3 mb-1.5 sm:mb-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-primary-900 shadow-lg'
                    : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-3 sm:p-4 border-t border-primary-700">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3 px-1 sm:px-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-base sm:text-lg font-bold">{user?.fullName?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm truncate">{user?.fullName}</p>
              <p className="text-xs text-primary-300 capitalize truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm sm:text-base"
          >
            <FiLogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="text-xs text-gray-600 sm:hidden">
                {new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        />
      )}
    </div>
  );
};

export default Layout;


