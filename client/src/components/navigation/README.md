# Navigation Components

This directory contains modular navigation components used throughout the PowerPulse application.

## Components Overview

### Sidebar

The main sidebar component that contains the sidebar header, navigation menu, and user profile.

```jsx
<Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
```

Props:
- `sidebarOpen`: Boolean indicating whether the sidebar is open (for mobile view)
- `toggleSidebar`: Function to toggle the sidebar open/closed state

### SidebarHeader

The header section of the sidebar with the application logo and title.

```jsx
<SidebarHeader toggleSidebar={toggleSidebar} />
```

Props:
- `toggleSidebar`: Function to toggle the sidebar open/closed state

### SidebarNavigation

The navigation menu in the sidebar with links to different pages.

```jsx
<SidebarNavigation />
```

This component uses the `NAVIGATION_ITEMS` constant from `navigationConstants.js` to render the navigation items.

### UserProfile

The user profile section in the sidebar with user information and logout button.

```jsx
<UserProfile />
```

This component uses the `useAuth` hook to access the current user and logout function.

### Header

The top navigation bar with mobile menu toggle and user actions.

```jsx
<Header toggleSidebar={toggleSidebar} />
```

Props:
- `toggleSidebar`: Function to toggle the sidebar open/closed state

### Footer

The footer component with application version and links.

```jsx
<Footer />
```

### NavItem

A reusable navigation item component used in the sidebar navigation.

```jsx
<NavItem to="/path" icon={IconComponent}>
  Menu Item
</NavItem>
```

Props:
- `to`: The route path to navigate to
- `icon`: The icon component to display
- `children`: The text content of the navigation item

## Constants

### navigationConstants.js

Contains constants used by the navigation components.

```javascript
export const NAVIGATION_ITEMS = [
  {
    path: '/',
    label: 'Dashboard',
    icon: FiActivity,
  },
  // ...more navigation items
];
```

## Usage

The navigation components are used in the `Layout.jsx` component to create the application layout:

```jsx
const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 flex flex-col md:pl-64">
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
        
        <Footer />
      </div>
    </div>
  );
};
```

## Responsive Design

The navigation components are designed to be responsive:

- On desktop, the sidebar is always visible
- On mobile, the sidebar is hidden by default and can be toggled with the menu button
- The sidebar slides in from the left on mobile when opened
- The header adapts to different screen sizes
