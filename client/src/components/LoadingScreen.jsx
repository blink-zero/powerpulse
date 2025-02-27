import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-200">Loading...</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Please wait while we prepare your dashboard</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
