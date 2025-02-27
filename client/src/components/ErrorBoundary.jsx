import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    // You could also log to an error reporting service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-md">
          <div className="flex items-center">
            <FiAlertTriangle className="h-6 w-6 text-red-500 mr-3" />
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
              Something went wrong
            </h3>
          </div>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            <p>
              {this.props.fallbackMessage || 
                'An error occurred while rendering this component. Please try refreshing the page.'}
            </p>
            {this.props.showError && this.state.error && (
              <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/50 rounded overflow-auto text-xs">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
          {this.props.resetAction && (
            <div className="mt-4">
              <button
                onClick={this.props.resetAction}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-100 dark:bg-red-900/50 dark:hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
