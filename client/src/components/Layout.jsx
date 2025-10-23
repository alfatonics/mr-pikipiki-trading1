import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, FiPackage, FiUsers, FiUserCheck, FiFileText, 
  FiTruck, FiTool, FiBarChart2, FiSettings, FiLogOut, FiMenu, FiX, FiCheckCircle, FiClock, FiBell 
} from 'react-icons/fi';
import { useState } from 'react';
import ModernSidebar from './ModernSidebar';
import TopBar from './TopBar';

const Layout = () => {
  const { user, logout, isLoading, isInitialized } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    { path: '/notifications', icon: FiBell, label: 'Notifications', roles: ['all'] },
    { path: '/users', icon: FiSettings, label: 'Users', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes('all') || item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Show loading state while authentication is being initialized
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // If no user after initialization, redirect to login
  if (!user) {
    console.log('No user found, redirecting to login');
    navigate('/login');
    return null;
  }

  // Additional security check - ensure user has required properties
  if (!user.username || !user.role) {
    console.log('Invalid user data, redirecting to login');
    navigate('/login');
    return null;
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Modern Sidebar */}
      <ModernSidebar
        user={user}
        menuItems={filteredMenuItems}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-lg overflow-y-auto">
            <ModernSidebar
              user={user}
              menuItems={filteredMenuItems}
              isCollapsed={false}
              onToggleCollapse={() => setSidebarOpen(false)}
              isMobile={true}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
        {/* Modern Top Bar */}
        <TopBar
          user={user}
          onLogout={handleLogout}
          onToggleTheme={handleToggleTheme}
          isDarkMode={isDarkMode}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;