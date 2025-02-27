import React from 'react';
import { NavLink } from 'react-router-dom';

const NavItem = ({ to, icon: Icon, children }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        `group flex items-center px-2 py-2 text-base font-medium rounded-md ${
          isActive 
            ? 'text-primary-600 bg-gray-100 dark:bg-gray-700' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
        }`
      }
    >
      <Icon className="mr-3 h-6 w-6" />
      {children}
    </NavLink>
  );
};

export default NavItem;
