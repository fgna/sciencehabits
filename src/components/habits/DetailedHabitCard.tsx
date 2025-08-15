import React, { useState } from 'react';
import { Habit, Progress } from '../../types';
import { Card } from '../ui/Card';

interface DetailedHabitCardProps {
  habit: Habit;
  progress?: Progress;
  onComplete: (habitId: string) => void;
  onSkip?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
  onViewResearch?: (habitId: string) => void;
  isCompleted: boolean;
  showActions?: boolean;
  onEdit?: () => void;
}

export const DetailedHabitCard: React.FC<DetailedHabitCardProps> = ({
  habit,
  progress,
  onComplete,
  onSkip,
  onDelete,
  onViewResearch,
  isCompleted,
  showActions = false,
  onEdit
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const hasResearch = habit.researchIds && habit.researchIds.length > 0;
  
  // Parse instructions into numbered steps
  const instructionSteps = habit.instructions
    .split('\n')
    .filter(step => step.trim())
    .map(step => step.replace(/^\d+\.\s*/, '').trim());
  
  const handleToggleComplete = () => {
    onComplete(habit.id);
  };

  return (
    <Card className={`transition-all duration-200 ${
      isCompleted ? 'bg-green-50 border-green-200' : 'hover:shadow-md bg-white'
    }`}>
      <div className="p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4">
          {/* Left side - Completion + Title + Duration */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Completion Checkbox */}
            <button
              onClick={handleToggleComplete}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
              }`}
              aria-label={`${isCompleted ? 'Mark incomplete' : 'Complete'} ${habit.title}`}
            >
              {isCompleted && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            {/* Habit Title and Duration */}
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${
                isCompleted ? 'text-green-900' : 'text-gray-900'
              }`}>
                {habit.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500">{habit.timeMinutes} min</span>
                {habit.difficulty && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {habit.difficulty}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="space-y-4">
            {/* Description */}
            {habit.description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {habit.description}
              </p>
            )}

            {/* Instructions Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">How to do it:</h4>
              <ol className="space-y-2">
                {instructionSteps.map((step, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700 leading-relaxed">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Why it Works Section - if available from description or research */}
            {habit.description && habit.description.length > 100 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Why it works:</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {habit.description}
                </p>
              </div>
            )}

            {/* Research Section */}
            {hasResearch && onViewResearch && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <button
                  onClick={() => onViewResearch(habit.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 hover:underline"
                >
                  <span>🔬</span>
                  <span>View Research &amp; Science</span>
                </button>
                <span className="text-xs text-gray-500">
                  {habit.researchIds.length} studies
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {/* Skip Button - only for incomplete habits */}
            {!isCompleted && onSkip && (
              <button
                onClick={() => onSkip(habit.id)}
                className="text-sm px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                Skip Today
              </button>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {showActions && (
              <>
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="text-sm px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(habit.id)}
                    className="text-sm px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};