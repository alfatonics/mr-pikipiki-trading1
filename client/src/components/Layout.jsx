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
        <div className="flex items-center justify-between p-6 border-b border-primary-700">
          <div className="flex items-center space-x-3 flex-1">
            {/* Company Logo */}
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-12 w-12 object-contain"
              onError={(e) => e.target.style.display = 'none'}
            />
            <div>
              <h1 className="text-xl font-bold">MR PIKIPIKI</h1>
              <p className="text-xs text-primary-200">Trading Management</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-primary-200"
          >
            <FiX size={24} />
          </button>
        </div>

        <nav className="mt-6 px-4">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 mb-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-primary-900 shadow-lg'
                    : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-primary-700">
          <div className="flex items-center space-x-3 mb-3 px-2">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold">{user?.fullName?.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{user?.fullName}</p>
              <p className="text-xs text-primary-300 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <FiMenu size={24} />
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">
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


