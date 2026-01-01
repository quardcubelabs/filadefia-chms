import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  rounded?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', padding = 'md', hover = false, rounded = '2xl', className = '', ...props }, ref) => {
    const baseStyles = 'transition-all duration-200';
    
    const roundedStyles = {
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      '3xl': 'rounded-3xl',
    };
    
    const variants = {
      default: 'bg-white border border-gray-200 shadow-sm',
      gradient: 'bg-gradient-to-br from-red-50 via-white to-blue-50 border border-gray-200 shadow-md',
      bordered: 'bg-white border-2 border-red-200',
      elevated: 'bg-white shadow-lg border border-gray-100',
    };

    const paddings = {
      none: '',
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-5 md:p-6',
      lg: 'p-5 sm:p-6 md:p-8',
    };

    const hoverClass = hover ? 'hover:shadow-xl hover:border-red-300 hover:-translate-y-1 cursor-pointer active:scale-[0.98]' : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${roundedStyles[rounded]} ${variants[variant]} ${paddings[padding]} ${hoverClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action, className = '', ...props }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 mb-4 sm:mb-6 ${className}`} {...props}>
      <div className="min-w-0 flex-1">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h3>
        {subtitle && <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

CardHeader.displayName = 'CardHeader';

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

CardBody.displayName = 'CardBody';

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return (
    <div className={`mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
};

CardFooter.displayName = 'CardFooter';
