import React from 'react';

/**
 * Reusable card component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.title] - Card title
 * @param {React.ReactNode} [props.titleIcon] - Icon to display next to title
 * @param {React.ReactNode} [props.actions] - Actions to display in header
 * @param {string} [props.className=''] - Additional CSS classes for the card
 * @param {string} [props.headerClassName=''] - Additional CSS classes for the header
 * @param {string} [props.bodyClassName=''] - Additional CSS classes for the body
 * @param {boolean} [props.noPadding=false] - Whether to remove padding from the body
 * @param {boolean} [props.noShadow=false] - Whether to remove shadow from the card
 * @param {boolean} [props.border=true] - Whether to show border
 */
const Card = ({
  children,
  title,
  titleIcon,
  actions,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  noPadding = false,
  noShadow = false,
  border = true
}) => {
  // Base card classes
  const cardClasses = `
    bg-white dark:bg-gray-800 
    ${border ? 'border dark:border-gray-700' : ''} 
    ${noShadow ? '' : 'shadow'} 
    rounded-lg overflow-hidden
    ${className}
  `;

  // Header classes
  const headerClasses = `
    ${title || actions ? 'px-4 py-5 sm:px-6 border-b dark:border-gray-700 flex justify-between items-center' : ''}
    ${headerClassName}
  `;

  // Body classes
  const bodyClasses = `
    ${noPadding ? '' : 'px-4 py-5 sm:p-6'}
    ${bodyClassName}
  `;

  return (
    <div className={cardClasses}>
      {/* Card header */}
      {(title || actions) && (
        <div className={headerClasses}>
          {title && (
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
              {titleIcon && <span className="mr-2">{titleIcon}</span>}
              {title}
            </h3>
          )}
          {actions && <div className="flex space-x-2">{actions}</div>}
        </div>
      )}

      {/* Card body */}
      <div className={bodyClasses}>{children}</div>
    </div>
  );
};

export default Card;
