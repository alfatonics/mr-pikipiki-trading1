import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import QuickActions from "../components/QuickActions";
import { useNavigate } from "react-router-dom";
import {
  FiTool,
  FiClock,
  FiCheckCircle,
  FiDollarSign,
  FiPackage,
  FiTrendingUp,
} from "react-icons/fi";

const MechanicDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentRepairs, setRecentRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const mechanicId = user._id || user.id;

      // Fetch repairs
      const repairsRes = await axios.get(`/api/repairs?mechanic=${mechanicId}`);
      const repairs = repairsRes.data || [];

      // Fetch bills
      const billsRes = await axios.get(
        `/api/repair-bills?mechanicId=${mechanicId}`
      );
      const bills = billsRes.data || [];

      // Calculate stats
      const pendingRepairs = repairs.filter((r) => r.status === "pending");
      const inProgressRepairs = repairs.filter(
        (r) => r.status === "in_progress"
      );
      const completedToday = repairs.filter((r) => {
        if (r.status !== "completed" || !r.completionDate) return false;
        const today = new Date().toISOString().split("T")[0];
        return r.completionDate.split("T")[0] === today;
      });
      const completedThisWeek = repairs.filter((r) => {
        if (r.status !== "completed" || !r.completionDate) return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(r.completionDate) >= weekAgo;
      });

      const billsSent = bills.filter(
        (b) => b.status === "sent_to_cashier" || b.status === "payment_approved"
      );
      const paymentsReceived = bills.filter((b) => b.status === "paid");
      const totalPayments = paymentsReceived.reduce(
        (sum, b) => sum + b.totalAmount,
        0
      );

      // Calculate average repair time
      const completedRepairs = repairs.filter(
        (r) => r.status === "completed" && r.completionDate && r.startDate
      );
      let avgRepairTime = 0;
      if (completedRepairs.length > 0) {
        const totalTime = completedRepairs.reduce((sum, r) => {
          const start = new Date(r.startDate);
          const end = new Date(r.completionDate);
          return sum + (end - start);
        }, 0);
        avgRepairTime = Math.round(
          totalTime / completedRepairs.length / (1000 * 60 * 60)
        ); // hours
      }

      setStats({
        pendingRepairs: pendingRepairs.length,
        inProgressRepairs: inProgressRepairs.length,
        completedToday: completedToday.length,
        completedThisWeek: completedThisWeek.length,
        billsSent: billsSent.length,
        paymentsReceived: paymentsReceived.length,
        totalPayments,
        avgRepairTime,
      });

      // Get recent repairs
      setRecentRepairs(repairs.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTask = (repair) => {
    navigate(`/my-jobs`);
  };

  const handleSendBill = (repair) => {
    navigate(`/my-jobs`);
  };

  const handleUploadProof = (repair) => {
    navigate(`/my-jobs`);
  };

  const handleMarkComplete = (repair) => {
    navigate(`/my-jobs`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 font-sans tracking-tight">
            Mechanic Dashboard
          </h1>
          <p className="text-gray-600">
            Overview of your repair jobs and performance
          </p>
        </div>
      </div>

      <div className="p-4">
        {/* Quick Actions */}
        <QuickActions
          repair={recentRepairs[0]}
          onViewTask={handleViewTask}
          onSendBill={handleSendBill}
          onUploadProof={handleUploadProof}
          onMarkComplete={handleMarkComplete}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Repairs</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats?.pendingRepairs || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Pikipiki ambazo bado hazijafanyiwa kazi
                </p>
              </div>
              <FiTool className="text-yellow-600 text-4xl" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress Repairs</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats?.inProgressRepairs || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Kazi zinazoendelea</p>
              </div>
              <FiClock className="text-blue-600 text-4xl" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Repairs</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats?.completedThisWeek || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Kazi zilizokamilika leo/wiki hii
                </p>
              </div>
              <FiCheckCircle className="text-green-600 text-4xl" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bills Sent to Cashier</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats?.billsSent || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Idadi ya bili zilizotumwa kwa malipo
                </p>
              </div>
              <FiDollarSign className="text-purple-600 text-4xl" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payments Received</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats?.paymentsReceived || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  TZS {stats?.totalPayments?.toLocaleString() || "0"}
                </p>
              </div>
              <FiTrendingUp className="text-green-600 text-4xl" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Repair Time</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats?.avgRepairTime || 0}h
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Muda wa wastani wa kazi moja
                </p>
              </div>
              <FiClock className="text-blue-600 text-4xl" />
            </div>
          </Card>
        </div>

        {/* Recent Repairs */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Repairs
          </h3>
          {recentRepairs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent repairs</p>
          ) : (
            <div className="space-y-2">
              {recentRepairs.map((repair) => (
                <div
                  key={repair.id || repair._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate("/my-jobs")}
                >
                  <div>
                    <p className="font-medium">
                      {repair.motorcycle?.brand} {repair.motorcycle?.model}
                    </p>
                    <p className="text-sm text-gray-600">
                      {repair.description}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      repair.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : repair.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {repair.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MechanicDashboard;


