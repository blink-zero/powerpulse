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
      // Include additional touch events for better mobile support
      const activityEvents = [
        // Desktop events
        'mousedown', 'mousemove', 'keypress', 'scroll', 
        // Mobile events
        'touchstart', 'touchmove', 'touchend', 'touchcancel',
        // Additional events that might help with mobile devices
        'focus', 'blur'
      ];
      
      // Event handler to reset the inactivity timer
      const handleUserActivity = (event) => {
        console.log(`Activity detected: ${event.type} on ${navigator.userAgent}`);
        // Update last activity timestamp
        localStorage.setItem('lastActivityTimestamp', Date.now().toString());
        resetTimer();
      };
      
      // Special handler for visibility change
      const handleVisibilityChange = () => {
        const isVisible = document.visibilityState === 'visible';
        console.log(`Visibility changed: ${document.visibilityState}`);
        
        if (isVisible) {
          // When page becomes visible again, check if we should logout
          const lastActivity = localStorage.getItem('lastActivityTimestamp');
          const now = Date.now();
          
          if (lastActivity) {
            const inactiveTime = (now - parseInt(lastActivity)) / (60 * 1000); // in minutes
            console.log(`Inactive time: ${inactiveTime.toFixed(2)} minutes`);
            
            if (inactiveTime >= timeout) {
              console.log(`Inactive time (${inactiveTime.toFixed(2)} min) exceeds timeout (${timeout} min), logging out`);
              onTimeout();
              return;
            }
          }
          
          // If we didn't logout, reset the timer
          resetTimer();
        }
        
        // Update last activity timestamp
        localStorage.setItem('lastActivityTimestamp', Date.now().toString());
      };
      
      // Initialize last activity timestamp
      localStorage.setItem('lastActivityTimestamp', Date.now().toString());
      
      // Add event listeners
      activityEvents.forEach(event => {
        window.addEventListener(event, handleUserActivity);
      });
      
      // Add visibility change listener separately
      window.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Initialize the timer
      resetTimer();
      
      // Clean up event listeners and timer
      return () => {
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleUserActivity);
        });
        
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        
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
