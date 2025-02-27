import React from 'react';

/**
 * Button variants
 * @typedef {'primary'|'secondary'|'success'|'danger'|'warning'|'info'|'light'|'dark'} ButtonVariant
 */

/**
 * Button sizes
 * @typedef {'xs'|'sm'|'md'|'lg'|'xl'} ButtonSize
 */

/**
 * Reusable button component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {ButtonVariant} [props.variant='primary'] - Button variant
 * @param {ButtonSize} [props.size='md'] - Button size
 * @param {boolean} [props.outline=false] - Whether button has outline style
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {boolean} [props.loading=false] - Whether button is in loading state
 * @param {string} [props.loadingText='Loading...'] - Text to show when loading
 * @param {React.ReactNode} [props.icon] - Icon to show before text
 * @param {string} [props.type='button'] - Button type
 * @param {Function} [props.onClick] - Click handler
 * @param {string} [props.className=''] - Additional CSS classes
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  outline = false,
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  icon,
  type = 'button',
  onClick,
  className = '',
  ...rest
}) => {
  // Variant styles
  const variantStyles = {
    primary: outline
      ? 'border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
      : 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: outline
      ? 'border-gray-500 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/20'
      : 'bg-gray-600 hover:bg-gray-700 text-white',
    success: outline
      ? 'border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
      : 'bg-green-600 hover:bg-green-700 text-white',
    danger: outline
      ? 'border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
      : 'bg-red-600 hover:bg-red-700 text-white',
    warning: outline
      ? 'border-yellow-500 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
      : 'bg-yellow-600 hover:bg-yellow-700 text-white',
    info: outline
      ? 'border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
      : 'bg-blue-600 hover:bg-blue-700 text-white',
    light: outline
      ? 'border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    dark: outline
      ? 'border-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
      : 'bg-gray-800 hover:bg-gray-900 text-white'
  };

  // Size styles
  const sizeStyles = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base'
  };

  // Base classes
  const baseClasses = 'inline-flex items-center justify-center border font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150';
  
  // Disabled styles
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  
  // Combine all classes
  const buttonClasses = `
    ${baseClasses}
    ${variantStyles[variant] || variantStyles.primary}
    ${sizeStyles[size] || sizeStyles.md}
    ${outline ? 'bg-transparent border' : 'border-transparent'}
    ${disabled || loading ? disabledClasses : ''}
    ${className}
  `;

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
