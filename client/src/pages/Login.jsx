import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { FiLock, FiUser } from 'react-icons/fi';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const testAPIConnection = async () => {
    try {
      console.log('Testing API connection...');
      
      // Test multiple endpoints to find what works
      const endpoints = [
        '/api/auth/verify',
        '/api/dashboard/',
        '/api/motorcycles',
        '/api/customers'
      ];
      
      let workingEndpoint = null;
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Testing endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Mobile-Request': 'true'
            }
          });
          
          const result = {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            url: response.url,
            headers: Object.fromEntries(response.headers.entries())
          };
          
          console.log(`Endpoint ${endpoint} result:`, result);
          
          if (response.ok || response.status === 401) {
            // 401 is expected for protected routes, but means API is reachable
            workingEndpoint = endpoint;
            setDebugInfo(`API Test: ${endpoint} - ${response.status} ${response.statusText} - API REACHABLE`);
            return result;
          }
          
        } catch (error) {
          console.error(`Endpoint ${endpoint} error:`, error);
          lastError = error;
        }
      }
      
      // If no endpoint worked, show the last error
      if (lastError) {
        setDebugInfo(`API Test: ALL ENDPOINTS FAILED - ${lastError.message}`);
        return { error: lastError.message };
      }
      
      setDebugInfo(`API Test: NO WORKING ENDPOINTS FOUND`);
      return { error: 'No working endpoints found' };
      
    } catch (error) {
      console.error('API Test Error:', error);
      setDebugInfo(`API Test: FAILED - ${error.message}`);
      return { error: error.message };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDebugInfo('');
    setLoading(true);

    try {
      console.log('Login form submitted');
      
      // Test API connection first
      const apiTest = await testAPIConnection();
      if (apiTest.error) {
        setError(`API Connection Failed: ${apiTest.error}`);
        setLoading(false);
        return;
      }
      
      await login(username, password);
      console.log('Login successful, navigating to dashboard');
      navigate('/');
    } catch (err) {
      console.error('Login form error:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status,
        isMobile: err.isMobile
      });
      
      let errorMessage = 'Login failed. Please try again.';
      
      // Use the enhanced error message from AuthContext if available
      if (err.message && err.message !== 'Login failed. Please try again.') {
        errorMessage = err.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message?.includes('Network Error') || err.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message?.includes('timeout') || err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again with a better connection.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid username or password. Please check your credentials.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.response?.status === 0) {
        errorMessage = 'Connection failed. Please check your internet connection.';
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
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'block';
                }}
              />
              <h1 className="text-lg sm:text-3xl font-bold text-gray-900 mb-2" style={{display: 'none'}}>
                MR PIKIPIKI TRADING
              </h1>
            </div>
            <h2 className="text-base sm:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-2">MR PIKIPIKI TRADING</h2>
            <p className="text-xs sm:text-base text-gray-600">Management System</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 text-xs sm:text-sm">
              <div className="font-semibold mb-1">Login Error:</div>
              <div className="mb-2">{error}</div>
              <div className="text-xs text-red-500 bg-red-100 p-2 rounded">
                <div><strong>Debug Info:</strong></div>
                <div>User Agent: {navigator.userAgent}</div>
                <div>Is Mobile: {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Yes' : 'No'}</div>
                <div>Network: {navigator.onLine ? 'Online' : 'Offline'}</div>
                <div>URL: {window.location.href}</div>
                <div>Environment: {process.env.NODE_ENV}</div>
                {debugInfo && <div className="mt-2 font-semibold">API Test: {debugInfo}</div>}
              </div>
            </div>
          )}
          
          {debugInfo && !error && (
            <div className="bg-blue-50 border border-blue-200 text-blue-600 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 text-xs sm:text-sm">
              <div className="font-semibold mb-2 flex items-center gap-2">
                🔍 Debug Info:
                <button
                  onClick={() => setDebugInfo('')}
                  className="text-blue-400 hover:text-blue-600 text-xs"
                >
                  ✕ Clear
                </button>
              </div>
              <div className="whitespace-pre-line font-mono text-xs leading-relaxed">
                {debugInfo}
              </div>
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
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            
                    {/* Test Login Button for Debugging */}
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('mechanic1');
                        setPassword('password123');
                        setDebugInfo('Test credentials filled. Click Login to test.');
                      }}
                      className="w-full mt-1 px-3 py-2 bg-green-100 text-green-700 text-xs rounded-lg hover:bg-green-200 transition-colors"
                    >
                      🧪 Fill Test Credentials
                    </button>
                    
                    {/* Mobile Login Test Button */}
                    <button
                      type="button"
                      onClick={async () => {
                        setUsername('mechanic1');
                        setPassword('password123');
                        setDebugInfo('Testing mobile login...');
                        
                        try {
                          // Test login directly
                          await login('mechanic1', 'password123');
                          setDebugInfo('Mobile login test: SUCCESS!');
                        } catch (error) {
                          setDebugInfo(`Mobile login test: FAILED - ${error.message}`);
                        }
                      }}
                      className="w-full mt-1 px-3 py-2 bg-blue-100 text-blue-700 text-xs rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      📱 Test Mobile Login
                    </button>
            
            {/* Mobile Debug Button */}
            <button
              type="button"
              onClick={async () => {
                const debugInfo = {
                  userAgent: navigator.userAgent,
                  isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
                  networkStatus: navigator.onLine,
                  currentURL: window.location.href,
                  environment: process.env.NODE_ENV,
                  screenSize: window.screen.width + 'x' + window.screen.height,
                  viewportSize: window.innerWidth + 'x' + window.innerHeight,
                  timestamp: new Date().toLocaleString()
                };
                
                console.log('=== MOBILE DEBUG INFO ===', debugInfo);
                
                // Test API connection
                try {
                  const response = await fetch('/api/auth/verify', {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    }
                  });
                  
                  const apiResult = {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    url: response.url
                  };
                  
                  console.log('API Test Response:', apiResult);
                  
                  // Display debug info on the page
                  const debugText = `
MOBILE DEBUG INFO:
• Device: ${debugInfo.isMobile ? 'Mobile' : 'Desktop'}
• Browser: ${debugInfo.userAgent.split(' ')[0]}
• Network: ${debugInfo.networkStatus ? 'Online' : 'Offline'}
• URL: ${debugInfo.currentURL}
• Screen: ${debugInfo.screenSize}
• Viewport: ${debugInfo.viewportSize}
• Environment: ${debugInfo.environment}
• Time: ${debugInfo.timestamp}

API TEST:
• Status: ${apiResult.status} ${apiResult.statusText}
• Success: ${apiResult.ok ? 'YES' : 'NO'}
• URL: ${apiResult.url}
                  `;
                  
                  setDebugInfo(debugText);
                  
                } catch (error) {
                  console.error('API Test Error:', error);
                  setDebugInfo(`
MOBILE DEBUG INFO:
• Device: ${debugInfo.isMobile ? 'Mobile' : 'Desktop'}
• Browser: ${debugInfo.userAgent.split(' ')[0]}
• Network: ${debugInfo.networkStatus ? 'Online' : 'Offline'}
• URL: ${debugInfo.currentURL}
• Screen: ${debugInfo.screenSize}
• Viewport: ${debugInfo.viewportSize}
• Environment: ${debugInfo.environment}
• Time: ${debugInfo.timestamp}

API TEST:
• ERROR: ${error.message}
• Connection: FAILED
                  `);
                }
              }}
              className="w-full mt-2 px-3 py-2 bg-blue-100 text-blue-700 text-xs rounded-lg hover:bg-blue-200 transition-colors"
            >
              🔍 Mobile Debug Info
            </button>
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


