import React, { useState } from 'react';

interface MinimalHabitCardProps {
  habit: {
    id: string;
    title: string;
    duration: string;
    isCompleted: boolean;
    instructions?: string;
    whyEffective?: string;
  };
  onComplete: (habitId: string) => void;
  onSkip?: (habitId: string) => void;
  onViewResearch?: (habitId: string) => void;
}

export function MinimalHabitCard({ habit, onComplete, onSkip, onViewResearch }: MinimalHabitCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="border-b border-gray-100">
      <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="flex items-center flex-1">
          <button
            onClick={() => onComplete(habit.id)}
            className={`
              w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all
              ${habit.isCompleted 
                ? 'bg-green-500 border-green-500' 
                : 'border-gray-300 hover:border-blue-500'
              }
            `}
            aria-label={`Mark ${habit.title} as ${habit.isCompleted ? 'incomplete' : 'complete'}`}
          >
            {habit.isCompleted && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          
          <div className="flex-1">
            <h3 className={`
              font-medium 
              ${habit.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}
            `}>
              {habit.title}
            </h3>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">{habit.duration}</span>
          
          {/* Details toggle button */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            aria-label={`${showDetails ? 'Hide' : 'Show'} details for ${habit.title}`}
          >
            {showDetails ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          
          {!habit.isCompleted && onSkip && (
            <button
              onClick={() => onSkip(habit.id)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={`Skip ${habit.title} for today`}
            >
              Skip
            </button>
          )}
        </div>
      </div>
      
      {/* Expandable details section */}
      {showDetails && (
        <div className="px-6 pb-4 bg-gray-50">
          {habit.instructions && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-900 mb-1">How to do it:</h4>
              <p className="text-sm text-gray-700">{habit.instructions}</p>
            </div>
          )}
          
          {habit.whyEffective && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Why it works:</h4>
              <p className="text-sm text-gray-700">{habit.whyEffective}</p>
            </div>
          )}
          
          {/* Research link */}
          {onViewResearch && (
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={() => onViewResearch(habit.id)}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                View Research & Science
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}