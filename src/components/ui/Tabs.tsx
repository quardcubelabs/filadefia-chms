import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
}

interface TabProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'rounded' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Tabs: React.FC<TabProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const getVariantStyles = (isActive: boolean) => {
    const baseStyles = 'relative flex items-center gap-2 font-medium transition-all duration-200';
    
    switch (variant) {
      case 'rounded':
        return `${baseStyles} px-4 py-2 rounded-xl ${
          isActive
            ? 'bg-red-100 border border-red-600 text-red-700 shadow-md'
            : 'bg-white text-gray-700 hover:bg-red-100 hover:text-red-600 border border-transparent'
        }`;
      
      case 'underline':
        return `${baseStyles} py-3 px-4 ${
          isActive
            ? 'bg-red-100 text-red-600 rounded-tl-lg'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`;
      
      default:
        return `${baseStyles} py-3 px-4 ${
          isActive
            ? 'bg-red-100 text-red-600 rounded-tl-lg'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-sm gap-1.5';
      case 'lg':
        return 'text-lg gap-2.5';
      default:
        return 'text-base gap-2';
    }
  };

  return (
    <div className={`flex ${variant === 'rounded' ? 'gap-2' : 'space-x-0'} ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`${getVariantStyles(activeTab === tab.id)} ${getSizeStyles()}`}
        >
          {tab.icon && <tab.icon className="h-4 w-4" />}
          <span>{tab.label}</span>
          {tab.badge && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === tab.id 
                ? 'bg-white text-red-600' 
                : 'bg-red-100 text-red-700'
            }`}>
              {tab.badge > 99 ? '99+' : tab.badge}
            </span>
          )}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;