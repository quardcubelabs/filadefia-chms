'use client';

import React from 'react';
import { Inbox, FileQuestion } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4 p-4 rounded-full bg-gray-100">
        {icon || <Inbox className="h-12 w-12 text-gray-400" />}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
      {description && <p className="text-sm max-w-sm mb-6 text-gray-600">{description}</p>}
      {action && (
        <Button onClick={action.onClick} icon={action.icon}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';

export interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ text, size = 'md', className = '' }) => {
  const sizes = {
    sm: { container: 'h-12 w-12', wrapper: 'py-2' },
    md: { container: 'h-24 w-24', wrapper: 'py-6' },
    lg: { container: 'h-36 w-36', wrapper: 'py-8' },
  };

  const { container, wrapper } = sizes[size];

  return (
    <div className={`flex flex-col items-center justify-center ${wrapper} ${className}`}>
      <div className={container}>
        <DotLottieReact
          src="https://lottie.host/0f253b21-4a3e-4100-bb40-dabc430f558e/sMdR60noD2.lottie"
          loop
          autoplay
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {text && <p className="text-sm text-gray-600 mt-2">{text}</p>}
    </div>
  );
};

Loading.displayName = 'Loading';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4 p-4 rounded-full bg-red-100">
        <FileQuestion className="h-12 w-12 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-sm max-w-sm mb-6 text-gray-600">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="primary">
          Try Again
        </Button>
      )}
    </div>
  );
};

ErrorState.displayName = 'ErrorState';
