import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiActivity, FiLock, FiUser, FiServer, FiAlertCircle } from 'react-icons/fi';

const SetupPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nutServer: 'localhost',
    nutPort: '3493',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { setupAdmin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateAdminForm = () => {
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      setFormError('All fields are required');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return false;
    }
    
    return true;
  };

  const validateNutForm = () => {
    if (!formData.nutServer || !formData.nutPort) {
      setFormError('NUT server details are required');
      return false;
    }
    
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    setFormError('');
    
    // Use the current form data
    const { username, password, confirmPassword } = formData;
    
    // Validate with the form data values
    if (!username || !password || !confirmPassword) {
      setFormError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }
    
    // Proceed to next step
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Use the current form data instead of trying to get values from DOM
    const { username, password, nutServer, nutPort } = formData;
    
    // Validate the data
    if (!nutServer || !nutPort) {
      setFormError('NUT server details are required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log('Submitting setup data:', {
        username,
        password: '********', // Don't log actual password
        nutServer,
        nutPort,
      });
      
      const user = await setupAdmin({
        username,
        password,
        nutServer,
        nutPort,
      });
      
      console.log('Setup completed successfully, user:', user);
      // Force a redirect to the dashboard
      navigate('/dashboard');
      // Reload the page to ensure all state is updated
      window.location.href = '/';
    } catch (error) {
      console.error('Setup submission error:', error);
      
      // More detailed error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        setFormError(error.response.data?.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        setFormError('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        setFormError(`Error: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <FiActivity className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">PowerPulse</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            First-time setup - Let's get your UPS monitoring dashboard ready
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            v1.0.0 by <a 
              href="https://github.com/blink-zero" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              blink-zero
            </a>
          </p>
        </div>
        
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400">
                Step {step} of 2
              </span>
            </div>
          </div>
          
          <form className="mt-6 space-y-6" onSubmit={step === 1 ? handleNext : handleSubmit}>
            {formError && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{formError}</h3>
                  </div>
                </div>
              </div>
            )}
            
            {step === 1 ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create Admin Account</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        placeholder="Admin username"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        placeholder="Secure password"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm Password
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configure NUT Server</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="nutServer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      NUT Server Address
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiServer className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="nutServer"
                        name="nutServer"
                        type="text"
                        required
                        value={formData.nutServer}
                        onChange={handleChange}
                        className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        placeholder="localhost or IP address"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="nutPort" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      NUT Server Port
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiServer className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="nutPort"
                        name="nutPort"
                        type="text"
                        required
                        value={formData.nutPort}
                        onChange={handleChange}
                        className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        placeholder="Default: 3493"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      The default NUT port is 3493. Change only if your NUT server uses a different port.
                    </p>
                  </div>
                </div>
              </>
            )}
            
            <div className="flex justify-between">
              {step === 2 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back
                </button>
              )}
              <button
                type={step === 1 ? 'button' : 'submit'}
                onClick={step === 1 ? handleNext : undefined}
                disabled={isSubmitting}
                className={`${
                  step === 1 ? 'ml-auto' : ''
                } inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {step === 1 ? 'Next' : isSubmitting ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
