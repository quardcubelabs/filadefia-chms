import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  dot = false,
  className = '', 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full border';
  
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-300',
    primary: 'bg-red-100 text-red-700 border-red-300',
    success: 'bg-green-100 text-green-700 border-green-300',
    warning: 'bg-orange-100 text-orange-700 border-orange-300',
    danger: 'bg-red-100 text-red-700 border-red-300',
    info: 'bg-blue-100 text-blue-700 border-blue-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };

  const dotColors = {
    default: 'bg-gray-600',
    primary: 'bg-red-600',
    success: 'bg-green-600',
    warning: 'bg-orange-600',
    danger: 'bg-red-600',
    info: 'bg-blue-600',
  };

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {dot && <span className={`${dotSizes[size]} ${dotColors[variant]} rounded-full`}></span>}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
