/**
 * Badge Showcase Component
 * 
 * Displays user badges organized by earned/in-progress with filtering
 * and detailed view capabilities. Focuses on celebrating achievements
 * while avoiding pressure-inducing gamification.
 */

import React, { useState, useEffect } from 'react';
import { BadgeComponent } from '../ui/Badge';
import { BadgeDetailModal } from './BadgeDetailModal';
import { useBadgeStore } from '../../stores/badgeStore';
import { useUserStore } from '../../stores/userStore';
import { BadgeDisplay, Badge } from '../../types';

interface BadgeShowcaseProps {
  userId: string;
  habitId?: string; // If provided, show badges specific to this habit
  className?: string;
}

export const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({
  userId,
  habitId,
  className = ''
}) => {
  const [selectedBadge, setSelectedBadge] = useState<BadgeDisplay | null>(null);
  const [filter, setFilter] = useState<'all' | 'earned' | 'progress' | Badge['category']>('all');
  
  const { 
    getDisplayBadges, 
    markBadgeAsViewed, 
    getTotalBadgeCount,
    newBadgeQueue 
  } = useBadgeStore();
  
  const badges = getDisplayBadges(userId, habitId);
  const { earned, total } = getTotalBadgeCount(userId);
  
  // Filter badges based on selected filter
  const filteredBadges = badges.filter(badgeDisplay => {
    switch (filter) {
      case 'earned':
        return badgeDisplay.isEarned;
      case 'progress':
        return !badgeDisplay.isEarned && badgeDisplay.progress > 0;
      case 'all':
        return true;
      default:
        // Filter by category
        return badgeDisplay.badge.category === filter;
    }
  });
  
  const earnedBadges = filteredBadges.filter(b => b.isEarned);
  const inProgressBadges = filteredBadges.filter(b => !b.isEarned && b.progress > 0);
  const availableBadges = filteredBadges.filter(b => !b.isEarned && b.progress === 0);
  
  const handleBadgeClick = (badgeDisplay: BadgeDisplay) => {
    setSelectedBadge(badgeDisplay);
    if (badgeDisplay.isNew) {
      markBadgeAsViewed(badgeDisplay.badge.id);
    }
  };
  
  // Show notification for new badges
  useEffect(() => {
    if (newBadgeQueue.length > 0) {
      // Could trigger a toast notification here
      console.log('🎉 New badges earned:', newBadgeQueue.map(b => b.badgeId));
    }
  }, [newBadgeQueue]);
  
  const categoryLabels = {
    milestone: 'Milestones',
    streak: 'Streaks', 
    consistency: 'Consistency',
    recovery: 'Recovery',
    learning: 'Learning'
  };
  
  if (badges.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-4">🏆</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Badge Journey</h3>
        <p className="text-gray-600">
          Complete habits to unlock research-backed achievement badges!
        </p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {habitId ? 'Habit Badges' : 'Your Achievements'}
          </h2>
          <p className="text-gray-600">
            {earned} of {total} badges earned
            {earned > 0 && (
              <span className="ml-2">
                ({Math.round((earned / total) * 100)}%)
              </span>
            )}
          </p>
        </div>
        
        {/* Progress Ring */}
        {total > 0 && (
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${(earned / total) * 100 * 2.83} 283`}
                className="text-blue-600"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-gray-200"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-900">
                {Math.round((earned / total) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['all', 'earned', 'progress', 'milestone', 'streak', 'consistency', 'recovery', 'learning'] as const).map(filterOption => {
            const isActive = filter === filterOption;
            const count = badges.filter(b => {
              switch (filterOption) {
                case 'all': return true;
                case 'earned': return b.isEarned;
                case 'progress': return !b.isEarned && b.progress > 0;
                default: return b.badge.category === filterOption;
              }
            }).length;
            
            if (count === 0 && filterOption !== 'all') return null;
            
            const label = filterOption === 'all' ? 'All' :
                         filterOption === 'earned' ? 'Earned' :
                         filterOption === 'progress' ? 'In Progress' :
                         categoryLabels[filterOption as Badge['category']] || filterOption;
            
            return (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (filter === 'all' || filter === 'earned') && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🎉</span>
            Earned Badges
          </h3>
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
            {earnedBadges.map(badgeDisplay => (
              <BadgeComponent
                key={`${badgeDisplay.badge.id}-${badgeDisplay.userBadge?.habitId || 'global'}`}
                {...badgeDisplay}
                onClick={() => handleBadgeClick(badgeDisplay)}
                size="medium"
              />
            ))}
          </div>
        </div>
      )}
      
      {/* In Progress Badges */}
      {inProgressBadges.length > 0 && (filter === 'all' || filter === 'progress') && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="mr-2">⏳</span>
            Almost There
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {inProgressBadges.slice(0, 8).map(badgeDisplay => (
              <BadgeComponent
                key={`${badgeDisplay.badge.id}-${badgeDisplay.userBadge?.habitId || 'global'}`}
                {...badgeDisplay}
                onClick={() => handleBadgeClick(badgeDisplay)}
                size="medium"
                showProgress={true}
              />
            ))}
          </div>
          {inProgressBadges.length > 8 && (
            <p className="text-sm text-gray-500 mt-2">
              And {inProgressBadges.length - 8} more badges in progress...
            </p>
          )}
        </div>
      )}
      
      {/* Available Badges (only show a few to avoid overwhelming) */}
      {availableBadges.length > 0 && filter === 'all' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Available Badges
          </h3>
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
            {availableBadges.slice(0, 6).map(badgeDisplay => (
              <BadgeComponent
                key={`${badgeDisplay.badge.id}-${badgeDisplay.userBadge?.habitId || 'global'}`}
                {...badgeDisplay}
                onClick={() => handleBadgeClick(badgeDisplay)}
                size="small"
                showProgress={false}
              />
            ))}
          </div>
          {availableBadges.length > 6 && (
            <p className="text-sm text-gray-500 mt-2">
              {availableBadges.length - 6} more badges available to unlock...
            </p>
          )}
        </div>
      )}
      
      {/* Category-specific display */}
      {filter !== 'all' && filter !== 'earned' && filter !== 'progress' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {categoryLabels[filter as Badge['category']] || filter} Badges
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {filteredBadges.map(badgeDisplay => (
              <BadgeComponent
                key={`${badgeDisplay.badge.id}-${badgeDisplay.userBadge?.habitId || 'global'}`}
                {...badgeDisplay}
                onClick={() => handleBadgeClick(badgeDisplay)}
                size="medium"
                showProgress={true}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State for Filters */}
      {filteredBadges.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No badges found</h3>
          <p className="text-gray-600">
            Try a different filter or start working on habits to unlock badges!
          </p>
        </div>
      )}
      
      {/* Badge Detail Modal */}
      {selectedBadge && (
        <BadgeDetailModal
          badgeDisplay={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
};