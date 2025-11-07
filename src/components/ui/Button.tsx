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
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-gradient-to-r from-tag-red-500 to-tag-red-700 text-white hover:from-tag-red-600 hover:to-tag-red-800 focus:ring-tag-red-500 shadow-tag-lg hover:shadow-xl font-semibold',
      secondary: 'bg-gradient-to-r from-tag-yellow-500 to-tag-yellow-600 text-tag-black hover:from-tag-yellow-600 hover:to-tag-yellow-700 focus:ring-tag-yellow-500 shadow-lg hover:shadow-xl font-semibold',
      outline: 'border-2 border-tag-red-500 text-tag-red-600 hover:bg-tag-red-50 hover:border-tag-red-600 focus:ring-tag-red-500 font-semibold',
      ghost: 'text-tag-gray-700 hover:bg-tag-gray-100 hover:text-tag-gray-900 focus:ring-tag-gray-400 font-medium',
      danger: 'bg-gradient-to-r from-tag-red-600 to-tag-red-700 text-white hover:from-tag-red-700 hover:to-tag-red-800 focus:ring-tag-red-500 shadow-tag-lg hover:shadow-xl font-semibold',
      success: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500 shadow-lg hover:shadow-xl font-semibold',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && icon && icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
