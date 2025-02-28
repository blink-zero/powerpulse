/**
 * Custom hook for managing user inactivity timeout
 * Automatically logs out the user after a specified period of inactivity
 */
import { useRef, useEffect } from 'react';

/**
 * Hook to manage user inactivity and trigger logout after timeout
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Timeout in minutes
 * @param {Function} options.onTimeout - Function to call when timeout occurs
 * @param {boolean} options.isActive - Whether the timer should be active
 * @returns {Function} - Function to reset the timer
 */
const useInactivityTimer = ({ timeout, onTimeout, isActive = true }) => {
  const timerRef = useRef(null);
  
  // Function to reset the inactivity timer
  const resetTimer = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set a new timer if active
    if (isActive) {
      timerRef.current = setTimeout(() => {
        // Call the onTimeout callback when the timer expires
        onTimeout();
        console.log('User automatically logged out due to inactivity');
      }, timeout * 60 * 1000); // Convert minutes to milliseconds
    }
  };
  
  // Set up activity listeners
  useEffect(() => {
    if (isActive) {
      // Events that indicate user activity
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      // Event handler to reset the inactivity timer
      const handleUserActivity = () => {
        resetTimer();
      };
      
      // Add event listeners
      activityEvents.forEach(event => {
        window.addEventListener(event, handleUserActivity);
      });
      
      // Initialize the timer
      resetTimer();
      
      // Clean up event listeners and timer
      return () => {
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleUserActivity);
        });
        
        // Clear any existing timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [timeout, isActive, onTimeout]);
  
  return resetTimer;
};

export default useInactivityTimer;
