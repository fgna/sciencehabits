import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button } from '../ui';
import { Achievement } from '../../utils/analyticsHelpers';
import { getRarityColor } from '../../stores/analyticsStore';

interface AchievementTrackerProps {
  achievements: Achievement[];
  totalCompletions: number;
  longestStreak: number;
  currentStreaks: number[];
}

export function AchievementTracker({ 
  achievements, 
  totalCompletions, 
  longestStreak, 
  currentStreaks 
}: AchievementTrackerProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'streak' | 'completion' | 'consistency' | 'milestone'>('all');

  const categories = [
    { id: 'all' as const, name: 'All', icon: '🏆' },
    { id: 'streak' as const, name: 'Streaks', icon: '🔥' },
    { id: 'completion' as const, name: 'Completions', icon: '✅' },
    { id: 'consistency' as const, name: 'Consistency', icon: '📊' },
    { id: 'milestone' as const, name: 'Milestones', icon: '🎯' }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  // Generate potential achievements (locked ones)
  const potentialAchievements = generatePotentialAchievements(totalCompletions, longestStreak, currentStreaks);
  const lockedAchievements = potentialAchievements.filter(potential => 
    !achievements.some(unlocked => unlocked.id === potential.id)
  );

  const achievementsByRarity = {
    legendary: filteredAchievements.filter(a => a.rarity === 'legendary'),
    rare: filteredAchievements.filter(a => a.rarity === 'rare'),
    uncommon: filteredAchievements.filter(a => a.rarity === 'uncommon'),
    common: filteredAchievements.filter(a => a.rarity === 'common')
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
              <p className="text-sm text-gray-600">
                {achievements.length} unlocked • {lockedAchievements.length} remaining
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">
                {achievements.length}
              </div>
              <div className="text-xs text-gray-500">Total Earned</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-1"
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
                {category.id !== 'all' && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-white bg-opacity-20 rounded-full">
                    {achievements.filter(a => a.category === category.id).length}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Achievement Progress Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {Object.entries(achievementsByRarity).map(([rarity, achievementList]) => (
              <div key={rarity} className={`p-3 rounded-lg border ${getRarityColor(rarity)}`}>
                <div className="text-center">
                  <div className="text-lg font-bold mb-1">
                    {achievementList.length}
                  </div>
                  <div className="text-xs font-medium capitalize">
                    {rarity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unlocked Achievements */}
      {filteredAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <h4 className="text-md font-semibold text-gray-900 flex items-center">
              <span className="mr-2">🏆</span>
              Unlocked Achievements
            </h4>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredAchievements
                .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
                .map((achievement) => (
                  <AchievementCard 
                    key={achievement.id} 
                    achievement={achievement} 
                    isUnlocked={true}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Achievements (Next to Unlock) */}
      {lockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <h4 className="text-md font-semibold text-gray-900 flex items-center">
              <span className="mr-2">🔒</span>
              Next to Unlock
            </h4>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {lockedAchievements
                .filter(a => selectedCategory === 'all' || a.category === selectedCategory)
                .slice(0, 6)
                .map((achievement) => (
                  <AchievementCard 
                    key={achievement.id} 
                    achievement={achievement} 
                    isUnlocked={false}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Progress Tracker */}
      <AchievementProgressTracker 
        totalCompletions={totalCompletions}
        longestStreak={longestStreak}
        currentStreaks={currentStreaks}
      />
    </div>
  );
}

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
}

function AchievementCard({ achievement, isUnlocked }: AchievementCardProps) {
  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      isUnlocked 
        ? `${getRarityColor(achievement.rarity)} shadow-sm` 
        : 'border-gray-300 bg-gray-100'
    }`}>
      <div className="flex items-start space-x-3">
        <div className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h5 className={`font-semibold ${
              isUnlocked ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {achievement.title}
            </h5>
            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
              isUnlocked 
                ? getRarityColor(achievement.rarity)
                : 'bg-gray-200 text-gray-500'
            }`}>
              {achievement.rarity}
            </span>
          </div>
          <p className={`text-sm ${
            isUnlocked ? 'text-gray-600' : 'text-gray-400'
          }`}>
            {achievement.description}
          </p>
          {isUnlocked && (
            <p className="text-xs text-gray-500 mt-2">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        {!isUnlocked && (
          <div className="text-gray-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

function AchievementProgressTracker({ 
  totalCompletions, 
  longestStreak, 
  currentStreaks 
}: {
  totalCompletions: number;
  longestStreak: number;
  currentStreaks: number[];
}) {
  const progressItems = [
    {
      title: 'First Week',
      description: 'Maintain a 7-day streak',
      current: longestStreak,
      target: 7,
      type: 'streak',
      icon: '🔥',
      color: 'orange'
    },
    {
      title: 'Century Club',
      description: 'Complete 100 habits',
      current: totalCompletions,
      target: 100,
      type: 'completion',
      icon: '💯',
      color: 'blue'
    },
    {
      title: 'Month Master',
      description: 'Maintain a 30-day streak',
      current: longestStreak,
      target: 30,
      type: 'streak',
      icon: '🏆',
      color: 'green'
    },
    {
      title: 'Habit Hero',
      description: 'Complete 500 habits',
      current: totalCompletions,
      target: 500,
      type: 'completion',
      icon: '🦸‍♂️',
      color: 'purple'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <h4 className="text-md font-semibold text-gray-900">Progress Toward Next Achievements</h4>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {progressItems.map((item) => {
            const progress = Math.min(100, (item.current / item.target) * 100);
            const isCompleted = item.current >= item.target;
            
            return (
              <div key={item.title} className={`p-4 rounded-lg border ${
                isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  <span className={`text-2xl ${isCompleted ? '' : 'grayscale opacity-70'}`}>
                    {item.icon}
                  </span>
                  <div>
                    <h5 className="font-medium text-gray-900">{item.title}</h5>
                    <p className="text-xs text-gray-600">{item.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">
                      {item.current} / {item.target}
                      {isCompleted && <span className="text-green-600 ml-1">✓</span>}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        isCompleted ? 'bg-green-500' : 
                        item.color === 'orange' ? 'bg-orange-500' :
                        item.color === 'blue' ? 'bg-blue-500' :
                        item.color === 'green' ? 'bg-green-500' :
                        'bg-purple-500'
                      }`}
                      style={{ width: `${Math.max(2, progress)}%` }}
                    />
                  </div>
                  
                  <div className="text-center">
                    <span className={`text-sm font-medium ${
                      isCompleted ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Generate potential achievements based on current progress
function generatePotentialAchievements(
  totalCompletions: number, 
  longestStreak: number, 
  currentStreaks: number[]
): Achievement[] {
  const now = new Date().toISOString();
  const achievements: Achievement[] = [];

  // Streak achievements
  const streakMilestones = [
    { days: 7, title: 'Week Warrior', rarity: 'common' as const, icon: '🔥' },
    { days: 14, title: 'Fortnight Fighter', rarity: 'common' as const, icon: '💪' },
    { days: 30, title: 'Month Master', rarity: 'uncommon' as const, icon: '🏆' },
    { days: 60, title: 'Commitment Champion', rarity: 'uncommon' as const, icon: '⚡' },
    { days: 100, title: 'Centurion', rarity: 'rare' as const, icon: '👑' },
    { days: 365, title: 'Year Legend', rarity: 'legendary' as const, icon: '🌟' }
  ];

  streakMilestones.forEach(milestone => {
    achievements.push({
      id: `streak_${milestone.days}`,
      title: milestone.title,
      description: `Maintain a ${milestone.days}-day streak`,
      icon: milestone.icon,
      unlockedAt: now,
      category: 'streak',
      rarity: milestone.rarity
    });
  });

  // Completion achievements
  const completionMilestones = [
    { count: 10, title: 'Getting Started', rarity: 'common' as const, icon: '🌱' },
    { count: 50, title: 'Habit Enthusiast', rarity: 'common' as const, icon: '🚀' },
    { count: 100, title: 'Century Club', rarity: 'uncommon' as const, icon: '💯' },
    { count: 250, title: 'Quarter Master', rarity: 'uncommon' as const, icon: '🎯' },
    { count: 500, title: 'Habit Hero', rarity: 'rare' as const, icon: '🦸‍♂️' },
    { count: 1000, title: 'Legendary Tracker', rarity: 'legendary' as const, icon: '🏛️' }
  ];

  completionMilestones.forEach(milestone => {
    achievements.push({
      id: `completion_${milestone.count}`,
      title: milestone.title,
      description: `Complete ${milestone.count} habits`,
      icon: milestone.icon,
      unlockedAt: now,
      category: 'completion',
      rarity: milestone.rarity
    });
  });

  // Consistency achievements
  const activeStreaks = currentStreaks.filter(s => s > 0).length;
  const consistencyMilestones = [
    { count: 3, title: 'Multitasker', rarity: 'common' as const, icon: '⚡' },
    { count: 5, title: 'Juggling Master', rarity: 'uncommon' as const, icon: '🤹‍♂️' },
    { count: 7, title: 'Consistency King', rarity: 'rare' as const, icon: '👑' },
    { count: 10, title: 'Ultimate Balancer', rarity: 'legendary' as const, icon: '🌟' }
  ];

  consistencyMilestones.forEach(milestone => {
    achievements.push({
      id: `consistency_${milestone.count}`,
      title: milestone.title,
      description: `Maintain ${milestone.count}+ active streaks simultaneously`,
      icon: milestone.icon,
      unlockedAt: now,
      category: 'consistency',
      rarity: milestone.rarity
    });
  });

  // Milestone achievements
  achievements.push(
    {
      id: 'first_habit',
      title: 'First Step',
      description: 'Complete your very first habit',
      icon: '👶',
      unlockedAt: now,
      category: 'milestone',
      rarity: 'common'
    },
    {
      id: 'perfect_week',
      title: 'Perfect Week',
      description: 'Complete all habits for 7 consecutive days',
      icon: '⭐',
      unlockedAt: now,
      category: 'milestone',
      rarity: 'uncommon'
    },
    {
      id: 'comeback_kid',
      title: 'Comeback Kid',
      description: 'Start a new streak after breaking one',
      icon: '🔄',
      unlockedAt: now,
      category: 'milestone',
      rarity: 'common'
    }
  );

  return achievements;
}