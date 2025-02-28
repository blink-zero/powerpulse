import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useInactivityTimer from '../../hooks/useInactivityTimer';

// Mock the window events
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

// Save original methods
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

describe('useInactivityTimer Hook', () => {
  beforeEach(() => {
    // Mock the window methods
    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;
    
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Mock Date.now to control time
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore original methods
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    
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
    expect(mockAddEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
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
    expect(mockRemoveEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
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
      activityHandler();
    });
    
    // Fast-forward time halfway through the timeout again
    vi.advanceTimersByTime(timeoutMinutes * 30 * 1000);
    
    // onTimeout should not have been called yet
    expect(onTimeout).not.toHaveBeenCalled();
    
    // Fast-forward time past the full timeout
    vi.advanceTimersByTime(timeoutMinutes * 30 * 1000 + 1000);
    
    // Now onTimeout should have been called
    expect(onTimeout).toHaveBeenCalled();
  });
});
