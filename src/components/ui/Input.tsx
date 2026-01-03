import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    icon, 
    iconPosition = 'left',
    fullWidth = false,
    className = '', 
    id,
    ...props 
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    const inputBaseStyles = 'block w-full rounded-lg sm:rounded-xl border-2 transition-all focus:outline-none text-sm sm:text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-sm';
    const inputSizeStyles = icon ? (iconPosition === 'left' ? 'pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3' : 'pl-3 sm:pl-4 pr-9 sm:pr-12 py-2.5 sm:py-3') : 'px-3 sm:px-4 py-2.5 sm:py-3';
    const inputStateStyles = hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500 focus:ring-2 focus:outline-none bg-white dark:bg-slate-800'
      : 'border-gray-400 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 hover:bg-white dark:hover:bg-slate-600 hover:border-blue-800 focus:border-blue-800 focus:ring-blue-800 focus:ring-2 focus:outline-none focus:bg-white dark:focus:bg-slate-700';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={inputId} className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`${inputBaseStyles} ${inputSizeStyles} ${inputStateStyles} ${className}`}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none text-gray-500">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600 font-medium">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ 
    label, 
    error, 
    helperText, 
    fullWidth = false,
    className = '', 
    id,
    rows = 4,
    ...props 
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    const textareaBaseStyles = 'block w-full rounded-xl border-2 px-4 py-3 transition-all focus:outline-none focus:ring-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-sm';
    const textareaStateStyles = hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500 bg-white dark:bg-slate-700'
      : 'border-gray-400 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 hover:bg-white dark:hover:bg-slate-600 hover:border-blue-800 focus:border-blue-800 focus:ring-blue-800 focus:bg-white dark:focus:bg-slate-700';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`${textareaBaseStyles} ${textareaStateStyles} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
