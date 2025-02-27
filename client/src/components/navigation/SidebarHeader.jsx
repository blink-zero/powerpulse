import React from 'react';
import { FiActivity, FiX } from 'react-icons/fi';

const SidebarHeader = ({ toggleSidebar }) => {
  return (
    <div className="flex items-center justify-between h-16 px-4 border-b dark:border-gray-700">
      <div className="flex flex-col">
        <div className="flex items-center">
          <FiActivity className="h-8 w-8 text-primary-600" />
          <span className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">PowerPulse</span>
        </div>
        <span className="ml-10 text-xs text-gray-500 dark:text-gray-400">a blink-zero project</span>
      </div>
      <button
        onClick={toggleSidebar}
        className="md:hidden rounded-md p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
      >
        <FiX className="h-6 w-6" />
      </button>
    </div>
  );
};

export default SidebarHeader;
