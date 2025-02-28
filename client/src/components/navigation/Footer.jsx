import React from 'react';
import appConfig from '../../config/appConfig';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 py-2 px-4">
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <div>{appConfig.appName} v{appConfig.version}</div>
        <div>
          <a 
            href={appConfig.githubUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary-600 dark:hover:text-primary-400"
          >
            © {appConfig.copyrightYear} {appConfig.copyrightOwner}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
