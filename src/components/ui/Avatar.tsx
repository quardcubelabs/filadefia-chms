import React from 'react';
import { User } from 'lucide-react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'circle' | 'rounded';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  variant = 'circle',
  status,
  className = '',
}) => {
  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-2xl',
  };

  const statusSizes = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-orange-500',
    busy: 'bg-red-500',
  };

  const roundedClass = variant === 'circle' ? 'rounded-full' : 'rounded-xl';

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizes[size]} ${roundedClass} bg-gradient-to-br from-fcc-blue-500 to-fcc-blue-600 flex items-center justify-center text-white font-semibold overflow-hidden`}
      >
        {src ? (
          <img src={src} alt={alt || name || 'Avatar'} className="h-full w-full object-cover" />
        ) : name ? (
          <span>{getInitials(name)}</span>
        ) : (
          <User className="h-2/3 w-2/3" />
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizes[size]} ${statusColors[status]} ${roundedClass} border-2 border-white`}
        />
      )}
    </div>
  );
};

Avatar.displayName = 'Avatar';

export interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    alt?: string;
    name?: string;
  }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 3,
  size = 'md',
  className = '',
}) => {
  const displayAvatars = avatars.slice(0, max);
  const remaining = Math.max(0, avatars.length - max);

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {displayAvatars.map((avatar, index) => (
        <div key={index} className="ring-2 ring-white rounded-full">
          <Avatar
            src={avatar.src}
            alt={avatar.alt}
            name={avatar.name}
            size={size}
          />
        </div>
      ))}
      {remaining > 0 && (
        <div className="ring-2 ring-white rounded-full">
          <div
            className={`${
              size === 'xs'
                ? 'h-6 w-6 text-xs'
                : size === 'sm'
                ? 'h-8 w-8 text-sm'
                : size === 'md'
                ? 'h-10 w-10 text-base'
                : size === 'lg'
                ? 'h-12 w-12 text-lg'
                : 'h-16 w-16 text-2xl'
            } rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold`}
          >
            +{remaining}
          </div>
        </div>
      )}
    </div>
  );
};

AvatarGroup.displayName = 'AvatarGroup';
