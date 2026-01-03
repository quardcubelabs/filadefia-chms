import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    label, 
    error, 
    helperText, 
    options,
    placeholder,
    fullWidth = false,
    className = '', 
    id,
    ...props 
  }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    const selectBaseStyles = 'block w-full rounded-lg sm:rounded-xl border-2 px-3 sm:px-4 py-2.5 sm:py-3 pr-8 sm:pr-10 transition-all focus:outline-none focus:ring-2 appearance-none text-sm sm:text-base text-gray-900';
    const selectStateStyles = hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500 focus:ring-2 bg-white'
      : 'border-gray-500 hover:border-blue-800 focus:border-blue-800 focus:ring-blue-800 focus:ring-2 bg-white';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={selectId} className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`${selectBaseStyles} ${selectStateStyles} ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 sm:pr-3 pointer-events-none text-gray-600">
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
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

Select.displayName = 'Select';
