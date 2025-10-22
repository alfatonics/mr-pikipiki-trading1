import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import ModernChart from '../components/ModernChart';
import InventoryWidget from '../components/InventoryWidget';
import NotificationTester from '../components/NotificationTester';
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

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/dashboard/charts/monthly-sales')
      ]);
      
      setStats(statsRes.data);
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedData = chartRes.data.map(item => ({
        month: monthNames[item.month - 1],
        sales: item.count,
        revenue: item.revenue
      }));
      setChartData(formattedData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-lg text-gray-600">Loading dashboard...</div>
    </div>;
  }

  // Role-based dashboard rendering
  const renderDashboard = () => {
    switch (user?.role) {
      case 'mechanic':
        return <MechanicDashboard stats={stats} />;
      case 'sales':
        return <SalesDashboard stats={stats} chartData={chartData} />;
      case 'transport':
        return <TransportDashboard stats={stats} />;
      case 'registration':
        return <RegistrationDashboard stats={stats} />;
      case 'secretary':
        return <SecretaryDashboard stats={stats} />;
      case 'admin':
        return <AdminDashboard stats={stats} chartData={chartData} />;
      default:
        return <StaffDashboard stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 font-sans">Dashboard</h1>
            <p className="text-gray-600">Welcome back, <span className="font-semibold text-gray-900">{user?.fullName}</span>!</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-lg font-semibold text-gray-900">
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
      <div className="p-4">
        {renderDashboard()}
        
        {/* Notification Testing Section - Always Visible */}
        <div className="mt-8">
          <NotificationTester />
        </div>
      </div>
    </div>
  );
};

// Mechanic Dashboard
const MechanicDashboard = ({ stats }) => {
  return (
    <>
      {/* Mechanic Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
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
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
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
          color="info"
          subtitle="This month"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pending?.approvals || 0}
          icon={FiClock}
          color="warning"
          subtitle="Need your review"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Monthly Sales Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#0ea5e9" name="Sales Count" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">Recent Sales</h2>
          <div className="space-y-3">
            {stats?.recentSales?.map((sale) => (
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
            ))}
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
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
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
          color="info"
          subtitle="This month"
          trend="up"
          trendValue="+15%"
        />
        <StatCard
          title="Repair Expenses"
          value={`TZS ${(stats?.repairs?.monthly || 0).toLocaleString('en-US')}`}
          icon={FiTool}
          color="danger"
          subtitle="This month"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6 mb-8">
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
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4">System Overview</h2>
        <p className="text-gray-600">Welcome to MR PIKIPIKI TRADING Management System</p>
      </Card>

    </>
  );
};

export default Dashboard;
