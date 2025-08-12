import React, { useState } from 'react';
import { Habit, HabitProgress } from '../../types';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { smartSchedulingService, ContextualHint, AdaptiveRecommendation } from '../../services/smartSchedulingService';

interface EnhancedHabitCardProps {
  habit: Habit;
  progress?: HabitProgress;
  isCompleted: boolean;
  onToggle: (habitId: string) => void;
  onEdit?: (habitId: string) => void;
  contextualHint?: ContextualHint;
  adaptiveRecommendation?: AdaptiveRecommendation;
  stackInfo?: {
    stackName: string;
    position: number;
    totalInStack: number;
  };
}

interface MotivationLevel {
  level: 'low' | 'medium' | 'high';
  message: string;
  color: string;
  icon: string;
}

export function EnhancedHabitCard({ 
  habit, 
  progress, 
  isCompleted, 
  onToggle, 
  onEdit,
  contextualHint,
  adaptiveRecommendation,
  stackInfo
}: EnhancedHabitCardProps) {
  const { animationsEnabled, emotionalDesign } = useUIPreferencesStore();
  const [showDetails, setShowDetails] = useState(false);
  const [showResearch, setShowResearch] = useState(false);

  // Calculate motivation level based on recent progress
  const getMotivationLevel = (): MotivationLevel => {
    if (!progress) {
      return {
        level: 'medium',
        message: 'Ready to start building this habit!',
        color: 'progress',
        icon: '🚀'
      };
    }

    // Simplified calculation - in real app would use more data
    const recentStreak = progress.currentStreak || 0;
    
    if (recentStreak >= 7) {
      return {
        level: 'high',
        message: `Amazing ${recentStreak}-day streak! You're on fire! 🔥`,
        color: 'compassion',
        icon: '🏆'
      };
    } else if (recentStreak >= 3) {
      return {
        level: 'medium',
        message: `Great momentum with ${recentStreak} days!`,
        color: 'progress',
        icon: '📈'
      };
    } else {
      return {
        level: 'low',
        message: 'Every expert was once a beginner. You\'ve got this!',
        color: 'recovery',
        icon: '💪'
      };
    }
  };

  const motivationLevel = getMotivationLevel();

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'health': return '💪';
      case 'mindfulness': return '🧘‍♀️';
      case 'productivity': return '🚀';
      case 'learning': return '📚';
      case 'creativity': return '🎨';
      default: return '⭐';
    }
  };

  const getCardStyles = () => {
    const baseStyles = `
      relative p-6 rounded-xl border-2 transition-all duration-300
      ${animationsEnabled ? 'transform hover:scale-[1.02] hover:shadow-lg' : ''}
    `;

    if (isCompleted) {
      return `${baseStyles} bg-compassion-50 border-compassion-300 shadow-md`;
    }

    if (emotionalDesign === 'compassionate') {
      return `${baseStyles} bg-white border-gray-200 hover:border-${motivationLevel.color}-300 card-compassionate`;
    }

    return `${baseStyles} bg-white border-gray-200 hover:border-gray-300`;
  };

  return (
    <div className={getCardStyles()}>
      {/* Stack indicator */}
      {stackInfo && (
        <div className="absolute top-2 left-2 flex items-center space-x-1">
          <div className="w-2 h-2 bg-progress-400 rounded-full"></div>
          <span className="text-xs text-progress-600 font-medium">
            {stackInfo.stackName} ({stackInfo.position}/{stackInfo.totalInStack})
          </span>
        </div>
      )}

      {/* Completion status */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => onToggle(habit.id)}
          className={`
            w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200
            ${isCompleted 
              ? 'bg-compassion-500 border-compassion-500 text-white' 
              : 'border-gray-300 hover:border-compassion-400 hover:bg-compassion-50'
            }
            ${animationsEnabled && isCompleted ? 'animate-gentle-bounce' : ''}
          `}
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="pr-12">
        <div className="flex items-start mb-3">
          <div className="text-2xl mr-3 mt-1">
            {habit.icon || getCategoryIcon(habit.category)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-semibold mb-1 ${isCompleted ? 'text-compassion-800' : 'text-gray-900'}`}>
              {habit.title}
            </h3>
            <p className={`text-sm ${isCompleted ? 'text-compassion-600' : 'text-gray-600'}`}>
              {habit.description}
            </p>
          </div>
        </div>

        {/* Habit metadata */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-xs text-gray-500">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {habit.timeMinutes || 10} min
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
              {habit.category}
            </div>
          </div>
          
          {habit.researchBacked && (
            <button
              onClick={() => setShowResearch(!showResearch)}
              className="flex items-center text-xs text-research-600 hover:text-research-700 transition-colors"
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
              </svg>
              Research
            </button>
          )}
        </div>

        {/* Motivation level */}
        <div className={`p-3 rounded-lg border bg-${motivationLevel.color}-50 border-${motivationLevel.color}-200 mb-4`}>
          <div className="flex items-center">
            <span className="text-lg mr-2">{motivationLevel.icon}</span>
            <p className={`text-sm font-medium text-${motivationLevel.color}-800`}>
              {motivationLevel.message}
            </p>
          </div>
        </div>

        {/* Contextual hint */}
        {contextualHint && (
          <div className="bg-progress-50 border border-progress-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <div className="text-progress-600 mr-2 mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-progress-800 mb-1">
                  {contextualHint.context.charAt(0).toUpperCase() + contextualHint.context.slice(1)} Tip
                </h4>
                <p className="text-sm text-progress-700">
                  {contextualHint.hint}
                </p>
                {contextualHint.researchBacked && (
                  <div className="mt-1 flex items-center text-xs text-progress-600">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Research-backed
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Adaptive recommendation */}
        {adaptiveRecommendation && (
          <div className="bg-research-50 border border-research-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <div className="text-research-600 mr-2 mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-research-800 mb-1">
                  Smart Suggestion
                </h4>
                <p className="text-sm text-research-700 mb-1">
                  {adaptiveRecommendation.message}
                </p>
                <p className="text-xs text-research-600">
                  {adaptiveRecommendation.reasoning}
                </p>
                <div className="mt-2 flex items-center text-xs text-research-600">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    adaptiveRecommendation.confidence > 0.8 ? 'bg-compassion-500' :
                    adaptiveRecommendation.confidence > 0.6 ? 'bg-progress-500' : 'bg-recovery-500'
                  }`}></div>
                  {Math.round(adaptiveRecommendation.confidence * 100)}% confidence
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Research info - collapsible */}
        {showResearch && habit.researchBacked && (
          <div className={`bg-research-50 border border-research-200 rounded-lg p-3 mb-4 ${
            animationsEnabled ? 'animate-fade-in' : ''
          }`}>
            <h4 className="text-sm font-semibold text-research-800 mb-2">
              Scientific Foundation
            </h4>
            <p className="text-sm text-research-700 mb-2">
              {habit.researchSummary || 'This habit is supported by peer-reviewed research showing measurable benefits for health and wellbeing.'}
            </p>
            {habit.researchCitations && habit.researchCitations.length > 0 && (
              <div className="text-xs text-research-600">
                <strong>Key studies:</strong> {habit.researchCitations.map(c => c.authors).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {showDetails ? 'Hide' : 'Show'} details
          </button>
          
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(habit.id)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                aria-label="Edit habit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Extended details - collapsible */}
        {showDetails && (
          <div className={`mt-4 pt-4 border-t border-gray-200 ${
            animationsEnabled ? 'animate-fade-in' : ''
          }`}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Progress</h5>
                <div className="space-y-1 text-gray-600">
                  <div>Current streak: {progress?.currentStreak || 0} days</div>
                  <div>Best streak: {progress?.bestStreak || 0} days</div>
                  <div>Total completions: {progress?.totalCompletions || 0}</div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Details</h5>
                <div className="space-y-1 text-gray-600">
                  <div>Difficulty: {habit.difficulty || 'Medium'}</div>
                  <div>Frequency: {typeof habit.frequency === 'string' ? habit.frequency : habit.frequency?.type || 'Daily'}</div>
                  <div>Created: {habit.createdAt ? new Date(habit.createdAt).toLocaleDateString() : 'Recently'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}