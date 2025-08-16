/**
 * Multilingual Habit Detail Modal
 * 
 * Displays comprehensive research details for multilingual habits
 * with full localization support.
 */

import React from 'react';
import { MultilingualHabit } from '../../types/localization';
import { useLanguage } from '../../hooks/useLanguage';
import { useTranslation } from '../../hooks/useTranslation';
import { Modal, Button } from '../ui';

interface MultilingualHabitDetailModalProps {
  habit: MultilingualHabit;
  isOpen: boolean;
  onClose: () => void;
  onAddHabit?: (habit: MultilingualHabit) => void;
}

export function MultilingualHabitDetailModal({ 
  habit, 
  isOpen, 
  onClose, 
  onAddHabit 
}: MultilingualHabitDetailModalProps) {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

  // Fallback labels for missing translations
  const labels = {
    topChoice: t('habits.topChoice') || 'Top Choice',
    whatItIs: t('habits.whatItIs') || 'What It Is',
    scientificEvidence: t('research.scientificEvidence') || 'Scientific Evidence',
    keyFindings: t('research.keyFindings') || 'Key Findings',
    effectiveness: t('research.effectiveness') || 'Effectiveness',
    source: t('research.source') || 'Source',
    howItWorks: t('habits.howItWorks') || 'How It Works',
    quickStart: t('habits.quickStart') || 'Quick Start',
    optimalTiming: t('habits.optimalTiming') || 'Optimal Timing',
    category: t('habits.category') || 'Category',
    progressionTips: t('habits.progressionTips') || 'Progression Tips',
    effectivenessRanking: t('habits.effectivenessRanking') || 'Effectiveness Ranking',
    rankingExplanation: t('habits.rankingExplanation') || 'Based on scientific research and effectiveness scores',
    inCategory: t('habits.inCategory') || 'in',
    scientificallyValidated: t('habits.scientificallyValidated') || 'Scientifically Validated',
    researchBackedDescription: t('habits.researchBackedDescription') || 'This habit is backed by peer-reviewed research and evidence-based practices.',
    addThisHabit: t('habits.addThisHabit') || 'Add This Habit',
    copyCitation: t('habits.copyCitation') || 'Copy Citation',
    close: t('common.close') || 'Close'
  };

  if (!isOpen || !habit) return null;

  const translation = habit.translations[currentLanguage as 'en' | 'de'] || habit.translations.en;

  const getEffectivenessColor = (score: number): string => {
    if (score >= 9.0) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 8.0) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 7.0) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getGoalCategoryDisplayName = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'better_sleep': t('goals.betterSleep') || 'Better Sleep',
      'get_moving': t('goals.getMoving') || 'Get Moving', 
      'feel_better': t('goals.feelBetter') || 'Feel Better'
    };
    return categoryMap[category] || category;
  };

  const handleAddHabit = () => {
    if (onAddHabit) {
      onAddHabit(habit);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h2 className="text-2xl font-bold text-gray-900 pr-4">
              {translation.title}
            </h2>
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border font-semibold ${getEffectivenessColor(habit.effectivenessScore)}`}>
              <span>⭐</span>
              <span>{habit.effectivenessScore.toFixed(1)}/10</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center space-x-1">
              <span>🎯</span>
              <span>{getGoalCategoryDisplayName(habit.goalCategory)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>📈</span>
              <span className="capitalize">{translation.difficultyLevel}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>⏱️</span>
              <span>{translation.timeToComplete}</span>
            </span>
            {habit.isPrimaryRecommendation && (
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                {labels.topChoice}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            {labels.whatItIs}
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {translation.description}
          </p>
        </div>

        {/* Research Evidence */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg flex items-center space-x-2">
            <span>🔬</span>
            <span>{labels.scientificEvidence}</span>
          </h3>
          
          {/* Research summary */}
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
              <span>📊</span>
              <span>{labels.keyFindings}</span>
            </h4>
            <p className="text-blue-800 leading-relaxed mb-3">
              {translation.researchSummary}
            </p>
            <div className="bg-blue-100 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 flex items-center space-x-2">
                <span>📈</span>
                <span>{labels.effectiveness}: {translation.researchEffectiveness}</span>
              </p>
            </div>
          </div>

          {/* Research source */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
              <span>📚</span>
              <span>{labels.source}</span>
            </h4>
            <p className="text-sm text-gray-700 font-mono bg-white border rounded p-3">
              {translation.researchSource}
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-lg flex items-center space-x-2">
            <span>⚙️</span>
            <span>{labels.howItWorks}</span>
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 leading-relaxed">
              {translation.whyItWorks}
            </p>
          </div>
        </div>

        {/* Quick start guide */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-lg flex items-center space-x-2">
            <span>🚀</span>
            <span>{labels.quickStart}</span>
          </h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 leading-relaxed">
              {translation.quickStart}
            </p>
          </div>
        </div>

        {/* Implementation details */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
              <span>🕐</span>
              <span>{labels.optimalTiming}</span>
            </h4>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-3">
              {translation.optimalTiming}
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
              <span>🏷️</span>
              <span>{labels.category}</span>
            </h4>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-3">
              {translation.category}
            </p>
          </div>
        </div>

        {/* Progression tips */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-lg flex items-center space-x-2">
            <span>📈</span>
            <span>{labels.progressionTips}</span>
          </h3>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-purple-800 leading-relaxed">
              {translation.progressionTips}
            </p>
          </div>
        </div>

        {/* Effectiveness ranking */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1 flex items-center space-x-2">
                <span>🏆</span>
                <span>{labels.effectivenessRanking}</span>
              </h4>
              <p className="text-sm text-gray-600">
                {labels.rankingExplanation}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900 flex items-center space-x-1">
                <span>#</span>
                <span>{habit.effectivenessRank}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {labels.inCategory} {getGoalCategoryDisplayName(habit.goalCategory)}
              </div>
            </div>
          </div>
        </div>

        {/* Scientific validation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">🔬</div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">
                {labels.scientificallyValidated}
              </h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                {labels.researchBackedDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
          <Button
            variant="primary"
            className="flex-1 sm:flex-none"
            onClick={handleAddHabit}
          >
            <span className="flex items-center justify-center space-x-2">
              <span>✅</span>
              <span>{labels.addThisHabit}</span>
            </span>
          </Button>
          <Button
            variant="secondary"
            className="flex-1 sm:flex-none"
            onClick={() => {
              // Copy research citation to clipboard
              if (navigator.clipboard) {
                navigator.clipboard.writeText(translation.researchSource);
                // Could show a toast notification here
              }
            }}
          >
            <span className="flex items-center justify-center space-x-2">
              <span>📋</span>
              <span>{labels.copyCitation}</span>
            </span>
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
          >
            {labels.close}
          </Button>
        </div>
      </div>
    </Modal>
  );
}