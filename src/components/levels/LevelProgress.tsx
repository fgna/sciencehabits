/**
 * Level Progress Component
 * 
 * Displays current level, advancement progress, and research-backed
 * guidance for habit progression. Integrates with the recovery system
 * to maintain supportive rather than pressure-inducing progression.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, Button } from '../ui';
import { useLevelStore } from '../../stores/levelStore';
import { LevelDetailModal } from './LevelDetailModal';

interface LevelProgressProps {
  userId: string;
  categoryId: string;
  showAdvancementButton?: boolean;
  className?: string;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({
  userId,
  categoryId,
  showAdvancementButton = true,
  className = ''
}) => {
  const [showLevelDetails, setShowLevelDetails] = useState(false);
  const [showAdvancementModal, setShowAdvancementModal] = useState(false);
  
  const {
    getCurrentLevel,
    getProgressToNextLevel,
    checkAdvancementEligibility,
    advanceToNextLevel,
    initializeUserLevel,
    getUnlockedLevels
  } = useLevelStore();
  
  // Initialize level if not exists
  const currentLevel = getCurrentLevel(userId, categoryId) || (() => {
    initializeUserLevel(userId, categoryId);
    return getCurrentLevel(userId, categoryId);
  })();
  
  const progress = getProgressToNextLevel(userId, categoryId);
  const canAdvance = checkAdvancementEligibility(userId, categoryId);
  const unlockedLevels = getUnlockedLevels(userId, categoryId);
  
  if (!currentLevel) return null;
  
  const handleAdvancement = () => {
    const nextLevel = advanceToNextLevel(userId, categoryId);
    if (nextLevel) {
      setShowAdvancementModal(true);
    }
  };
  
  const getLevelIcon = (level: number) => {
    if (level === 1) return '🌱';
    if (level === 2) return '🌿';
    if (level === 3) return '🌳';
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
  
  return (
    <>
      <Card className={`hover:shadow-md transition-shadow ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{getLevelIcon(currentLevel.level)}</div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {getCategoryName(categoryId)} - Level {currentLevel.level}
                </h3>
                <p className="text-gray-600 text-sm">{currentLevel.name}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {currentLevel.timeRequirement} min/day
              </div>
              <div className="text-xs text-gray-400">
                {unlockedLevels.length} of 3 levels
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Level Description */}
            <p className="text-gray-700 text-sm">{currentLevel.description}</p>
            
            {/* Progress to Next Level */}
            {currentLevel.level < 3 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Progress to Level {currentLevel.level + 1}</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      canAdvance ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {progress < 100 && (
                  <p className="text-xs text-gray-500">
                    Keep practicing consistently to advance to the next level
                  </p>
                )}
              </div>
            )}
            
            {/* Max Level Achieved */}
            {currentLevel.level >= 3 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">🏆</div>
                <p className="text-sm font-medium text-gray-900">Master Level Achieved!</p>
                <p className="text-xs text-gray-600">You've reached the highest level for this habit category</p>
              </div>
            )}
            
            {/* Advancement Button */}
            {canAdvance && showAdvancementButton && currentLevel.level < 3 && (
              <Button
                onClick={handleAdvancement}
                className="w-full bg-green-600 text-white hover:bg-green-700"
                size="sm"
              >
                <span className="mr-2">🎉</span>
                Ready to Level Up!
              </Button>
            )}
            
            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLevelDetails(true)}
                className="flex-1"
              >
                View Details
              </Button>
              {currentLevel.level > 1 && (
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => {/* Could show level history */}}
                  className="flex-1"
                >
                  Level History
                </Button>
              )}
            </div>
            
            {/* Research Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>💡 Research:</strong> {currentLevel.researchExplanation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Level Detail Modal */}
      {showLevelDetails && (
        <LevelDetailModal
          level={currentLevel}
          userId={userId}
          categoryId={categoryId}
          onClose={() => setShowLevelDetails(false)}
        />
      )}
      
      {/* Advancement Celebration Modal */}
      {showAdvancementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Level Up!</h3>
              <p className="text-gray-600 mb-4">
                Congratulations! You've advanced to Level {currentLevel.level + 1} in {getCategoryName(categoryId)}.
                Your consistent practice is paying off!
              </p>
              <Button
                onClick={() => setShowAdvancementModal(false)}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Continue Journey
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};