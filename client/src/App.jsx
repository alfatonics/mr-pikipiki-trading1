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
import Layout from "./components/Layout";

const PrivateRoute = ({ children }) => {
  const { user, isLoading, isInitialized } = useAuth();

  console.log("PrivateRoute check:", {
    user: !!user,
    isLoading,
    isInitialized,
  });

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
    console.log("PrivateRoute: No user, redirecting to login");

    // Force redirect on mobile to ensure proper navigation
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    if (isMobile) {
      console.log("Mobile detected - forcing redirect to login");
      window.location.href = "/login";
      return null;
    }

    return <Navigate to="/login" replace />;
  }

  console.log("PrivateRoute: User authenticated, showing content");
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, isLoading, isInitialized } = useAuth();

  console.log("PublicRoute check:", { user: !!user, isLoading, isInitialized });

  // Show loading while authentication is being checked
  if (!isInitialized || isLoading) {
    console.log("PublicRoute: Showing loading state");
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
    console.log("PublicRoute: User authenticated, redirecting to dashboard");

    // Force redirect on mobile to ensure proper navigation
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    if (isMobile) {
      console.log("Mobile detected - forcing redirect");
      window.location.href = "/";
      return null;
    }

    return <Navigate to="/" replace />;
  }

  console.log("PublicRoute: Showing login page");
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
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
