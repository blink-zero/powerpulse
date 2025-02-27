import React from 'react';
import SidebarHeader from './SidebarHeader';
import SidebarNavigation from './SidebarNavigation';
import UserProfile from './UserProfile';

const Sidebar = ({ sidebarOpen, toggleSidebar }) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition-transform duration-300 ease-in-out`}
    >
      <SidebarHeader toggleSidebar={toggleSidebar} />
      <SidebarNavigation />
      <UserProfile />
    </aside>
  );
};

export default Sidebar;
