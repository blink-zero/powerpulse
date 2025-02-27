import React, { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import Button from './Button';

/**
 * Reusable modal component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {React.ReactNode} [props.footer] - Modal footer content
 * @param {string} [props.size='md'] - Modal size (sm, md, lg, xl, full)
 * @param {boolean} [props.closeOnEsc=true] - Whether to close on Escape key
 * @param {boolean} [props.closeOnOverlayClick=true] - Whether to close when clicking the overlay
 * @param {string} [props.className=''] - Additional CSS classes
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnEsc = true,
  closeOnOverlayClick = true,
  className = ''
}) => {
  const modalRef = useRef(null);

  // Handle Escape key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (isOpen && closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      // Restore body scrolling when modal is closed
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, closeOnEsc, onClose]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target) && closeOnOverlayClick) {
      onClose();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
    '5xl': 'sm:max-w-5xl',
    '6xl': 'sm:max-w-6xl',
    '7xl': 'sm:max-w-7xl',
    full: 'sm:max-w-full sm:m-4'
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      {/* Background overlay */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity"
          aria-hidden="true"
        ></div>

        {/* Modal panel */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        <div
          ref={modalRef}
          className={`inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${
            sizeClasses[size] || sizeClasses.md
          } ${className}`}
        >
          {/* Modal header */}
          <div className="px-4 py-5 sm:px-6 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
              {title}
            </h3>
            <button
              type="button"
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Modal body */}
          <div className="px-4 py-5 sm:p-6">{children}</div>

          {/* Modal footer */}
          {footer && (
            <div className="px-4 py-3 sm:px-6 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Modal.Footer component for standardized modal footers
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Footer content
 * @param {Function} [props.onCancel] - Cancel handler
 * @param {string} [props.cancelText='Cancel'] - Cancel button text
 * @param {Function} [props.onConfirm] - Confirm handler
 * @param {string} [props.confirmText='Confirm'] - Confirm button text
 * @param {boolean} [props.loading=false] - Whether confirm button is loading
 * @param {boolean} [props.danger=false] - Whether confirm button is dangerous
 * @param {string} [props.className=''] - Additional CSS classes
 */
Modal.Footer = ({
  children,
  onCancel,
  cancelText = 'Cancel',
  onConfirm,
  confirmText = 'Confirm',
  loading = false,
  danger = false,
  className = ''
}) => {
  // If children are provided, render them instead of default buttons
  if (children) {
    return <div className={`flex justify-end space-x-3 ${className}`}>{children}</div>;
  }

  return (
    <div className={`flex justify-end space-x-3 ${className}`}>
      {onCancel && (
        <Button variant="light" onClick={onCancel}>
          {cancelText}
        </Button>
      )}
      {onConfirm && (
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      )}
    </div>
  );
};

export default Modal;
