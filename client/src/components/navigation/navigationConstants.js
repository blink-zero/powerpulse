import { FiActivity, FiBattery, FiServer, FiSettings } from 'react-icons/fi';

export const NAVIGATION_ITEMS = [
  {
    path: '/',
    label: 'Dashboard',
    icon: FiActivity,
  },
  {
    path: '/ups-systems',
    label: 'UPS Systems',
    icon: FiBattery,
  },
  {
    path: '/servers',
    label: 'NUT Servers',
    icon: FiServer,
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: FiSettings,
  },
];
