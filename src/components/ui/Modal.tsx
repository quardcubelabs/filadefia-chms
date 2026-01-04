'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    full: 'sm:max-w-full sm:mx-4',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto scrollbar-hide">
      {/* Overlay - Shows blurry background of current page */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-md transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div 
          className={`relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-300 w-full ${sizes[size]} transform transition-all max-h-[95vh] sm:max-h-[85vh] flex flex-col overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || description) && (
            <div className="px-4 sm:px-6 py-3 sm:py-5 border-b border-gray-200 flex-shrink-0 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="pr-10 sm:pr-8 flex-1 min-w-0">
                  {title && <h3 className="text-base sm:text-xl font-semibold text-gray-900 truncate">{title}</h3>}
                  {description && <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-600 line-clamp-2">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 text-gray-500 hover:text-red-600 transition-colors p-1.5 sm:p-2 hover:bg-red-50 rounded-lg flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 bg-white scrollbar-hide">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-100 border-t border-gray-200 rounded-b-2xl sm:rounded-b-2xl flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Modal.displayName = 'Modal';

// Confirmation Modal Component
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex flex-col-reverse sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            {cancelText}
          </Button>
          <Button 
            variant={variant} 
            onClick={onConfirm}
            loading={loading}
            className="w-full sm:w-auto"
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <p className="text-sm sm:text-base text-gray-700">{message}</p>
    </Modal>
  );
};

ConfirmModal.displayName = 'ConfirmModal';
