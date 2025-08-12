/**
 * Habit Level Store
 * 
 * Manages habit progression levels with research-backed advancement criteria.
 * Integrates with progress tracking to guide users through natural skill
 * development while maintaining recovery-first philosophy.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HabitLevel, UserHabitLevel } from '../types';
import { HABIT_LEVELS, getHabitLevelsByCategory, getNextLevel } from '../data/habitLevels';
import { useUserStore } from './userStore';

interface LevelState {
  userLevels: UserHabitLevel[];
  availableLevels: HabitLevel[];
  
  // Core Actions
  initializeUserLevel: (userId: string, categoryId: string) => UserHabitLevel;
  getCurrentLevel: (userId: string, categoryId: string) => HabitLevel | null;
  checkAdvancementEligibility: (userId: string, categoryId: string) => boolean;
  advanceToNextLevel: (userId: string, categoryId: string) => HabitLevel | null;
  getProgressToNextLevel: (userId: string, categoryId: string) => number;
  getUnlockedLevels: (userId: string, categoryId: string) => HabitLevel[];
  
  // Helper Methods
  calculateConsistency: (userId: string, categoryId: string, timeframe: string) => number;
  getDaysSinceStart: (userId: string, categoryId: string) => number;
  getUserLevel: (userId: string, categoryId: string) => UserHabitLevel | null;
  updateLevelProgress: (userId: string, categoryId: string) => void;
}

export const useLevelStore = create<LevelState>()(
  persist(
      (set, get) => ({
        userLevels: [],
        availableLevels: HABIT_LEVELS,
        
        initializeUserLevel: (userId: string, categoryId: string) => {
          const existingLevel = get().userLevels.find(ul =>
            ul.userId === userId && ul.habitCategoryId === categoryId
          );
          
          if (existingLevel) {
            return existingLevel;
          }
          
          const newUserLevel: UserHabitLevel = {
            userId,
            habitCategoryId: categoryId,
            currentLevel: 1,
            unlockedLevels: [1],
            startedAt: new Date().toISOString(),
            levelStartDate: new Date().toISOString(),
            readyForAdvancement: false,
            progressToNextLevel: 0
          };
          
          set(state => ({
            userLevels: [...state.userLevels, newUserLevel]
          }));
          
          return newUserLevel;
        },
        
        getCurrentLevel: (userId: string, categoryId: string) => {
          const userLevel = get().getUserLevel(userId, categoryId);
          if (!userLevel) return null;
          
          return get().availableLevels.find(level =>
            level.habitCategoryId === categoryId && level.level === userLevel.currentLevel
          ) || null;
        },
        
        getUserLevel: (userId: string, categoryId: string) => {
          return get().userLevels.find(ul =>
            ul.userId === userId && ul.habitCategoryId === categoryId
          ) || null;
        },
        
        calculateConsistency: (userId: string, categoryId: string, timeframe: string) => {
          const { userProgress, userHabits } = useUserStore.getState();
          
          // Find habits in this category
          const categoryHabits = userHabits.filter(habit => 
            habit.category === categoryId
          );
          
          if (categoryHabits.length === 0) return 0;
          
          const now = new Date();
          let startDate: Date;
          
          switch (timeframe) {
            case 'week':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            default:
              // Use the earliest habit start date for this category
              const categoryProgress = userProgress.filter(p =>
                categoryHabits.some(h => h.id === p.habitId)
              );
              if (categoryProgress.length === 0) return 0;
              
              const earliestStart = categoryProgress.reduce((earliest, current) => 
                new Date(current.dateStarted) < new Date(earliest.dateStarted) ? current : earliest
              );
              startDate = new Date(earliestStart.dateStarted);
          }
          
          let totalPossibleDays = 0;
          let totalCompletedDays = 0;
          
          for (const habit of categoryHabits) {
            const progress = userProgress.find(p => p.habitId === habit.id);
            if (!progress) continue;
            
            const habitStartDate = new Date(progress.dateStarted);
            const effectiveStartDate = habitStartDate > startDate ? habitStartDate : startDate;
            
            const daysInRange = Math.ceil((now.getTime() - effectiveStartDate.getTime()) / (24 * 60 * 60 * 1000));
            totalPossibleDays += Math.max(daysInRange, 0);
            
            const completionsInRange = progress.completions.filter(dateStr => {
              const completionDate = new Date(dateStr);
              return completionDate >= effectiveStartDate && completionDate <= now;
            }).length;
            
            totalCompletedDays += completionsInRange;
          }
          
          if (totalPossibleDays === 0) return 0;
          return (totalCompletedDays / totalPossibleDays) * 100;
        },
        
        getDaysSinceStart: (userId: string, categoryId: string) => {
          const userLevel = get().getUserLevel(userId, categoryId);
          if (!userLevel) return 0;
          
          const startDate = new Date(userLevel.levelStartDate);
          const now = new Date();
          return Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        },
        
        checkAdvancementEligibility: (userId: string, categoryId: string) => {
          const currentLevel = get().getCurrentLevel(userId, categoryId);
          if (!currentLevel) return false;
          
          const userLevel = get().getUserLevel(userId, categoryId);
          if (!userLevel) return false;
          
          // Check prerequisites
          for (const prereq of currentLevel.prerequisites) {
            switch (prereq.type) {
              case 'previous_level':
                if (userLevel.currentLevel < prereq.value) return false;
                break;
              case 'consistency_rate':
                const consistency = get().calculateConsistency(userId, categoryId, prereq.timeframe || 'all');
                if (consistency < prereq.value) return false;
                break;
              case 'time_practiced':
                const daysPracticed = get().getDaysSinceStart(userId, categoryId);
                if (daysPracticed < prereq.value) return false;
                break;
            }
          }
          
          // Check advancement criteria
          const daysSinceStart = get().getDaysSinceStart(userId, categoryId);
          const consistency = get().calculateConsistency(userId, categoryId, 'month');
          
          return (
            daysSinceStart >= currentLevel.advancementCriteria.minimumDuration &&
            consistency >= currentLevel.advancementCriteria.minimumConsistency
          );
        },
        
        getProgressToNextLevel: (userId: string, categoryId: string) => {
          const currentLevel = get().getCurrentLevel(userId, categoryId);
          if (!currentLevel) return 0;
          
          const userLevel = get().getUserLevel(userId, categoryId);
          if (!userLevel) return 0;
          
          const daysSinceStart = get().getDaysSinceStart(userId, categoryId);
          const consistency = get().calculateConsistency(userId, categoryId, 'month');
          
          // Calculate progress based on both time and consistency requirements
          const timeProgress = Math.min(
            (daysSinceStart / currentLevel.advancementCriteria.minimumDuration) * 100,
            100
          );
          const consistencyProgress = Math.min(
            (consistency / currentLevel.advancementCriteria.minimumConsistency) * 100,
            100
          );
          
          // Both criteria must be met, so return the minimum
          return Math.min(timeProgress, consistencyProgress);
        },
        
        advanceToNextLevel: (userId: string, categoryId: string) => {
          if (!get().checkAdvancementEligibility(userId, categoryId)) {
            return null;
          }
          
          const currentLevel = get().getCurrentLevel(userId, categoryId);
          if (!currentLevel) return null;
          
          const nextLevel = getNextLevel(categoryId, currentLevel.level);
          if (!nextLevel) return null; // Max level reached
          
          // Update user level
          set(state => ({
            userLevels: state.userLevels.map(ul =>
              ul.userId === userId && ul.habitCategoryId === categoryId
                ? {
                    ...ul,
                    currentLevel: nextLevel.level,
                    levelStartDate: new Date().toISOString(),
                    unlockedLevels: [...ul.unlockedLevels, nextLevel.level],
                    readyForAdvancement: false,
                    progressToNextLevel: 0
                  }
                : ul
            )
          }));
          
          console.log(`🎓 Level up! User ${userId} advanced to level ${nextLevel.level} in ${categoryId}`);
          
          return nextLevel;
        },
        
        getUnlockedLevels: (userId: string, categoryId: string) => {
          const userLevel = get().getUserLevel(userId, categoryId);
          if (!userLevel) return [];
          
          return getHabitLevelsByCategory(categoryId).filter(level =>
            userLevel.unlockedLevels.includes(level.level)
          );
        },
        
        updateLevelProgress: (userId: string, categoryId: string) => {
          const userLevel = get().getUserLevel(userId, categoryId);
          if (!userLevel) return;
          
          const progress = get().getProgressToNextLevel(userId, categoryId);
          const isReady = get().checkAdvancementEligibility(userId, categoryId);
          
          set(state => ({
            userLevels: state.userLevels.map(ul =>
              ul.userId === userId && ul.habitCategoryId === categoryId
                ? {
                    ...ul,
                    progressToNextLevel: progress,
                    readyForAdvancement: isReady
                  }
                : ul
            )
          }));
        }
      }),
      {
        name: 'level-storage',
        partialize: (state) => ({
          userLevels: state.userLevels
        })
      }
    )
);

// Level progress updates are triggered when progress is updated in userStore