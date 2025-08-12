/**
 * Badge Component
 * 
 * Displays individual milestone badges with progress indication,
 * rarity styling, and research explanations. Supports different
 * sizes and interaction states.
 */

import React from 'react';
import { Badge, UserBadge } from '../../types';

interface BadgeProps {
  badge: Badge;
  userBadge?: UserBadge;
  progress: number;
  isEarned: boolean;
  isNew?: boolean;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  onClick?: () => void;
  className?: string;
}

export const BadgeComponent: React.FC<BadgeProps> = ({
  badge,
  userBadge,
  progress,
  isEarned,
  isNew = false,
  size = 'medium',
  showProgress = true,
  onClick,
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
  };
  
  const iconSizes = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl'
  };
  
  const rarityColors = {
    common: 'border-gray-300 bg-gray-50 text-gray-600',
    uncommon: 'border-green-300 bg-green-50 text-green-600',
    rare: 'border-blue-300 bg-blue-50 text-blue-600',
    legendary: 'border-purple-300 bg-purple-50 text-purple-600'
  };
  
  const earnedColors = {
    common: 'border-gray-400 bg-gray-100 text-gray-800',
    uncommon: 'border-green-400 bg-green-100 text-green-800',
    rare: 'border-blue-400 bg-blue-100 text-blue-800',
    legendary: 'border-purple-400 bg-purple-100 text-purple-800'
  };
  
  const colors = isEarned ? earnedColors[badge.rarity] : rarityColors[badge.rarity];
  
  return (
    <div className="relative group">
      <div 
        className={`relative ${sizeClasses[size]} ${colors}
                    border-2 rounded-full flex flex-col items-center justify-center
                    ${isEarned ? 'opacity-100' : 'opacity-60'}
                    ${onClick ? 'cursor-pointer hover:scale-105' : ''}
                    ${isNew ? 'ring-2 ring-yellow-400 ring-offset-2 animate-pulse' : ''}
                    transition-all duration-200 ${className}`}
        onClick={onClick}
      >
        {/* New Badge Indicator */}
        {isNew && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
        )}
        
        {/* Badge Icon */}
        <div className={iconSizes[size]}>{badge.icon}</div>
        
        {/* Progress Ring for Unearned Badges */}
        {!isEarned && showProgress && progress > 0 && (
          <div className="absolute inset-0 rounded-full">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${progress * 2.83} 283`}
                className="text-current opacity-40"
              />
            </svg>
          </div>
        )}
        
        {/* Earned Checkmark */}
        {isEarned && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
            ✓
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap max-w-48">
          <div className="font-medium">{badge.name}</div>
          <div className="text-gray-300 mt-1">{badge.description}</div>
          {!isEarned && progress > 0 && (
            <div className="text-yellow-300 mt-1">{Math.round(progress)}% complete</div>
          )}
          {isEarned && userBadge && (
            <div className="text-green-300 mt-1">
              Earned {new Date(userBadge.earnedAt).toLocaleDateString()}
            </div>
          )}
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};