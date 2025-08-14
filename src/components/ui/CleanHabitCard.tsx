import React from 'react';
import { Habit } from '../../types';
import { Progress } from '../../types';
import { Card } from './Card';

interface CleanHabitCardProps {
  habit: Habit;
  progress?: Progress;
  onComplete: (habitId: string) => void;
  onViewResearch?: (habitId: string) => void;
  isCompleted: boolean;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const CleanHabitCard: React.FC<CleanHabitCardProps> = ({
  habit,
  progress,
  onComplete,
  onViewResearch,
  isCompleted,
  showActions,
  onEdit,
  onDelete
}) => {
  const hasResearch = habit.researchIds && habit.researchIds.length > 0;
  
  return (
    <Card className={`transition-all ${isCompleted ? 'bg-green-50 border-green-200' : 'hover:shadow-md'}`}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          {/* Left side - Habit info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className={`text-lg font-semibold ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                {habit.title}
              </h3>
            </div>
            
            {/* View Details link - small and subtle */}
            {hasResearch && onViewResearch && (
              <button 
                onClick={() => onViewResearch(habit.id)}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                📚 View Details
              </button>
            )}
          </div>

          {/* Right side - Action button */}
          <div className="ml-4 flex items-center space-x-2">
            {/* Edit/Delete actions for custom habits */}
            {showActions && (
              <>
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="text-xs px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
            
            {/* Completion status - matching Today page design */}
            {isCompleted ? (
              <div className="flex items-center space-x-2 text-green-600 bg-green-100 px-4 py-2 rounded-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Done!</span>
              </div>
            ) : (
              <button
                onClick={() => onComplete(habit.id)}
                className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-green-500 flex items-center justify-center transition-colors"
                aria-label={`Complete ${habit.title}`}
              >
                <span className="text-gray-400 hover:text-green-500">○</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};