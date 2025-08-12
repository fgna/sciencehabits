/**
 * Badge Detail Modal
 * 
 * Shows detailed information about a badge including research explanations,
 * progress details, and earning requirements. Educational focus on the
 * science behind the milestone.
 */

import React from 'react';
import { Modal } from '../ui';
import { BadgeDisplay } from '../../types';

interface BadgeDetailModalProps {
  badgeDisplay: BadgeDisplay;
  onClose: () => void;
}

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
  badgeDisplay,
  onClose
}) => {
  const { badge, userBadge, progress, isEarned } = badgeDisplay;
  
  const rarityLabels = {
    common: 'Common',
    uncommon: 'Uncommon', 
    rare: 'Rare',
    legendary: 'Legendary'
  };
  
  const rarityColors = {
    common: 'text-gray-600 bg-gray-100',
    uncommon: 'text-green-600 bg-green-100',
    rare: 'text-blue-600 bg-blue-100',
    legendary: 'text-purple-600 bg-purple-100'
  };
  
  const getRequirementText = () => {
    switch (badge.requirement.type) {
      case 'streak':
        return `Complete a habit for ${badge.requirement.threshold} consecutive days`;
      case 'consistency_rate':
        const timeframe = badge.requirement.timeframe || 'all time';
        return `Maintain ${badge.requirement.threshold}% consistency over ${timeframe}`;
      case 'total_completions':
        return `Complete ${badge.requirement.threshold} total habit sessions`;
      case 'recovery_success':
        return `Successfully recover from ${badge.requirement.threshold} habit lapse${badge.requirement.threshold > 1 ? 's' : ''}`;
      case 'research_engagement':
        return `Read research explanations for ${badge.requirement.threshold} different habits`;
      default:
        return 'Complete the required milestone';
    }
  };
  
  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="p-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="text-5xl">{badge.icon}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{badge.name}</h2>
              <p className="text-gray-600">{badge.description}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${rarityColors[badge.rarity]}`}>
                  {rarityLabels[badge.rarity]}
                </span>
                <span className="text-sm text-gray-500">
                  {badge.category.charAt(0).toUpperCase() + badge.category.slice(1)} Badge
                </span>
              </div>
            </div>
          </div>
          
          {/* Status */}
          <div className="text-center">
            {isEarned ? (
              <div className="text-green-600">
                <div className="text-3xl">🎉</div>
                <div className="text-sm font-medium">Earned!</div>
                {userBadge && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(userBadge.earnedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-blue-600">
                <div className="text-2xl font-bold">{Math.round(progress)}%</div>
                <div className="text-sm">Progress</div>
                <div className="w-16 bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Requirements */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How to Earn This Badge</h3>
          <p className="text-blue-800">{getRequirementText()}</p>
          {badge.requirement.habitSpecific && (
            <p className="text-blue-700 text-xs mt-2">
              * This badge can be earned separately for each habit
            </p>
          )}
          {badge.requirement.globalAchievement && (
            <p className="text-blue-700 text-xs mt-2">
              * This badge considers progress across all your habits
            </p>
          )}
        </div>
        
        {/* Research Explanation */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <span className="mr-2">🔬</span>
            Why This Milestone Matters
          </h3>
          <p className="text-gray-700 mb-3">{badge.researchExplanation}</p>
          
          {badge.researchCitation && (
            <div className="border-t pt-3 mt-3">
              <div className="text-xs text-gray-600">
                <strong>Source:</strong> {badge.researchCitation.authors} ({badge.researchCitation.year}).
                {badge.researchCitation.title && (
                  <>
                    {' '}<em>{badge.researchCitation.title}</em>.
                  </>
                )}
                {badge.researchCitation.journal && badge.researchCitation.journal !== 'Book' && (
                  <> {badge.researchCitation.journal}.</>
                )}
                {badge.researchCitation.url && (
                  <a 
                    href={badge.researchCitation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    View Study
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Motivational Message */}
        <div className="text-center">
          {isEarned ? (
            <div>
              <p className="text-gray-600 mb-4">
                Congratulations! You've demonstrated real scientific commitment to habit formation.
                This milestone represents meaningful behavioral change backed by research.
              </p>
              <div className="text-4xl mb-2">🌟</div>
              <p className="text-sm text-gray-500">
                Keep building on this foundation - every habit you maintain makes the next one easier!
              </p>
            </div>
          ) : progress > 0 ? (
            <div>
              <p className="text-gray-600 mb-4">
                You're making great progress! Remember, consistency matters more than perfection.
                Each day you practice is building neural pathways for lasting change.
              </p>
              <div className="text-3xl mb-2">💪</div>
              <p className="text-sm text-gray-500">
                Keep going - you're {Math.round(progress)}% of the way to this milestone!
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                This badge awaits your commitment! Start building the habits that will unlock
                this research-backed milestone. Remember, every expert was once a beginner.
              </p>
              <div className="text-3xl mb-2">🚀</div>
              <p className="text-sm text-gray-500">
                Begin today, and let science guide your journey to lasting change!
              </p>
            </div>
          )}
        </div>
        
        {/* Close Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};