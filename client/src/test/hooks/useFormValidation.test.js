import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../../hooks/useFormValidation';

describe('useFormValidation Hook', () => {
  const initialValues = {
    name: '',
    email: '',
    password: ''
  };

  const validationRules = {
    name: {
      required: true,
      requiredMessage: 'Name is required',
      validator: (value) => value.length >= 3,
      message: 'Name must be at least 3 characters'
    },
    email: {
      required: true,
      requiredMessage: 'Email is required',
      validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Please enter a valid email address'
    },
    password: {
      required: true,
      requiredMessage: 'Password is required',
      validator: (value) => value.length >= 8,
      message: 'Password must be at least 8 characters'
    }
  };

  const onSubmit = vi.fn();

  it('should initialize with the provided values', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules, onSubmit)
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should update values when handleChange is called', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules, onSubmit)
    );

    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe' }
      });
    });

    expect(result.current.values.name).toBe('John Doe');
  });

  it('should mark field as touched when handleBlur is called', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules, onSubmit)
    );

    act(() => {
      result.current.handleBlur({
        target: { name: 'name' }
      });
    });

    expect(result.current.touched.name).toBe(true);
  });

  it('should validate required fields', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules, onSubmit)
    );

    // Trigger validation by attempting to submit
    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() });
    });

    expect(result.current.errors.name).toBe('Name is required');
    expect(result.current.errors.email).toBe('Email is required');
    expect(result.current.errors.password).toBe('Password is required');
  });

  it('should validate field format when values are provided', () => {
    const { result } = renderHook(() => 
      useFormValidation(
        { ...initialValues, name: 'Jo', email: 'invalid-email', password: 'short' },
        validationRules,
        onSubmit
      )
    );

    // Trigger validation by attempting to submit
    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() });
    });

    expect(result.current.errors.name).toBe('Name must be at least 3 characters');
    expect(result.current.errors.email).toBe('Please enter a valid email address');
    expect(result.current.errors.password).toBe('Password must be at least 8 characters');
  });

  it('should call onSubmit when form is valid', async () => {
    const validValues = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    };

    const { result } = renderHook(() => 
      useFormValidation(validValues, validationRules, onSubmit)
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() });
    });

    expect(onSubmit).toHaveBeenCalledWith(validValues);
  });

  it('should set isSubmitting during form submission', async () => {
    // Create a delayed onSubmit function
    const delayedOnSubmit = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    const validValues = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    };

    const { result } = renderHook(() => 
      useFormValidation(validValues, validationRules, delayedOnSubmit)
    );

    let submissionPromise;
    
    act(() => {
      submissionPromise = result.current.handleSubmit({ preventDefault: vi.fn() });
    });

    // Check that isSubmitting is true during submission
    expect(result.current.isSubmitting).toBe(true);

    // Wait for submission to complete
    await act(async () => {
      await submissionPromise;
    });

    // Check that isSubmitting is false after submission
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should reset the form when resetForm is called', () => {
    const { result } = renderHook(() => 
      useFormValidation(
        { ...initialValues, name: 'John Doe' },
        validationRules,
        onSubmit
      )
    );

    // First, make some changes
    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'john@example.com' }
      });
      
      result.current.handleBlur({
        target: { name: 'name' }
      });
    });

    // Then reset the form
    act(() => {
      result.current.resetForm();
    });

    // Check that everything is reset
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });
});
