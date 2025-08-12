/**
 * Level Detail Modal
 * 
 * Detailed view of habit level information including instructions,
 * tips, common mistakes, and research explanations. Educational
 * focus on supporting user growth through scientific guidance.
 */

import React, { useState } from 'react';
import { Modal, Button } from '../ui';
import { HabitLevel } from '../../types';
import { useLevelStore } from '../../stores/levelStore';
import { getHabitLevelsByCategory } from '../../data/habitLevels';

interface LevelDetailModalProps {
  level: HabitLevel;
  userId: string;
  categoryId: string;
  onClose: () => void;
}

export const LevelDetailModal: React.FC<LevelDetailModalProps> = ({
  level,
  userId,
  categoryId,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'instructions' | 'tips' | 'progression'>('overview');
  
  const {
    getUserLevel,
    getUnlockedLevels,
    getProgressToNextLevel,
    checkAdvancementEligibility
  } = useLevelStore();
  
  const userLevel = getUserLevel(userId, categoryId);
  const unlockedLevels = getUnlockedLevels(userId, categoryId);
  const allLevels = getHabitLevelsByCategory(categoryId);
  const progress = getProgressToNextLevel(userId, categoryId);
  const canAdvance = checkAdvancementEligibility(userId, categoryId);
  
  const getLevelIcon = (levelNum: number) => {
    if (levelNum === 1) return '🌱';
    if (levelNum === 2) return '🌿';
    if (levelNum === 3) return '🌳';
    return '🏆';
  };
  
  const getCategoryName = (categoryId: string) => {
    const categoryNames = {
      'exercise_consistency': 'Exercise',
      'reading_consistency': 'Reading',
      'mindfulness_meditation': 'Meditation',
      'nutrition_habits': 'Nutrition'
    };
    return categoryNames[categoryId as keyof typeof categoryNames] || categoryId;
  };
  
  const tabs = [
    { id: 'overview' as const, name: 'Overview', icon: '📋' },
    { id: 'instructions' as const, name: 'Instructions', icon: '📝' },
    { id: 'tips' as const, name: 'Tips & Mistakes', icon: '💡' },
    { id: 'progression' as const, name: 'Progression', icon: '📈' }
  ];
  
  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{getLevelIcon(level.level)}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {getCategoryName(categoryId)} - Level {level.level}
              </h2>
              <h3 className="text-xl text-gray-600">{level.name}</h3>
              <p className="text-gray-500">{level.timeRequirement} minutes per day</p>
            </div>
          </div>
          
          {/* Status */}
          <div className="text-center">
            {userLevel?.currentLevel === level.level ? (
              <div className="text-blue-600">
                <div className="text-2xl">⭐</div>
                <div className="text-sm font-medium">Current Level</div>
              </div>
            ) : unlockedLevels.some(ul => ul.level === level.level) ? (
              <div className="text-green-600">
                <div className="text-2xl">✅</div>
                <div className="text-sm font-medium">Unlocked</div>
              </div>
            ) : (
              <div className="text-gray-400">
                <div className="text-2xl">🔒</div>
                <div className="text-sm">Locked</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Level Description</h3>
                <p className="text-gray-700">{level.description}</p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                  <span className="mr-2">🔬</span>
                  Research Foundation
                </h3>
                <p className="text-blue-800">{level.researchExplanation}</p>
              </div>
              
              {/* Difficulty Tags */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Level Characteristics</h3>
                <div className="flex flex-wrap gap-2">
                  {level.difficultyTags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Prerequisites */}
              {level.prerequisites.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Prerequisites</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {level.prerequisites.map((prereq, index) => (
                      <li key={index}>
                        {prereq.type === 'previous_level' && `Complete Level ${prereq.value}`}
                        {prereq.type === 'consistency_rate' && `Maintain ${prereq.value}% consistency for ${prereq.timeframe}`}
                        {prereq.type === 'time_practiced' && `Practice for ${prereq.value} days`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* Instructions Tab */}
          {activeTab === 'instructions' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Daily Practice Instructions</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">{level.instructions}</p>
                </div>
              </div>
              
              {/* Advancement Criteria */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Advance</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <ul className="space-y-2 text-green-800">
                    <li className="flex items-center">
                      <span className="mr-2">📅</span>
                      Practice for at least {level.advancementCriteria.minimumDuration} days
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">📊</span>
                      Maintain {level.advancementCriteria.minimumConsistency}% consistency
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Tips & Mistakes Tab */}
          {activeTab === 'tips' && (
            <div className="space-y-6">
              {/* Success Tips */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">💡</span>
                  Success Tips
                </h3>
                <div className="space-y-2">
                  {level.tips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-600 mt-0.5">✓</span>
                      <p className="text-blue-800 text-sm">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Common Mistakes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Common Mistakes to Avoid
                </h3>
                <div className="space-y-2">
                  {level.commonMistakes.map((mistake, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <span className="text-yellow-600 mt-0.5">!</span>
                      <p className="text-yellow-800 text-sm">{mistake}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Progression Tab */}
          {activeTab === 'progression' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Level Progression Path</h3>
              
              {/* Level Progression Visual */}
              <div className="space-y-4">
                {allLevels.map((lvl) => {
                  const isUnlocked = unlockedLevels.some(ul => ul.level === lvl.level);
                  const isCurrent = userLevel?.currentLevel === lvl.level;
                  
                  return (
                    <div
                      key={lvl.id}
                      className={`p-4 rounded-lg border-2 ${
                        isCurrent ? 'border-blue-500 bg-blue-50' :
                        isUnlocked ? 'border-green-300 bg-green-50' :
                        'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{getLevelIcon(lvl.level)}</div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Level {lvl.level}: {lvl.name}
                            </h4>
                            <p className="text-sm text-gray-600">{lvl.timeRequirement} min/day</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {isCurrent && <span className="text-blue-600 text-sm font-medium">Current</span>}
                          {isUnlocked && !isCurrent && <span className="text-green-600 text-sm">Unlocked</span>}
                          {!isUnlocked && <span className="text-gray-400 text-sm">Locked</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Current Progress */}
              {userLevel && userLevel.currentLevel < 3 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Progress to Level {userLevel.currentLevel + 1}
                  </h4>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {canAdvance ? (
                    <p className="text-green-600 text-sm">🎉 Ready to advance!</p>
                  ) : (
                    <p className="text-gray-600 text-sm">Keep practicing consistently to advance</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Close Button */}
        <div className="flex justify-center mt-6 pt-6 border-t border-gray-200">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};