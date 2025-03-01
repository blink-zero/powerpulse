import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useInactivityTimer from '../../hooks/useInactivityTimer';

// Mock the window events
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};

// Save original methods
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;
const originalLocalStorage = global.localStorage;

describe('useInactivityTimer Hook', () => {
  beforeEach(() => {
    // Mock the window methods
    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;
    
    // Mock localStorage
    global.localStorage = mockLocalStorage;
    
    // Mock document.visibilityState
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible'
    });
    
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Mock Date.now to control time
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 0, 1, 0, 0, 0));
  });

  afterEach(() => {
    // Restore original methods
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    global.localStorage = originalLocalStorage;
    
    // Restore real timers
    vi.useRealTimers();
  });

  it('should set up event listeners on mount', () => {
    const onTimeout = vi.fn();
    const timeoutMinutes = 30;
    
    renderHook(() => useInactivityTimer({ onTimeout, timeout: timeoutMinutes }));
    
    // Check that event listeners were added for all activity events
    expect(mockAddEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('keypress', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    
    // Check for mobile events
    expect(mockAddEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function));
    
    // Check for additional events
    expect(mockAddEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
    
    // Check for visibilitychange event
    expect(mockAddEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    
    // Check that localStorage was initialized
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lastActivityTimestamp', expect.any(String));
  });

  it('should clean up event listeners on unmount', () => {
    const onTimeout = vi.fn();
    const timeoutMinutes = 30;
    
    const { unmount } = renderHook(() => useInactivityTimer({ onTimeout, timeout: timeoutMinutes }));
    
    // Unmount the hook
    unmount();
    
    // Check that event listeners were removed
    expect(mockRemoveEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('keypress', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    
    // Check for mobile events
    expect(mockRemoveEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function));
    
    // Check for additional events
    expect(mockRemoveEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
    
    // Check for visibilitychange event
    expect(mockRemoveEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  it('should call onTimeout after the specified timeout period', () => {
    const onTimeout = vi.fn();
    const timeoutMinutes = 30;
    
    renderHook(() => useInactivityTimer({ onTimeout, timeout: timeoutMinutes }));
    
    // Fast-forward time past the timeout
    vi.advanceTimersByTime(timeoutMinutes * 60 * 1000 + 1000);
    
    // Check that onTimeout was called
    expect(onTimeout).toHaveBeenCalled();
  });

  it('should reset the timer when activity is detected', () => {
    const onTimeout = vi.fn();
    const timeoutMinutes = 30;
    
    renderHook(() => useInactivityTimer({ onTimeout, timeout: timeoutMinutes }));
    
    // Get the activity handler (first argument of the first call)
    const activityHandler = mockAddEventListener.mock.calls[0][1];
    
    // Fast-forward time halfway through the timeout
    vi.advanceTimersByTime(timeoutMinutes * 30 * 1000);
    
    // Simulate user activity
    act(() => {
      activityHandler({ type: 'mousemove' });
    });
    
    // Check that localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lastActivityTimestamp', expect.any(String));
    
    // Fast-forward time halfway through the timeout again
    vi.advanceTimersByTime(timeoutMinutes * 30 * 1000);
    
    // onTimeout should not have been called yet
    expect(onTimeout).not.toHaveBeenCalled();
    
    // Fast-forward time past the full timeout
    vi.advanceTimersByTime(timeoutMinutes * 30 * 1000 + 1000);
    
    // Now onTimeout should have been called
    expect(onTimeout).toHaveBeenCalled();
  });

  it('should handle visibility change correctly when returning to visible state', () => {
    const onTimeout = vi.fn();
    const timeoutMinutes = 30;
    
    renderHook(() => useInactivityTimer({ onTimeout, timeout: timeoutMinutes }));
    
    // Find the visibilitychange handler
    const visibilityHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'visibilitychange'
    )[1];
    
    // Set up a mock timestamp that is within the timeout period
    const now = Date.now();
    const recentTimestamp = now - (timeoutMinutes * 30 * 1000); // Half the timeout
    mockLocalStorage.getItem.mockReturnValueOnce(recentTimestamp.toString());
    
    // Simulate returning to the page
    document.visibilityState = 'visible';
    act(() => {
      visibilityHandler();
    });
    
    // onTimeout should not have been called
    expect(onTimeout).not.toHaveBeenCalled();
    
    // Check that localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lastActivityTimestamp', expect.any(String));
  });

  it('should log out when returning to visible state after timeout period', () => {
    const onTimeout = vi.fn();
    const timeoutMinutes = 30;
    
    renderHook(() => useInactivityTimer({ onTimeout, timeout: timeoutMinutes }));
    
    // Find the visibilitychange handler
    const visibilityHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'visibilitychange'
    )[1];
    
    // Set up a mock timestamp that is beyond the timeout period
    const now = Date.now();
    const oldTimestamp = now - (timeoutMinutes * 60 * 1000 + 1000); // Just past the timeout
    mockLocalStorage.getItem.mockReturnValueOnce(oldTimestamp.toString());
    
    // Simulate returning to the page
    document.visibilityState = 'visible';
    act(() => {
      visibilityHandler();
    });
    
    // onTimeout should have been called
    expect(onTimeout).toHaveBeenCalled();
  });
});
