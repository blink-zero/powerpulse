import React from 'react';
import NavItem from './NavItem';
import { NAVIGATION_ITEMS } from './navigationConstants';

const SidebarNavigation = () => {
  return (
    <nav className="mt-5 px-2">
      <div className="space-y-1">
        {NAVIGATION_ITEMS.map((item) => (
          <NavItem 
            key={item.path} 
            to={item.path} 
            icon={item.icon}
          >
            {item.label}
          </NavItem>
        ))}
      </div>
    </nav>
  );
};

export default SidebarNavigation;
