import React from "react";
import { Link } from "react-router-dom";

const Error404 = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            404 - Page Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            🏠 Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="block w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            ⬅️ Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Error404;
