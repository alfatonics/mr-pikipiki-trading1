import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DebugPage = () => {
  const [debugInfo, setDebugInfo] = useState({
    loading: true,
    error: null,
    data: null
  });

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        console.log('🔍 Starting debug information fetch...');
        
        // Test basic API connectivity
        const healthResponse = await axios.get('/api/health');
        console.log('✅ Health check response:', healthResponse.data);
        
        // Test database connectivity
        const dbResponse = await axios.get('/api/test-db');
        console.log('✅ Database test response:', dbResponse.data);
        
        // Test dashboard API
        const dashboardResponse = await axios.get('/api/dashboard/stats');
        console.log('✅ Dashboard response:', dashboardResponse.data);
        
        setDebugInfo({
          loading: false,
          error: null,
          data: {
            health: healthResponse.data,
            database: dbResponse.data,
            dashboard: dashboardResponse.data,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            protocol: window.location.protocol,
            host: window.location.host
          }
        });
        
      } catch (error) {
        console.error('❌ Debug fetch error:', error);
        setDebugInfo({
          loading: false,
          error: {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            config: {
              url: error.config?.url,
              method: error.config?.method,
              baseURL: error.config?.baseURL
            }
          },
          data: null
        });
      }
    };

    fetchDebugInfo();
  }, []);

  if (debugInfo.loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading debug information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🔍 MR PIKIPIKI Debug Information</h1>
        
        {/* Error Display */}
        {debugInfo.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-red-800 mb-4">❌ Error Information</h2>
            <div className="space-y-4">
              <div>
                <strong>Error Message:</strong>
                <pre className="bg-red-100 p-2 rounded mt-1 text-sm overflow-x-auto">
                  {debugInfo.error.message}
                </pre>
              </div>
              <div>
                <strong>Status:</strong> {debugInfo.error.status} - {debugInfo.error.statusText}
              </div>
              <div>
                <strong>Request URL:</strong> {debugInfo.error.config?.url}
              </div>
              <div>
                <strong>Request Method:</strong> {debugInfo.error.config?.method}
              </div>
              <div>
                <strong>Base URL:</strong> {debugInfo.error.config?.baseURL}
              </div>
              <div>
                <strong>Response Data:</strong>
                <pre className="bg-red-100 p-2 rounded mt-1 text-sm overflow-x-auto">
                  {JSON.stringify(debugInfo.error.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {debugInfo.data && (
          <div className="space-y-8">
            {/* Environment Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">🌍 Environment Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Current URL:</strong> {debugInfo.data.url}
                </div>
                <div>
                  <strong>Protocol:</strong> {debugInfo.data.protocol}
                </div>
                <div>
                  <strong>Host:</strong> {debugInfo.data.host}
                </div>
                <div>
                  <strong>Timestamp:</strong> {debugInfo.data.timestamp}
                </div>
              </div>
            </div>

            {/* Health Check */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-800 mb-4">✅ Health Check</h2>
              <pre className="bg-green-100 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(debugInfo.data.health, null, 2)}
              </pre>
            </div>

            {/* Database Test */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-purple-800 mb-4">🗄️ Database Test</h2>
              <pre className="bg-purple-100 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(debugInfo.data.database, null, 2)}
              </pre>
            </div>

            {/* Dashboard Test */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-4">📊 Dashboard Test</h2>
              <pre className="bg-yellow-100 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(debugInfo.data.dashboard, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            🔄 Refresh Debug Information
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
