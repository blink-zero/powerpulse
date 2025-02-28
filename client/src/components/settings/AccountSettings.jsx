import React, { useState, useEffect, useCallback } from 'react';
import { FiUser, FiLock, FiX, FiSave, FiClock, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import useFormValidation from '../../hooks/useFormValidation';
import { authAPI } from '../../services/api';

const AccountSettings = ({ setError, setSuccess }) => {
  const { user, inactivityTimeout, updateInactivityTimeout } = useAuth();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [localInactivityTimeout, setLocalInactivityTimeout] = useState(inactivityTimeout);
  
  // Password form validation
  const validatePasswordForm = (values) => {
    const errors = {};
    
    if (!values.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!values.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (values.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
    }
    
    if (!values.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (values.confirmPassword !== values.newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };
  
  const {
    values: passwordData,
    errors: passwordErrors,
    touched: passwordTouched,
    isSubmitting: isPasswordSubmitting,
    handleChange: handlePasswordInputChange,
    handleBlur: handlePasswordInputBlur,
    handleSubmit: handlePasswordSubmit,
    resetForm: resetPasswordForm
  } = useFormValidation(
    {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validatePasswordForm
  );
  
  // Update local state when context value changes
  useEffect(() => {
    setLocalInactivityTimeout(inactivityTimeout);
  }, [inactivityTimeout]);

  const handleInactivityTimeoutChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setLocalInactivityTimeout(value);
  };
  
  const saveInactivityTimeout = () => {
    updateInactivityTimeout(localInactivityTimeout);
    setSuccess('Session timeout updated successfully');
  };
  

  const closeModal = useCallback(() => {
    setIsChangePasswordModalOpen(false);
    resetPasswordForm();
  }, [resetPasswordForm]);

  const submitPasswordChange = useCallback(async (values) => {
    try {
      setError(null);
      setSuccess(null);
      
      await authAPI.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      
      setSuccess('Password changed successfully');
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
      console.error('Error changing password:', err);
    }
  }, [setError, setSuccess, closeModal]);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">User Information</h4>
        <div className="mt-2 flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <FiUser className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Role: {user?.role}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Password</h4>
        <div className="mt-2">
          <button
            onClick={() => setIsChangePasswordModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiLock className="mr-2 -ml-1 h-5 w-5" />
            Change Password
          </button>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Session Settings</h4>
        <div className="mt-2">
          <div className="flex items-center">
            <FiClock className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <label htmlFor="inactivityTimeout" className="block text-sm text-gray-700 dark:text-gray-300">
              Automatic logout after inactivity (minutes):
            </label>
          </div>
          <div className="mt-2 flex items-center">
            <input
              type="number"
              id="inactivityTimeout"
              name="inactivityTimeout"
              min="1"
              max="1440"
              value={localInactivityTimeout}
              onChange={handleInactivityTimeoutChange}
              className="mr-3 block w-24 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={saveInactivityTimeout}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiSave className="mr-2 -ml-1 h-4 w-4" />
              Save
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            For security, you will be automatically logged out after this period of inactivity.
          </p>
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Change Password</h3>
                    <div className="mt-4">
                      <form onSubmit={handlePasswordSubmit(submitPasswordChange)}>
                        <div className="mb-4">
                          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Current Password
                          </label>
                          <input
                            type="password"
                            name="currentPassword"
                            id="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordInputChange}
                            onBlur={handlePasswordInputBlur}
                            required
                            className={`mt-1 block w-full border ${
                              passwordTouched.currentPassword && passwordErrors.currentPassword 
                                ? 'border-red-500 dark:border-red-400' 
                                : 'border-gray-300 dark:border-gray-600'
                            } rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                          />
                          {passwordTouched.currentPassword && passwordErrors.currentPassword && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                              <FiAlertCircle className="mr-1 h-4 w-4" />
                              {passwordErrors.currentPassword}
                            </p>
                          )}
                        </div>
                        <div className="mb-4">
                          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            New Password
                          </label>
                          <input
                            type="password"
                            name="newPassword"
                            id="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordInputChange}
                            onBlur={handlePasswordInputBlur}
                            required
                            className={`mt-1 block w-full border ${
                              passwordTouched.newPassword && passwordErrors.newPassword 
                                ? 'border-red-500 dark:border-red-400' 
                                : 'border-gray-300 dark:border-gray-600'
                            } rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                          />
                          {passwordTouched.newPassword && passwordErrors.newPassword && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                              <FiAlertCircle className="mr-1 h-4 w-4" />
                              {passwordErrors.newPassword}
                            </p>
                          )}
                        </div>
                        <div className="mb-4">
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            name="confirmPassword"
                            id="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordInputChange}
                            onBlur={handlePasswordInputBlur}
                            required
                            className={`mt-1 block w-full border ${
                              passwordTouched.confirmPassword && passwordErrors.confirmPassword 
                                ? 'border-red-500 dark:border-red-400' 
                                : 'border-gray-300 dark:border-gray-600'
                            } rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                          />
                          {passwordTouched.confirmPassword && passwordErrors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                              <FiAlertCircle className="mr-1 h-4 w-4" />
                              {passwordErrors.confirmPassword}
                            </p>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handlePasswordSubmit(submitPasswordChange)}
                  disabled={isPasswordSubmitting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isPasswordSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2 h-5 w-5" />
                      Change Password
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <FiX className="mr-2 h-5 w-5" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
