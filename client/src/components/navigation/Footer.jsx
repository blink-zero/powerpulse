import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 py-2 px-4">
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <div>PowerPulse v1.7.0</div>
        <div>
          <a 
            href="https://github.com/blink-zero/powerpulse" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary-600 dark:hover:text-primary-400"
          >
            © 2025 blink-zero
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
