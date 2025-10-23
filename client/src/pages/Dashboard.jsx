import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import ModernChart from '../components/ModernChart';
import ResponsivePieChart from '../components/ResponsivePieChart';
import InventoryWidget from '../components/InventoryWidget';
import { 
  FiPackage, FiDollarSign, FiTrendingUp, FiUsers, 
  FiTruck, FiTool, FiCheckCircle, FiClock, FiAlertCircle,
  FiActivity, FiTrendingDown, FiArrowUp, FiArrowDown
} from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug logging
  console.log('Dashboard render:', { user, loading, error, stats });

  useEffect(() => {
    // Add a small delay to prevent immediate requests
    const timeoutId = setTimeout(() => {
      fetchDashboardData();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      
      // Don't set fallback data immediately, let it load properly
      
      // Try to fetch real data with shorter timeout
      try {
        console.log('Fetching dashboard stats...');
        console.log('Axios baseURL:', axios.defaults.baseURL);
        console.log('Making request to:', '/api/dashboard/stats');
        
        const statsRes = await axios.get('/api/dashboard/stats', { 
          timeout: 3000 
        });
        
        console.log('API Response received:', statsRes.status);
      
        console.log('Dashboard data fetched successfully');
        console.log('Stats data:', statsRes.data);
        console.log('Stats data type:', typeof statsRes.data);
        console.log('Stats data keys:', Object.keys(statsRes.data || {}));
        console.log('Response status:', statsRes.status);
        console.log('Response headers:', statsRes.headers);
        
        // Update with real data - API already returns the correct structure
        const statsData = statsRes.data;
        console.log('Raw API data structure:', statsData);
        
        // The API already returns the data in the correct format, just use it directly
        const formattedStats = {
          motorcycles: statsData.motorcycles || { total: 0, inStock: 0, sold: 0, inRepair: 0, inTransit: 0 },
          monthly: statsData.monthly || { sales: 0, revenue: 0, profit: 0, repairExpenses: 0 },
          repairs: statsData.repairs || { total: 0, monthly: 0 },
          totalCustomers: statsData.totalCustomers || 0,
          pending: statsData.pending || { transports: 0, repairs: 0, approvals: 0 },
          topSuppliers: statsData.topSuppliers || [],
          recentSales: statsData.recentSales || []
        };
        
        console.log('Setting formatted stats:', formattedStats);
        console.log('Motorcycles total:', formattedStats.motorcycles.total);
        console.log('Monthly sales:', formattedStats.monthly.sales);
        console.log('Monthly revenue:', formattedStats.monthly.revenue);
        console.log('Total customers:', formattedStats.totalCustomers);
        setStats(formattedStats);
        setLoading(false);
        
        // Try to fetch chart data
        try {
          const chartRes = await axios.get('/api/dashboard/charts/monthly-sales', { 
            timeout: 3000 
          });
          
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const formattedData = chartRes.data.map(item => ({
            month: monthNames[item.month - 1],
            sales: item.count,
            revenue: item.revenue
          }));
          setChartData(formattedData);
        } catch (chartError) {
          console.log('Chart data fetch failed, using empty data');
        }
        
      } catch (apiError) {
        console.log('API fetch failed, using fallback data:', apiError.message);
        // Set fallback data only if API fails
        const fallbackStats = {
          motorcycles: { total: 0, inStock: 0, sold: 0, inRepair: 0, inTransit: 0 },
          monthly: { sales: 0, revenue: 0, profit: 0, repairExpenses: 0 },
          repairs: { total: 0, monthly: 0 },
          totalCustomers: 0,
          pending: { transports: 0, repairs: 0, approvals: 0 },
          topSuppliers: [],
          recentSales: []
        };
        setStats(fallbackStats);
        setChartData([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      setLoading(false);
      setError(null); // Don't show error, just use fallback data
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Don't show error state, just use fallback data

  // Role-based dashboard rendering
  const renderDashboard = () => {
    // Show loading state
    if (loading) {
      return (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to MR PIKIPIKI TRADING</h1>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 ml-3">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      );
    }

    // Provide default stats if null
    const defaultStats = {
      motorcycles: { total: 0, inStock: 0, sold: 0, inRepair: 0, inTransit: 0 },
      monthly: { sales: 0, revenue: 0 },
      repairs: { monthly: 0 },
      totalCustomers: 0,
      pending: { transports: 0, approvals: 0, repairs: 0 },
      topSuppliers: [],
      recentSales: []
    };

    // If no stats after loading, show a message
    if (!stats) {
      return (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to MR PIKIPIKI TRADING</h1>
            <p className="text-gray-600">No data available. Please check your connection.</p>
          </div>
        </div>
      );
    }

    // Use stats if available, otherwise use default
    const safeStats = stats && Object.keys(stats).length > 0 ? stats : defaultStats;
    
    console.log('Dashboard render - stats:', stats);
    console.log('Dashboard render - safeStats:', safeStats);
    console.log('Dashboard render - motorcycles total:', safeStats.motorcycles?.total);
    console.log('Dashboard render - monthly sales:', safeStats.monthly?.sales);
    console.log('Dashboard render - total customers:', safeStats.totalCustomers);
    console.log('Dashboard render - user role:', user?.role);
    console.log('Dashboard render - loading:', loading);
    console.log('Dashboard render - error:', error);
    
    // Debug the data structure
    if (stats) {
      console.log('Stats structure:', {
        motorcycles: stats.motorcycles,
        monthly: stats.monthly,
        totalCustomers: stats.totalCustomers,
        pending: stats.pending
      });
    }
    

    switch (user?.role) {
      case 'mechanic':
        return <MechanicDashboard stats={safeStats} />;
      case 'sales':
        return <SalesDashboard stats={safeStats} chartData={chartData} />;
      case 'transport':
        return <TransportDashboard stats={safeStats} />;
      case 'registration':
        return <RegistrationDashboard stats={safeStats} />;
      case 'secretary':
        return <SecretaryDashboard stats={safeStats} />;
      case 'admin':
        return <AdminDashboard stats={safeStats} chartData={chartData} />;
      default:
        return <StaffDashboard stats={safeStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-3 sm:mb-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 font-sans">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Welcome back, <span className="font-semibold text-gray-900">{user?.fullName}</span>!</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs sm:text-sm text-gray-500">Today</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-4">
        {renderDashboard()}
      </div>
    </div>
  );
};

// Mechanic Dashboard
const MechanicDashboard = ({ stats }) => {
  return (
    <>
      {/* Mechanic Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="My Repairs (In Progress)"
          value={stats?.pending?.repairs || 0}
          icon={FiTool}
          color="warning"
          subtitle="Assigned to you"
        />
        <StatCard
          title="Completed This Month"
          value={stats?.monthly?.repairs || 0}
          icon={FiCheckCircle}
          color="success"
          subtitle="Your completed work"
        />
        <StatCard
          title="Motorcycles in Repair"
          value={stats?.motorcycles?.inRepair || 0}
          icon={FiPackage}
          color="danger"
          subtitle="Total in workshop"
        />
        <StatCard
          title="Awaiting Approval"
          value={stats?.pending?.approvals || 0}
          icon={FiClock}
          color="info"
          subtitle="Repair cost approvals"
        />
      </div>

      {/* Mechanic Info Card */}
      <Card className="mb-4 sm:mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-2 sm:space-x-3">
          <FiAlertCircle className="text-blue-600 text-lg sm:text-xl mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-blue-900">Your Workflow</h3>
            <p className="text-xs sm:text-sm text-blue-800 mt-1">
              1. View assigned repairs in <strong>Repairs</strong> page<br />
              2. Start work and update status<br />
              3. Register repair details (parts, labor, costs)<br />
              4. Submit for approval (Sales → Admin)<br />
              5. After approval, mark repair as complete
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Quick Actions</h2>
          <div className="space-y-2 sm:space-y-3">
            <a href="/my-jobs" className="block p-3 sm:p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm sm:text-base text-primary-900">My Repair Jobs</p>
                  <p className="text-xs sm:text-sm text-primary-700">Work on assigned repairs</p>
                </div>
                <FiTool className="text-primary-600 text-xl sm:text-2xl flex-shrink-0" />
              </div>
            </a>
            <a href="/my-requests" className="block p-3 sm:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">My Approval Requests</p>
                  <p className="text-sm text-blue-700">Track repair cost approvals</p>
                </div>
                <FiClock className="text-blue-600 text-2xl" />
              </div>
            </a>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">Motorcycles Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">In Repair (All)</span>
              <span className="font-semibold text-yellow-600">{stats?.motorcycles?.inRepair || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed & Back in Stock</span>
              <span className="font-semibold text-green-600">{stats?.motorcycles?.inStock || 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

// Sales Dashboard
const SalesDashboard = ({ stats, chartData }) => {
  // Create pie chart data for sales performance
  const totalSales = (stats?.motorcycles?.inStock || 0) + (stats?.monthly?.sales || 0) + 
                   (stats?.motorcycles?.inTransit || 0) + (stats?.motorcycles?.reserved || 0);
  
  const salesPieData = [
    { 
      name: 'In Stock', 
      value: stats?.motorcycles?.inStock || 0, 
      color: '#10B981',
      percentage: totalSales > 0 ? ((stats?.motorcycles?.inStock || 0) / totalSales * 100) : 0
    },
    { 
      name: 'Sold This Month', 
      value: stats?.monthly?.sales || 0, 
      color: '#3B82F6',
      percentage: totalSales > 0 ? ((stats?.monthly?.sales || 0) / totalSales * 100) : 0
    },
    { 
      name: 'In Transit', 
      value: stats?.motorcycles?.inTransit || 0, 
      color: '#8B5CF6',
      percentage: totalSales > 0 ? ((stats?.motorcycles?.inTransit || 0) / totalSales * 100) : 0
    },
    { 
      name: 'Reserved', 
      value: stats?.motorcycles?.reserved || 0, 
      color: '#F59E0B',
      percentage: totalSales > 0 ? ((stats?.motorcycles?.reserved || 0) / totalSales * 100) : 0
    }
  ].filter(item => item.value > 0); // Only show items with values > 0

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="In Stock"
          value={stats?.motorcycles?.inStock || 0}
          icon={FiPackage}
          color="success"
          subtitle="Ready to sell"
          format="number"
        />
        <StatCard
          title="Monthly Sales"
          value={stats?.monthly?.sales || 0}
          icon={FiTrendingUp}
          color="primary"
          subtitle="This month"
          format="number"
        />
        <StatCard
          title="Monthly Revenue"
          value={stats?.monthly?.revenue || 0}
          icon={FiDollarSign}
          color="success"
          subtitle="Revenue this month"
          format="currency"
        />
        <StatCard
          title="Monthly Profit"
          value={stats?.monthly?.profit || 0}
          icon={FiTrendingUp}
          color="success"
          subtitle="Profit this month"
          format="currency"
        />
        <StatCard
          title="Repair Expenses"
          value={stats?.monthly?.repairExpenses || 0}
          icon={FiTool}
          color="warning"
          subtitle="Expenses this month"
          format="currency"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pending?.approvals || 0}
          icon={FiClock}
          color="warning"
          subtitle="Need your review"
          format="number"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <ResponsivePieChart 
            data={[
              { name: 'In Stock', value: stats?.motorcycles?.inStock || 0 },
              { name: 'Sold', value: stats?.motorcycles?.sold || 0 },
              { name: 'In Repair', value: stats?.motorcycles?.inRepair || 0 },
              { name: 'In Transit', value: stats?.motorcycles?.inTransit || 0 }
            ]}
            title="Motorcycle Status Distribution"
            colors={['#10B981', '#3B82F6', '#F59E0B', '#EF4444']}
          />
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">Recent Sales</h2>
          <div className="space-y-3">
            {stats?.recentSales && stats.recentSales.length > 0 ? (
              stats.recentSales.map((sale) => (
                <div key={sale._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{sale.brand} {sale.model}</p>
                    <p className="text-sm text-gray-600">{sale.customer?.fullName || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">TZS {sale.sellingPrice?.toLocaleString('en-US')}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent sales data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Sales Performance Pie Chart */}
      <div className="mb-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Performance Overview</h3>
          <ResponsivePieChart data={salesPieData} height={300} />
        </Card>
      </div>
    </>
  );
};

// Transport Dashboard
const TransportDashboard = ({ stats }) => {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Pending Deliveries"
          value={stats?.pending?.transports || 0}
          icon={FiTruck}
          color="warning"
          subtitle="Awaiting delivery"
        />
        <StatCard
          title="In Transit"
          value={stats?.motorcycles?.inTransit || 0}
          icon={FiPackage}
          color="info"
          subtitle="Currently delivering"
        />
        <StatCard
          title="Completed This Month"
          value={stats?.monthly?.transports || 0}
          icon={FiCheckCircle}
          color="success"
          subtitle="Deliveries done"
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={FiUsers}
          color="primary"
          subtitle="Delivery locations"
        />
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/transport" className="block p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-primary-900">View My Deliveries</p>
                <p className="text-sm text-primary-700">Assigned transport jobs</p>
              </div>
              <FiTruck className="text-primary-600 text-2xl" />
            </div>
          </a>
          <a href="/customers" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Customer Locations</p>
                <p className="text-sm text-blue-700">Delivery addresses</p>
              </div>
              <FiUsers className="text-blue-600 text-2xl" />
            </div>
          </a>
        </div>
      </Card>
    </>
  );
};

// Registration Dashboard
const RegistrationDashboard = ({ stats }) => {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <StatCard
          title="Total Motorcycles"
          value={stats?.motorcycles?.total || 0}
          icon={FiPackage}
          color="primary"
          subtitle="In system"
        />
        <StatCard
          title="In Stock"
          value={stats?.motorcycles?.inStock || 0}
          icon={FiCheckCircle}
          color="success"
          subtitle="Ready/Registered"
        />
        <StatCard
          title="Sold"
          value={stats?.motorcycles?.sold || 0}
          icon={FiTrendingUp}
          color="info"
          subtitle="Total sold"
        />
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <a href="/motorcycles" className="block p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-primary-900">Manage Motorcycles</p>
              <p className="text-sm text-primary-700">Registration & documentation</p>
            </div>
            <FiPackage className="text-primary-600 text-2xl" />
          </div>
        </a>
      </Card>
    </>
  );
};

// Secretary Dashboard
const SecretaryDashboard = ({ stats }) => {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={FiUsers}
          color="primary"
          subtitle="In database"
        />
        <StatCard
          title="Contracts"
          value={(stats?.monthly?.sales || 0) + (stats?.monthly?.purchases || 0)}
          icon={FiCheckCircle}
          color="success"
          subtitle="This month"
        />
        <StatCard
          title="Pending Items"
          value={stats?.pending?.contracts || 0}
          icon={FiClock}
          color="warning"
          subtitle="Need attention"
        />
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="space-y-3">
          <a href="/contracts" className="block p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-primary-900">Manage Contracts</p>
                <p className="text-sm text-primary-700">Print & archive contracts</p>
              </div>
              <FiCheckCircle className="text-primary-600 text-2xl" />
            </div>
          </a>
          <a href="/customers" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Customer Database</p>
                <p className="text-sm text-blue-700">View & manage customers</p>
              </div>
              <FiUsers className="text-blue-600 text-2xl" />
            </div>
          </a>
        </div>
      </Card>
    </>
  );
};

// Admin Dashboard (Full Access)
const AdminDashboard = ({ stats, chartData }) => {
  // Create pie chart data for motorcycle inventory
  const totalInventory = (stats?.motorcycles?.inStock || 0) + (stats?.motorcycles?.sold || 0) + 
                       (stats?.motorcycles?.inRepair || 0) + (stats?.motorcycles?.inTransit || 0) + 
                       (stats?.motorcycles?.reserved || 0);
  
  const inventoryPieData = [
    { 
      name: 'In Stock', 
      value: stats?.motorcycles?.inStock || 0, 
      color: '#10B981',
      percentage: totalInventory > 0 ? ((stats?.motorcycles?.inStock || 0) / totalInventory * 100) : 0
    },
    { 
      name: 'Sold', 
      value: stats?.motorcycles?.sold || 0, 
      color: '#3B82F6',
      percentage: totalInventory > 0 ? ((stats?.motorcycles?.sold || 0) / totalInventory * 100) : 0
    },
    { 
      name: 'In Repair', 
      value: stats?.motorcycles?.inRepair || 0, 
      color: '#F59E0B',
      percentage: totalInventory > 0 ? ((stats?.motorcycles?.inRepair || 0) / totalInventory * 100) : 0
    },
    { 
      name: 'In Transit', 
      value: stats?.motorcycles?.inTransit || 0, 
      color: '#8B5CF6',
      percentage: totalInventory > 0 ? ((stats?.motorcycles?.inTransit || 0) / totalInventory * 100) : 0
    },
    { 
      name: 'Reserved', 
      value: stats?.motorcycles?.reserved || 0, 
      color: '#EF4444',
      percentage: totalInventory > 0 ? ((stats?.motorcycles?.reserved || 0) / totalInventory * 100) : 0
    }
  ].filter(item => item.value > 0); // Only show items with values > 0

  // Create pie chart data for monthly revenue breakdown
  const totalRevenue = (stats?.monthly?.revenue || 0) + (stats?.monthly?.repairExpenses || 0) + (stats?.monthly?.profit || 0);
  
  const revenuePieData = [
    { 
      name: 'Sales Revenue', 
      value: stats?.monthly?.revenue || 0, 
      color: '#10B981',
      percentage: totalRevenue > 0 ? ((stats?.monthly?.revenue || 0) / totalRevenue * 100) : 0
    },
    { 
      name: 'Repair Expenses', 
      value: stats?.monthly?.repairExpenses || 0, 
      color: '#EF4444',
      percentage: totalRevenue > 0 ? ((stats?.monthly?.repairExpenses || 0) / totalRevenue * 100) : 0
    },
    { 
      name: 'Net Profit', 
      value: stats?.monthly?.profit || 0, 
      color: '#3B82F6',
      percentage: totalRevenue > 0 ? ((stats?.monthly?.profit || 0) / totalRevenue * 100) : 0
    }
  ].filter(item => item.value > 0); // Only show items with values > 0

  console.log('AdminDashboard - inventoryPieData:', inventoryPieData);
  console.log('AdminDashboard - revenuePieData:', revenuePieData);

  return (
    <>
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <StatCard
          title="Total Motorcycles"
          value={stats?.motorcycles?.total || 0}
          icon={FiPackage}
          color="primary"
          subtitle={`${stats?.motorcycles?.inStock || 0} in stock`}
          trend="up"
          trendValue="+12%"
          format="number"
        />
        <StatCard
          title="Monthly Sales"
          value={stats?.monthly?.sales || 0}
          icon={FiTrendingUp}
          color="success"
          subtitle="This month"
          trend="up"
          trendValue="+8%"
          format="number"
        />
        <StatCard
          title="Monthly Revenue"
          value={stats?.monthly?.revenue || 0}
          icon={FiDollarSign}
          color="success"
          subtitle="Revenue this month"
          trend="up"
          trendValue="+15%"
          format="currency"
        />
        <StatCard
          title="Monthly Profit"
          value={stats?.monthly?.profit || 0}
          icon={FiTrendingUp}
          color="success"
          subtitle="Profit this month"
          trend="up"
          trendValue="+12%"
          format="currency"
        />
        <StatCard
          title="Repair Expenses"
          value={stats?.monthly?.repairExpenses || 0}
          icon={FiTool}
          color="warning"
          format="currency"
          subtitle="Expenses this month"
          trend="down"
          trendValue="-5%"
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={FiUsers}
          color="purple"
          subtitle="Active customers"
          trend="up"
          trendValue="+3%"
          format="number"
        />
        <StatCard
          title="Pending Transports"
          value={stats?.pending?.transports || 0}
          icon={FiTruck}
          color="warning"
          subtitle="Awaiting delivery"
          format="number"
        />
      </div>

      {/* Pie Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Motorcycle Inventory Distribution</h3>
          <ResponsivePieChart data={inventoryPieData} height={300} />
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Breakdown</h3>
          <ResponsivePieChart data={revenuePieData} height={300} />
        </Card>
      </div>

      {/* Recent Activity and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Suppliers</h3>
          <div className="space-y-4">
            {stats?.topSuppliers?.map((supplier, index) => (
              <div key={supplier._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{supplier.name}</p>
                    <p className="text-sm text-gray-600">{supplier.company || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{supplier.totalSupplied} units</p>
                  <p className="text-sm text-yellow-600">{'⭐'.repeat(supplier.rating)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Sales</h3>
          <div className="space-y-4">
            {stats?.recentSales?.map((sale) => (
              <div key={sale._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <FiPackage className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{sale.brand} {sale.model}</p>
                    <p className="text-sm text-gray-600">{sale.customer?.fullName || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-600">TZS {sale.sellingPrice?.toLocaleString('en-US')}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(sale.saleDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </>
  );
};

// Staff Dashboard (Basic)
const StaffDashboard = ({ stats }) => {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Motorcycles"
          value={stats?.motorcycles?.total || 0}
          icon={FiPackage}
          color="primary"
          subtitle="In system"
        />
        <StatCard
          title="Monthly Sales"
          value={stats?.monthly?.sales || 0}
          icon={FiTrendingUp}
          color="success"
          subtitle="This month"
        />
        <StatCard
          title="Monthly Profit"
          value={`TZS ${(stats?.monthly?.profit || 0).toLocaleString('en-US')}`}
          icon={FiTrendingUp}
          color="success"
          subtitle="Profit this month"
        />
        <StatCard
          title="Repair Expenses"
          value={`TZS ${(stats?.monthly?.repairExpenses || 0).toLocaleString('en-US')}`}
          icon={FiTool}
          color="warning"
          subtitle="Expenses this month"
        />
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4">System Overview</h2>
        <p className="text-gray-600">Welcome to MR PIKIPIKI TRADING Management System</p>
      </Card>

    </>
  );
};

export default Dashboard;
