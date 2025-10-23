import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const MobileTest = () => {
  const { login } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runMobileTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    addResult('=== MOBILE COMPATIBILITY TEST START ===', 'header');
    
    // Test 1: Browser Detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    addResult(`Mobile Detection: ${isMobile ? 'YES' : 'NO'}`, isMobile ? 'success' : 'warning');
    addResult(`User Agent: ${navigator.userAgent}`, 'info');
    
    // Test 2: Storage Tests
    try {
      localStorage.setItem('test', 'localStorage works');
      const localTest = localStorage.getItem('test');
      localStorage.removeItem('test');
      addResult(`localStorage: ${localTest === 'localStorage works' ? 'WORKS' : 'FAILED'}`, localTest === 'localStorage works' ? 'success' : 'error');
    } catch (error) {
      addResult(`localStorage: FAILED - ${error.message}`, 'error');
    }
    
    try {
      sessionStorage.setItem('test', 'sessionStorage works');
      const sessionTest = sessionStorage.getItem('test');
      sessionStorage.removeItem('test');
      addResult(`sessionStorage: ${sessionTest === 'sessionStorage works' ? 'WORKS' : 'FAILED'}`, sessionTest === 'sessionStorage works' ? 'success' : 'error');
    } catch (error) {
      addResult(`sessionStorage: FAILED - ${error.message}`, 'error');
    }
    
    // Test 3: Network Test
    addResult(`Network Status: ${navigator.onLine ? 'ONLINE' : 'OFFLINE'}`, navigator.onLine ? 'success' : 'error');
    
    // Test 4: Screen Info
    addResult(`Screen: ${window.screen.width}x${window.screen.height}`, 'info');
    addResult(`Viewport: ${window.innerWidth}x${window.innerHeight}`, 'info');
    addResult(`Touch Support: ${'ontouchstart' in window ? 'YES' : 'NO'}`, 'info');
    
    // Test 5: API Connection Test
    try {
      addResult('Testing API connection...', 'info');
      const response = await fetch('/api/test-connection', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        addResult('API Connection: SUCCESS', 'success');
      } else {
        addResult(`API Connection: FAILED - Status ${response.status}`, 'error');
      }
    } catch (error) {
      addResult(`API Connection: FAILED - ${error.message}`, 'error');
    }
    
    // Test 6: Login Test
    try {
      addResult('Testing login with test credentials...', 'info');
      await login('admin', 'admin123');
      addResult('Login Test: SUCCESS', 'success');
    } catch (error) {
      addResult(`Login Test: FAILED - ${error.message}`, 'error');
    }
    
    addResult('=== MOBILE COMPATIBILITY TEST END ===', 'header');
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Mobile Compatibility Test</h1>
          
          <div className="mb-6">
            <button
              onClick={runMobileTests}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mr-4"
            >
              {isLoading ? 'Running Tests...' : 'Run Mobile Tests'}
            </button>
            
            <button
              onClick={clearResults}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-sm ${
                  result.type === 'success' ? 'bg-green-100 text-green-800' :
                  result.type === 'error' ? 'bg-red-100 text-red-800' :
                  result.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  result.type === 'header' ? 'bg-blue-100 text-blue-800 font-bold' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                <span className="text-xs text-gray-500 mr-2">[{result.timestamp}]</span>
                {result.message}
              </div>
            ))}
          </div>
          
          {testResults.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Click "Run Mobile Tests" to start testing mobile compatibility
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileTest;
