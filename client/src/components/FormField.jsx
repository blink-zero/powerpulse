import React from 'react';

/**
 * Reusable form field component
 * @param {Object} props - Component props
 * @param {string} props.id - Field ID
 * @param {string} props.name - Field name
 * @param {string} props.label - Field label
 * @param {string} [props.type='text'] - Input type
 * @param {string} [props.placeholder=''] - Input placeholder
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {string} [props.value=''] - Field value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {string} [props.error=''] - Error message
 * @param {boolean} [props.touched=false] - Whether field has been touched
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {Object} [props.inputProps={}] - Additional input props
 */
const FormField = ({
  id,
  name,
  label,
  type = 'text',
  placeholder = '',
  required = false,
  value = '',
  onChange,
  onBlur,
  error = '',
  touched = false,
  className = '',
  inputProps = {}
}) => {
  // Show error only if field has been touched
  const showError = touched && error;
  
  // Base input classes
  const inputClasses = `mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
    showError
      ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
  } ${className}`;

  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          className={inputClasses}
          rows={inputProps.rows || 3}
          {...inputProps}
        />
      ) : type === 'select' ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          className={inputClasses}
          {...inputProps}
        >
          {inputProps.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'checkbox' ? (
        <div className="mt-1 flex items-center">
          <input
            id={id}
            name={name}
            type="checkbox"
            checked={value}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
            {...inputProps}
          />
          {inputProps.checkboxLabel && (
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {inputProps.checkboxLabel}
            </span>
          )}
        </div>
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          className={inputClasses}
          {...inputProps}
        />
      )}
      
      {showError && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default FormField;
