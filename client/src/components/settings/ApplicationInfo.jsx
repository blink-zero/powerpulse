import React from 'react';
import { FiGithub, FiInfo, FiTag, FiCode, FiFileText } from 'react-icons/fi';
import appConfig from '../../config/appConfig';

/**
 * ApplicationInfo Component
 * 
 * Displays information about the application including version, repository, and copyright.
 */
const ApplicationInfo = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        View information about the PowerPulse application.
      </p>
      
      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-3">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <FiInfo className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Application Name</h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{appConfig.appName}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <FiTag className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Version</h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{appConfig.version}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <FiGithub className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Repository</h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              <a 
                href={appConfig.githubUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                {appConfig.githubUrl}
              </a>
            </p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <FiCode className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">License</h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">MIT License</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <FiFileText className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Copyright</h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              © {appConfig.copyrightYear} {appConfig.copyrightOwner}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationInfo;
