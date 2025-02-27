import React from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiSettings } from 'react-icons/fi';
import ThemeToggle from '../ThemeToggle';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        <button
          onClick={toggleSidebar}
          className="md:hidden rounded-md p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
        >
          <FiMenu className="h-6 w-6" />
        </button>
        <div className="flex-1 flex justify-end">
          <div className="ml-4 flex items-center md:ml-6 space-x-2">
            <ThemeToggle className="text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700" />
            <Link 
              to="/settings"
              className="p-1 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            >
              <FiSettings className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
