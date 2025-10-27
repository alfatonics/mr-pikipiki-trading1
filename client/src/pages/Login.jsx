import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Input from "../components/Input";
import { FiLock, FiUser } from "react-icons/fi";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);

      // Add a small delay to ensure state updates on mobile
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Force page reload on mobile to ensure state updates
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      if (isMobile) {
        window.location.href = "/";
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      let errorMessage = "Login failed. Please try again.";

      // Use the enhanced error message from AuthContext if available
      if (err.message && err.message !== "Login failed. Please try again.") {
        errorMessage = err.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (
        err.message?.includes("Network Error") ||
        err.code === "NETWORK_ERROR"
      ) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (
        err.message?.includes("timeout") ||
        err.code === "ECONNABORTED"
      ) {
        errorMessage =
          "Request timed out. Please try again with a better connection.";
      } else if (err.response?.status === 401) {
        errorMessage =
          "Invalid username or password. Please check your credentials.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.response?.status === 0) {
        errorMessage =
          "Connection failed. Please check your internet connection.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center px-3 sm:px-6 py-3 sm:py-6">
      <div className="w-full max-w-[320px] sm:max-w-md">
        <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl p-4 sm:p-8">
          <div className="text-center mb-3 sm:mb-8">
            {/* Company Logo */}
            <div className="mb-1.5 sm:mb-4">
              <img
                src="/logo.png"
                alt="MR PIKIPIKI TRADING"
                className="mx-auto h-16 sm:h-24 md:h-32 w-auto"
                onError={(e) => {
                  // If logo doesn't exist, hide image and show text instead
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "block";
                }}
              />
              <h1
                className="text-lg sm:text-3xl font-bold text-gray-900 mb-2"
                style={{ display: "none" }}
              >
                MR PIKIPIKI TRADING
              </h1>
            </div>
            <h2 className="text-base sm:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-2">
              MR PIKIPIKI TRADING
            </h2>
            <p className="text-xs sm:text-base text-gray-600">
              Management System
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 text-xs sm:text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-0">
              <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1">
                <FiUser className="inline mr-1 sm:mr-2 text-sm sm:text-base" />
                Username
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mb-2 sm:mb-4"
              />
            </div>

            <div className="mb-0">
              <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1">
                <FiLock className="inline mr-1 sm:mr-2 text-sm sm:text-base" />
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mb-3 sm:mb-6"
              />
            </div>

            <Button
              type="submit"
              className="w-full text-xs sm:text-base"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-2 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
            <p>Dar es Salaam, Ubungo Riverside-Kibangu</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
