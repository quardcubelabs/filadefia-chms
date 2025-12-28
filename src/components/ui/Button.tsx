import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    fullWidth = false,
    className = '',
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation';
    
    const variants = {
      primary: 'bg-red-100 border border-red-600 text-red-700 hover:bg-red-200 hover:text-red-800 focus:ring-red-500 shadow-md hover:shadow-lg font-semibold',
      secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500 shadow-lg hover:shadow-xl font-semibold',
      outline: 'border-2 border-red-600 text-red-600 hover:bg-red-100 hover:border-red-700 focus:ring-red-500 font-semibold',
      ghost: 'text-gray-700 hover:bg-red-100 hover:text-red-600 focus:ring-red-400 font-medium',
      danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-lg hover:shadow-xl font-semibold',
      success: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500 shadow-lg hover:shadow-xl font-semibold',
    };

    const sizes = {
      sm: 'px-2.5 py-1.5 text-xs sm:px-3 sm:text-sm gap-1 sm:gap-1.5',
      md: 'px-3 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-base gap-1.5 sm:gap-2',
      lg: 'px-4 py-2.5 text-base sm:px-6 sm:py-3 sm:text-lg gap-2 sm:gap-2.5',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
        {!loading && icon && icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
