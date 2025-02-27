import React from 'react';
import { FiUser, FiPower } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const UserProfile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="absolute bottom-0 w-full border-t dark:border-gray-700">
      <div className="flex items-center px-4 py-3">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <FiUser className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.username || 'User'}</p>
          <button
            onClick={logout}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center"
          >
            <FiPower className="mr-1 h-3 w-3" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
