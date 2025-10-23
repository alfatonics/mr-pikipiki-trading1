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
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Fetch stats first, then charts to avoid conflicts
      console.log('Fetching dashboard stats...');
      const statsRes = await axios.get('/api/dashboard/stats', { 
        signal: controller.signal,
        timeout: 10000 
      });
      
      // Add small delay between requests to prevent conflicts
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Fetching chart data...');
      const chartRes = await axios.get('/api/dashboard/charts/monthly-sales', { 
        signal: controller.signal,
        timeout: 10000 
      });
      
      clearTimeout(timeoutId);
      
      console.log('Dashboard data fetched successfully');
      console.log('Stats data:', statsRes.data);
      console.log('Chart data:', chartRes.data);
      
      // Use the API response directly as it matches the expected structure
      const statsData = statsRes.data;
      console.log('Raw API response:', statsData);
      console.log('Motorcycles data:', statsData.motorcycles);
      console.log('Monthly data:', statsData.monthly);
      console.log('Total customers:', statsData.totalCustomers);
      
      // Ensure the data structure is correct with better debugging
      const formattedStats = {
        motorcycles: {
          total: statsData.motorcycles?.total || 0,
          inStock: statsData.motorcycles?.inStock || 0,
          sold: statsData.motorcycles?.sold || 0,
          inRepair: statsData.motorcycles?.inRepair || 0,
          inTransit: statsData.motorcycles?.inTransit || 0
        },
        monthly: {
          sales: statsData.monthly?.sales || 0,
          revenue: statsData.monthly?.revenue || 0,
          profit: statsData.monthly?.profit || 0,
          repairExpenses: statsData.monthly?.repairExpenses || 0
        },
        repairs: {
          total: statsData.repairs?.total || 0,
          monthly: statsData.repairs?.monthly || 0
        },
        totalCustomers: statsData.totalCustomers || 0,
        pending: {
          transports: statsData.pending?.transports || 0,
          repairs: statsData.pending?.repairs || 0,
          approvals: statsData.pending?.approvals || 0
        },
        topSuppliers: statsData.topSuppliers || [],
        recentSales: statsData.recentSales || []
      };
      
      console.log('Formatted stats:', formattedStats);
      console.log('Motorcycles total:', formattedStats.motorcycles.total);
      console.log('Monthly sales:', formattedStats.monthly.sales);
      console.log('Total customers:', formattedStats.totalCustomers);
      setStats(formattedStats);
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedData = chartRes.data.map(item => ({
        month: monthNames[item.month - 1],
        sales: item.count,
        revenue: item.revenue
      }));
      setChartData(formattedData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Handle specific error types
      let errorMessage = 'Failed to load dashboard data. Please try again.';
      
      if (error.message?.includes('Request already in progress')) {
        errorMessage = 'Dashboard is loading. Please wait a moment and refresh the page.';
        console.log('Request conflict detected, will retry automatically...');
        
        // Auto-retry after a delay
        setTimeout(() => {
          console.log('Auto-retrying dashboard data fetch...');
          fetchDashboardData();
        }, 2000);
        return;
      } else if (error.response?.data?.error) {
        errorMessage = `Failed to load dashboard data: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = `Failed to load dashboard data: ${error.message}`;
      }
      
      // Only use fallback data if we can't fetch from API
      console.log('Using fallback dashboard data due to API error');
      setStats({
        motorcycles: { total: 0, inStock: 0, sold: 0, inRepair: 0, inTransit: 0 },
        monthly: { sales: 0, revenue: 0, profit: 0, repairExpenses: 0 },
        repairs: { total: 0, monthly: 0 },
        totalCustomers: 0,
        pending: { transports: 0, repairs: 0, approvals: 0 },
        topSuppliers: [],
        recentSales: []
      });
      setChartData([]);
      setError(errorMessage);
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchDashboardData();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Role-based dashboard rendering
  const renderDashboard = () => {
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

    const safeStats = stats || defaultStats;

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
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="In Stock"
          value={stats?.motorcycles?.inStock || 0}
          icon={FiPackage}
          color="success"
          subtitle="Ready to sell"
        />
        <StatCard
          title="Monthly Sales"
          value={stats?.monthly?.sales || 0}
          icon={FiTrendingUp}
          color="primary"
          subtitle="This month"
        />
        <StatCard
          title="Monthly Revenue"
          value={`TZS ${(stats?.monthly?.revenue || 0).toLocaleString('en-US')}`}
          icon={FiDollarSign}
          color="success"
          subtitle="Revenue this month"
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
        <StatCard
          title="Pending Approvals"
          value={stats?.pending?.approvals || 0}
          icon={FiClock}
          color="warning"
          subtitle="Need your review"
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
  const salesChartData = chartData.map(item => ({
    name: item.month,
    value: item.sales,
    revenue: item.revenue
  }));

  const inventoryData = {
    inStock: stats?.motorcycles?.inStock || 0,
    sold: stats?.motorcycles?.sold || 0,
    inRepair: stats?.motorcycles?.inRepair || 0,
    inTransit: stats?.motorcycles?.inTransit || 0
  };

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
        />
        <StatCard
          title="Monthly Sales"
          value={stats?.monthly?.sales || 0}
          icon={FiTrendingUp}
          color="success"
          subtitle="This month"
          trend="up"
          trendValue="+8%"
        />
        <StatCard
          title="Monthly Revenue"
          value={`TZS ${(stats?.monthly?.revenue || 0).toLocaleString('en-US')}`}
          icon={FiDollarSign}
          color="success"
          subtitle="Revenue this month"
          trend="up"
          trendValue="+15%"
        />
        <StatCard
          title="Monthly Profit"
          value={`TZS ${(stats?.monthly?.profit || 0).toLocaleString('en-US')}`}
          icon={FiTrendingUp}
          color="success"
          subtitle="Profit this month"
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Repair Expenses"
          value={`TZS ${(stats?.monthly?.repairExpenses || 0).toLocaleString('en-US')}`}
          icon={FiTool}
          color="warning"
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
        />
        <StatCard
          title="Pending Transports"
          value={stats?.pending?.transports || 0}
          icon={FiTruck}
          color="warning"
          subtitle="Awaiting delivery"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <ModernChart
          data={salesChartData}
          type="bar"
          title="Monthly Sales Overview"
          height={350}
          colors={['#2563EB', '#10B981']}
        />
        <InventoryWidget data={inventoryData} />
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
