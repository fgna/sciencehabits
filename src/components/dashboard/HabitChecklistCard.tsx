import React, { useState } from 'react';
import { Habit, Progress } from '../../types';
import { useUserStore } from '../../stores/userStore';
import { useCurrentDate } from '../../hooks/useCurrentDate';
import { useResearch } from '../../contexts/ResearchContext';
import { Card, Button } from '../ui';

interface HabitChecklistCardProps {
  habit: Habit;
  progress?: Progress;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function HabitChecklistCard({ habit, progress, showActions, onEdit, onDelete }: HabitChecklistCardProps) {
  const { updateUserProgress } = useUserStore();
  const { today, isToday } = useCurrentDate();
  const [isCompleting, setIsCompleting] = useState(false);

  const isCompletedToday = progress?.completions.includes(today) || false;
  const currentStreak = progress?.currentStreak || 0;
  const longestStreak = progress?.longestStreak || 0;

  const handleComplete = async () => {
    if (isCompleting || isCompletedToday) return;

    setIsCompleting(true);
    try {
      await updateUserProgress(habit.id);
    } catch (error) {
      console.error('Failed to complete habit:', error);
    } finally {
      setIsCompleting(false);
    }
  };


  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      // New difficulty levels
      trivial: 'text-blue-600 bg-blue-100',
      easy: 'text-green-600 bg-green-100',
      moderate: 'text-yellow-600 bg-yellow-100',
      // Legacy levels
      beginner: 'text-green-600 bg-green-100',
      intermediate: 'text-yellow-600 bg-yellow-100',
      advanced: 'text-red-600 bg-red-100'
    };
    return colors[difficulty as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  return (
    <Card className={`transition-all ${isCompletedToday ? 'bg-green-50 border-green-200' : 'hover:shadow-md'}`}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Habit info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className={`text-lg font-semibold ${isCompletedToday ? 'text-green-900' : 'text-gray-900'}`}>
                  {habit.title}
                </h3>
                {/* Effectiveness Score */}
                {habit.effectivenessScore && (
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                    {habit.effectivenessScore}/100
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(habit.difficulty)}`}>
                  {habit.difficulty}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {habit.timeMinutes} min
                </span>
                {/* Cost indicator */}
                {habit.cost && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {habit.cost}
                  </span>
                )}
              </div>

              <p className={`text-sm mb-3 ${isCompletedToday ? 'text-green-800' : 'text-gray-600'}`}>
                {habit.description}
              </p>

              {/* Progress indicators */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">Current streak:</span>
                  <span className={`font-semibold ${currentStreak > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                    {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                  </span>
                  {currentStreak > 0 && <span>🔥</span>}
                </div>
                
                {longestStreak > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500">Best:</span>
                    <span className="font-semibold text-purple-600">
                      {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
                    </span>
                    <span>🏆</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="ml-4">
            {showActions ? (
              <div className="flex space-x-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                  >
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDelete}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                )}
              </div>
            ) : isCompletedToday ? (
              <div className="flex items-center space-x-2 text-green-600 bg-green-100 px-4 py-2 rounded-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Done!</span>
              </div>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isCompleting}
                isLoading={isCompleting}
                className="min-w-[120px]"
              >
                {isCompleting ? 'Completing...' : 'Complete'}
              </Button>
            )}
          </div>
        </div>

        {/* Collapsible instructions */}
        <HabitInstructions 
          instructions={habit.instructions}
          isCompleted={isCompletedToday}
        />
        
        {/* Enhanced details */}
        <HabitEnhancedDetails habit={habit} isCompleted={isCompletedToday} />
      </div>
    </Card>
  );
}

interface HabitInstructionsProps {
  instructions: string;
  isCompleted: boolean;
}

function HabitInstructions({ instructions, isCompleted }: HabitInstructionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Always show instructions section, but hide content when completed unless expanded
  if (!instructions || !instructions.trim()) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <span>{isExpanded ? 'Hide' : 'Show'} instructions</span>
      </button>
      
      {isExpanded && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">How to do this habit:</h4>
          <div className="text-sm text-gray-700 whitespace-pre-line">
            {instructions}
          </div>
        </div>
      )}
    </div>
  );
}

interface HabitEnhancedDetailsProps {
  habit: Habit;
  isCompleted: boolean;
}

function HabitEnhancedDetails({ habit, isCompleted }: HabitEnhancedDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getRelatedArticles } = useResearch();
  
  // Show enhanced details if we have any enhanced data, research links, or research IDs
  const hasEnhancedData = habit.effectivenessScore || habit.evidenceStrength || habit.whyEffective || habit.cost || (habit.researchIds && habit.researchIds.length > 0) || getRelatedArticles(habit.id).length > 0;
  
  if (!hasEnhancedData) {
    return null;
  }

  const getEvidenceColor = (strength?: string) => {
    const colors = {
      'very_high': 'text-green-700 bg-green-100',
      'high': 'text-blue-700 bg-blue-100',
      'moderate': 'text-yellow-700 bg-yellow-100',
      'low': 'text-red-700 bg-red-100'
    };
    return colors[strength as keyof typeof colors] || 'text-gray-700 bg-gray-100';
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <span>{isExpanded ? 'Hide' : 'Show'} details & research</span>
      </button>
      
      {isExpanded && (
        <div className="mt-3 p-4 bg-blue-50 rounded-lg space-y-3">
          {/* Effectiveness and Evidence */}
          <div className="flex flex-wrap items-center gap-2">
            {habit.effectivenessScore && (
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">Effectiveness:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {habit.effectivenessScore}/100
                </span>
              </div>
            )}
            {habit.evidenceStrength && (
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">Evidence:</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getEvidenceColor(habit.evidenceStrength)}`}>
                  {habit.evidenceStrength.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>

          {/* Why Effective */}
          {habit.whyEffective && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Why this works:</h4>
              <p className="text-sm text-gray-700">{habit.whyEffective}</p>
            </div>
          )}

          {/* Cost */}
          {habit.cost && (
            <div className="flex items-center gap-4 pt-2 border-t border-blue-200">
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">💰 Cost:</span>
                <span className="text-sm font-medium text-green-600">{habit.cost}</span>
              </div>
            </div>
          )}

          {/* Research Links */}
          <ResearchLinksSection habit={habit} />
        </div>
      )}
    </div>
  );
}

interface ResearchLinksSectionProps {
  habit: Habit;
}

function ResearchLinksSection({ habit }: ResearchLinksSectionProps) {
  const { getRelatedArticles } = useResearch();
  const relatedArticles = getRelatedArticles(habit.id);

  // Show legacy research IDs if no articles found
  const hasLegacyResearch = habit.researchIds && habit.researchIds.length > 0;
  const hasRelatedArticles = relatedArticles.length > 0;

  if (!hasLegacyResearch && !hasRelatedArticles) {
    return null;
  }

  return (
    <div className="pt-2 border-t border-blue-200">
      <div className="flex items-center space-x-1 mb-2">
        <span className="text-sm text-gray-600">📚 Research:</span>
        {hasRelatedArticles && (
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            {relatedArticles.length} article{relatedArticles.length > 1 ? 's' : ''}
          </span>
        )}
        {hasLegacyResearch && (
          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            {habit.researchIds.length} studies
          </span>
        )}
      </div>
      
      {/* Show related articles */}
      {hasRelatedArticles && (
        <div className="space-y-1">
          {relatedArticles.slice(0, 2).map((article) => (
            <div key={article.id} className="flex items-start space-x-2 text-xs">
              <span className="text-blue-600 mt-0.5">•</span>
              <div className="flex-1">
                <button 
                  onClick={() => {
                    // Scroll to research tab and select this article
                    const event = new CustomEvent('showResearchArticle', { 
                      detail: { articleId: article.id } 
                    });
                    window.dispatchEvent(event);
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:underline text-left"
                >
                  {article.title}
                </button>
                <div className="text-gray-500 mt-0.5">
                  {article.studyDetails.journal} ({article.studyDetails.year})
                </div>
              </div>
            </div>
          ))}
          {relatedArticles.length > 2 && (
            <div className="text-xs text-gray-500 ml-3">
              +{relatedArticles.length - 2} more in Research tab
            </div>
          )}
        </div>
      )}
      
      {/* Fallback message if only legacy research */}
      {!hasRelatedArticles && hasLegacyResearch && (
        <p className="text-xs text-gray-500">View detailed research in the Research tab</p>
      )}
    </div>
  );
}