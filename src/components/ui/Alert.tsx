import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const variants = {
    info: {
      container: 'bg-tag-blue-50 border-tag-blue-200 text-tag-blue-800',
      icon: <Info className="h-5 w-5 text-tag-blue-700" />,
      title: 'text-tag-blue-900',
    },
    success: {
      container: 'bg-tag-green-50 border-tag-green-300 text-tag-green-800',
      icon: <CheckCircle className="h-5 w-5 text-tag-green-600" />,
      title: 'text-tag-green-900',
    },
    warning: {
      container: 'bg-orange-50 border-orange-200 text-orange-800',
      icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
      title: 'text-orange-900',
    },
    error: {
      container: 'bg-tag-red-50 border-tag-red-200 text-tag-red-800',
      icon: <XCircle className="h-5 w-5 text-tag-red-600" />,
      title: 'text-tag-red-900',
    },
  };

  const config = variants[variant];

  return (
    <div className={`border rounded-xl p-4 ${config.container} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-semibold mb-1 ${config.title}`}>
              {title}
            </h3>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-3 text-tag-gray-400 hover:text-tag-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

Alert.displayName = 'Alert';
