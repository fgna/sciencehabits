import React, { useState, useCallback } from 'react';

interface CompletionButtonProps {
  isCompleted: boolean;
  onToggle: () => void | Promise<void>;
  habitId: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const CompletionButton: React.FC<CompletionButtonProps> = ({
  isCompleted,
  onToggle,
  habitId,
  disabled = false,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState<'completing' | 'uncompleting' | null>(null);

  const handleClick = useCallback(async () => {
    if (disabled || isAnimating) return;

    setIsAnimating(true);
    setAnimationType(isCompleted ? 'uncompleting' : 'completing');

    try {
      await onToggle();
    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
    } finally {
      // Reset animation state after animation completes
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationType(null);
      }, 300);
    }
  }, [disabled, isAnimating, isCompleted, onToggle]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6';
      case 'lg':
        return 'w-8 h-8';
      default:
        return 'w-7 h-7';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 20;
      case 'lg':
        return 28;
      default:
        return 24;
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        className={`
          completion-button
          ${isCompleted ? 'completed' : 'uncompleted'}
          ${isAnimating ? animationType : ''}
          ${getSizeClasses()}
          cursor-pointer transition-all duration-200 ease-in-out
          rounded-full relative group
          hover:scale-105 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          ${className}
        `}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        tabIndex={0}
        role="checkbox"
        aria-checked={isCompleted}
        aria-label={
          isCompleted 
            ? `Mark ${habitId} as incomplete` 
            : `Mark ${habitId} as complete`
        }
        title={isCompleted ? 'Click to undo completion' : 'Click to mark as complete'}
      >
        {isCompleted ? (
          <GreenCheckmarkIcon size={getIconSize()} />
        ) : (
          <EmptyCircleIcon size={getIconSize()} />
        )}
        
        {/* Hover tooltip for completed state */}
        {isCompleted && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200
                         bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
            Click to undo
          </div>
        )}
      </button>

      {showLabel && (
        <span className={`
          text-sm font-medium transition-colors duration-200
          ${isCompleted ? 'text-green-700' : 'text-gray-600'}
          ${disabled ? 'opacity-50' : ''}
        `}>
          {isAnimating ? (
            animationType === 'completing' ? 'Completing...' : 'Undoing...'
          ) : (
            isCompleted ? 'Done!' : 'Complete'
          )}
        </span>
      )}
    </div>
  );
};

interface IconProps {
  size: number;
}

const GreenCheckmarkIcon: React.FC<IconProps> = ({ size }) => (
  <div className="checkmark-icon">
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#22c55e" className="drop-shadow-sm" />
      <path 
        d="M9 12l2 2 4-4" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const EmptyCircleIcon: React.FC<IconProps> = ({ size }) => (
  <div className="empty-circle-icon">
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="#d1d5db" 
        strokeWidth="2"
        fill="transparent"
        className="group-hover:stroke-green-400 transition-colors duration-200"
      />
      {/* Inner circle that appears on hover */}
      <circle
        cx="12"
        cy="12"
        r="6"
        fill="transparent"
        className="opacity-0 group-hover:opacity-20 group-hover:fill-green-400 transition-all duration-200"
      />
    </svg>
  </div>
);