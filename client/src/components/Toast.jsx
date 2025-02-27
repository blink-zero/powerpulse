import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';

/**
 * Toast notification types
 * @typedef {'success'|'error'|'info'|'warning'} ToastType
 */

/**
 * Toast notification component
 * @param {Object} props - Component props
 * @param {string} props.message - Toast message
 * @param {ToastType} [props.type='info'] - Toast type
 * @param {number} [props.duration=5000] - Duration in milliseconds
 * @param {Function} props.onClose - Close handler function
 */
const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow time for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Determine icon and styles based on type
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <FiCheck className="h-5 w-5 text-green-400" />,
          bgClass: 'bg-green-50 dark:bg-green-900/30',
          textClass: 'text-green-800 dark:text-green-200'
        };
      case 'error':
        return {
          icon: <FiAlertCircle className="h-5 w-5 text-red-400" />,
          bgClass: 'bg-red-50 dark:bg-red-900/30',
          textClass: 'text-red-800 dark:text-red-200'
        };
      case 'warning':
        return {
          icon: <FiAlertCircle className="h-5 w-5 text-yellow-400" />,
          bgClass: 'bg-yellow-50 dark:bg-yellow-900/30',
          textClass: 'text-yellow-800 dark:text-yellow-200'
        };
      case 'info':
      default:
        return {
          icon: <FiInfo className="h-5 w-5 text-blue-400" />,
          bgClass: 'bg-blue-50 dark:bg-blue-900/30',
          textClass: 'text-blue-800 dark:text-blue-200'
        };
    }
  };

  const { icon, bgClass, textClass } = getToastStyles();

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <div className={`rounded-md p-4 ${bgClass} shadow-lg`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">{icon}</div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${textClass}`}>{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className={`inline-flex rounded-md ${textClass} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
            >
              <span className="sr-only">Close</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
