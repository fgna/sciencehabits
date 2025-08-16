/**
 * Multilingual Habit Recommendations Component
 * 
 * Displays science-backed habit recommendations with full multilingual support.
 * Integrates with existing app architecture and mobile-first design.
 */

import React, { useState, useEffect } from 'react';
import { useMultilingualRecommendations } from '../../hooks/useMultilingualRecommendations';
import { useTranslation } from '../../hooks/useTranslation';
import { useLanguage } from '../../hooks/useLanguage';
import { MultilingualHabit } from '../../types/localization';
import { Button, Card } from '../ui';
import { MultilingualHabitDetailModal } from './MultilingualHabitDetailModal';

interface MultilingualHabitRecommendationsProps {
  selectedGoals?: ('better_sleep' | 'get_moving' | 'feel_better')[];
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  timeAvailable?: number;
  currentHabits?: string[];
  onHabitSelect?: (habit: MultilingualHabit) => void;
  className?: string;
}

export function MultilingualHabitRecommendations({
  selectedGoals = ['better_sleep', 'get_moving', 'feel_better'],
  userLevel = 'beginner',
  timeAvailable,
  currentHabits = [],
  onHabitSelect,
  className = ''
}: MultilingualHabitRecommendationsProps) {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

  // Fallback labels for missing translations
  const labels = {
    forYou: t('habits.forYou') || 'For You',
    byCategory: t('habits.byCategory') || 'By Category',
    topRated: t('habits.topRated') || 'Top Rated',
    loading: t('common.loading') || 'Loading...',
    tryAgain: t('common.tryAgain') || 'Try Again',
    scienceBackedHabits: t('habits.scienceBackedHabits') || 'Science-Backed Habits',
    researchBasedRecommendations: t('habits.researchBasedRecommendations') || 'Evidence-based recommendations for your goals',
    personalizedForYou: t('habits.personalizedForYou') || 'Personalized For You',
    totalTime: t('habits.totalTime') || 'Total Time',
    minutes: t('common.minutes') || 'minutes',
    recommendations: t('habits.recommendations') || 'recommendations',
    alternativeOptions: t('habits.alternativeOptions') || 'Alternative Options',
    topRatedHabits: t('habits.topRatedHabits') || 'Top Rated Habits',
    topChoice: t('habits.topChoice') || 'Top Choice',
    researchBacked: t('habits.researchBacked') || 'Research Backed',
    addHabit: t('habits.addHabit') || 'Add Habit',
    viewResearch: t('habits.viewResearch') || 'View Research',
    betterSleep: t('goals.betterSleep') || 'Better Sleep',
    getMoving: t('goals.getMoving') || 'Get Moving',
    feelBetter: t('goals.feelBetter') || 'Feel Better'
  };
  const {
    recommendations,
    isLoading,
    error,
    getRecommendations,
    categoryRankings,
    topHabits
  } = useMultilingualRecommendations();

  const [selectedHabit, setSelectedHabit] = useState<MultilingualHabit | null>(null);
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [viewMode, setViewMode] = useState<'recommendations' | 'category' | 'top'>('recommendations');

  // Load recommendations on mount or when parameters change
  useEffect(() => {
    const loadRecommendations = async () => {
      // Cast to multilingual language type (only EN/DE supported for multilingual content)
      const multilingualLanguage = (currentLanguage === 'de' ? 'de' : 'en') as 'en' | 'de';
      
      await getRecommendations({
        goalCategories: selectedGoals,
        language: multilingualLanguage,
        userLevel,
        timeAvailable,
        currentHabits
      });
    };

    loadRecommendations();
  }, [selectedGoals, currentLanguage, userLevel, timeAvailable, currentHabits, getRecommendations]);

  const handleHabitClick = (habit: MultilingualHabit) => {
    setSelectedHabit(habit);
    if (onHabitSelect) {
      onHabitSelect(habit);
    }
  };

  const handleResearchClick = (habit: MultilingualHabit) => {
    setSelectedHabit(habit);
    setShowResearchModal(true);
  };

  const getGoalCategoryDisplayName = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'better_sleep': labels.betterSleep,
      'get_moving': labels.getMoving, 
      'feel_better': labels.feelBetter
    };
    return categoryMap[category] || category;
  };

  const getEffectivenessColor = (score: number): string => {
    if (score >= 9.0) return 'text-green-600 bg-green-50';
    if (score >= 8.0) return 'text-blue-600 bg-blue-50';
    if (score >= 7.0) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const renderHabitCard = (habit: MultilingualHabit, showCategory: boolean = true) => {
    const translation = habit.translations[currentLanguage as 'en' | 'de'] || habit.translations.en;
    const isSelected = selectedHabit?.id === habit.id;

    return (
      <Card
        key={habit.id}
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        }`}
      >
        <div 
          className="p-4"
          onClick={() => handleHabitClick(habit)}
        >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                {translation.title}
              </h3>
              {showCategory && (
                <p className="text-xs text-gray-500 mt-1">
                  {getGoalCategoryDisplayName(habit.goalCategory)} • {translation.category}
                </p>
              )}
            </div>
            
            {/* Effectiveness score */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getEffectivenessColor(habit.effectivenessScore)}`}>
              <span>⭐</span>
              <span>{habit.effectivenessScore.toFixed(1)}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {translation.description}
          </p>

          {/* Quick info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <span>⏱️ {translation.timeToComplete}</span>
              <span>📈 {translation.difficultyLevel}</span>
              {habit.isPrimaryRecommendation && (
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                  {labels.topChoice}
                </span>
              )}
            </div>
          </div>

          {/* Research effectiveness */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-700 font-medium mb-1">
              {labels.researchBacked}
            </p>
            <p className="text-xs text-gray-600">
              {translation.researchEffectiveness}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="primary"
              size="sm"
              className="flex-1 text-xs py-2"
              onClick={(e) => {
                e.stopPropagation();
                handleHabitClick(habit);
              }}
            >
              {labels.addHabit}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="text-xs py-2"
              onClick={(e) => {
                e.stopPropagation();
                handleResearchClick(habit);
              }}
            >
              {labels.viewResearch}
            </Button>
          </div>
        </div>
        </div>
      </Card>
    );
  };

  const renderViewSelector = () => (
    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
      {[
        { id: 'recommendations', label: labels.forYou },
        { id: 'category', label: labels.byCategory },
        { id: 'top', label: labels.topRated }
      ].map((view) => (
        <button
          key={view.id}
          onClick={() => setViewMode(view.id as any)}
          className={`flex-1 text-xs font-medium py-2 px-3 rounded-md transition-colors ${
            viewMode === view.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {view.label}
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">{labels.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 mb-4 text-4xl">⚠️</div>
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => getRecommendations({
              goalCategories: selectedGoals,
              language: (currentLanguage === 'de' ? 'de' : 'en') as 'en' | 'de',
              userLevel,
              timeAvailable,
              currentHabits
            })}
          >
            {labels.tryAgain}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-gray-900">
          {labels.scienceBackedHabits}
        </h2>
        <p className="text-sm text-gray-600">
          {labels.researchBasedRecommendations}
        </p>
      </div>

      {/* View selector */}
      {renderViewSelector()}

      {/* Content based on view mode */}
      {viewMode === 'recommendations' && recommendations && (
        <div className="space-y-4">
          {/* Personalized recommendations */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              {labels.personalizedForYou}
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              {recommendations.reasoning}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
              <div>⏱️ {labels.totalTime}: {recommendations.estimatedTimeCommitment} {labels.minutes}</div>
              <div>🎯 {recommendations.primaryRecommendations.length} {labels.recommendations}</div>
            </div>
          </div>

          {/* Primary recommendations */}
          <div className="space-y-3">
            {recommendations.primaryRecommendations.map(habit => renderHabitCard(habit, true))}
          </div>

          {/* Alternative options */}
          {recommendations.alternativeOptions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 text-sm border-t pt-4">
                {labels.alternativeOptions}
              </h3>
              {recommendations.alternativeOptions.slice(0, 3).map(habit => renderHabitCard(habit, true))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'category' && (
        <div className="space-y-4">
          {categoryRankings.map(ranking => (
            <div key={ranking.goalCategory} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {getGoalCategoryDisplayName(ranking.goalCategory)}
                </h3>
                <div className="text-xs text-gray-500">
                  {ranking.averageEffectiveness.toFixed(1)}/10 ⭐
                </div>
              </div>
              {ranking.topThreeHabits.map(habit => renderHabitCard(habit, false))}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'top' && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">
            {labels.topRatedHabits}
          </h3>
          {topHabits.slice(0, 6).map(habit => renderHabitCard(habit, true))}
        </div>
      )}

      {/* Research Modal */}
      {showResearchModal && selectedHabit && (
        <MultilingualHabitDetailModal
          habit={selectedHabit}
          isOpen={showResearchModal}
          onClose={() => setShowResearchModal(false)}
          onAddHabit={onHabitSelect}
        />
      )}
    </div>
  );
}