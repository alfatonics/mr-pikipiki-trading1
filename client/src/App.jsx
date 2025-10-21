import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Motorcycles from './pages/Motorcycles';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Contracts from './pages/Contracts';
import Transport from './pages/Transport';
import Repairs from './pages/Repairs';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Approvals from './pages/Approvals';
import MyRequests from './pages/MyRequests';
import MyJobs from './pages/MyJobs';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
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
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;


