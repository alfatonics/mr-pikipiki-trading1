import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Motorcycles from "./pages/Motorcycles";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Contracts from "./pages/Contracts";
import Transport from "./pages/Transport";
import Repairs from "./pages/Repairs";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Approvals from "./pages/Approvals";
import MyRequests from "./pages/MyRequests";
import MyJobs from "./pages/MyJobs";
import Notifications from "./pages/Notifications";
import Error404 from "./pages/Error404";
import ContractForms from "./pages/ContractForms";
import InspectionForm from "./pages/InspectionForm";
import Cashier from "./pages/Cashier";
import PricingApproval from "./pages/PricingApproval";
import CRM from "./pages/CRM";
import Tasks from "./pages/Tasks";
import MechanicReports from "./pages/MechanicReports";
import Messages from "./pages/Messages";
import Meetings from "./pages/Meetings";
import StaffTasks from "./pages/StaffTasks";
import Attendance from "./pages/Attendance";
import Documents from "./pages/Documents";
import OfficeSupplies from "./pages/OfficeSupplies";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Loans from "./pages/Loans";
import BikeForInspection from "./pages/BikeForInspection";
import Layout from "./components/Layout";

const PrivateRoute = ({ children }) => {
  const { user, isLoading, isInitialized } = useAuth();

  // Show loading while authentication is being checked
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    // Force redirect on mobile to ensure proper navigation
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    if (isMobile) {
      window.location.href = "/login";
      return null;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, isLoading, isInitialized } = useAuth();

  // Show loading while authentication is being checked
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (user) {
    // Force redirect on mobile to ensure proper navigation
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    if (isMobile) {
      window.location.href = "/";
      return null;
    }

    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="motorcycles" element={<Motorcycles />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="customers" element={<Customers />} />
                <Route path="contracts" element={<Contracts />} />
                <Route path="transport" element={<Transport />} />
                <Route path="repairs" element={<Repairs />} />
                <Route path="my-jobs" element={<MyJobs />} />
                <Route path="reports" element={<Reports />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="my-requests" element={<MyRequests />} />
                <Route path="users" element={<Users />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="contract-forms" element={<ContractForms />} />
                <Route path="inspection-form" element={<InspectionForm />} />
                <Route path="cashier" element={<Cashier />} />
                <Route path="pricing-approval" element={<PricingApproval />} />
                <Route path="crm" element={<CRM />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="mechanic-reports" element={<MechanicReports />} />
                <Route path="messages" element={<Messages />} />
                <Route path="meetings" element={<Meetings />} />
                <Route path="staff-tasks" element={<StaffTasks />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="documents" element={<Documents />} />
                <Route path="office-supplies" element={<OfficeSupplies />} />
                <Route path="loans" element={<Loans />} />
                <Route
                  path="bike-for-inspection"
                  element={<BikeForInspection />}
                />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Error404 />} />
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
