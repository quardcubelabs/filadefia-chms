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
    default: 'bg-tag-gray-100 text-tag-gray-800 border-tag-gray-200',
    primary: 'bg-tag-red-100 text-tag-red-800 border-tag-red-200',
    success: 'bg-tag-yellow-100 text-tag-yellow-800 border-tag-yellow-300',
    warning: 'bg-orange-100 text-orange-800 border-orange-200',
    danger: 'bg-tag-red-100 text-tag-red-800 border-tag-red-300',
    info: 'bg-tag-blue-100 text-tag-blue-800 border-tag-blue-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };

  const dotColors = {
    default: 'bg-tag-gray-600',
    primary: 'bg-tag-red-600',
    success: 'bg-tag-yellow-600',
    warning: 'bg-orange-600',
    danger: 'bg-tag-red-600',
    info: 'bg-tag-blue-700',
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
