/**
 * Badge Store
 * 
 * Manages milestone badges and achievement tracking with research-backed
 * progress calculations. Integrates with existing progress tracking to
 * automatically award badges at meaningful milestones.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Badge, UserBadge, BadgeDisplay } from '../types';
import { MILESTONE_BADGES } from '../data/badges';
import { useUserStore } from './userStore';
import { useRecoveryStore } from './recoveryStore';

interface BadgeState {
  userBadges: UserBadge[];
  availableBadges: Badge[];
  newBadgeQueue: UserBadge[]; // Queue of newly earned badges to show
  
  // Actions
  checkForNewBadges: (userId: string, habitId?: string) => UserBadge[];
  markBadgeAsViewed: (badgeId: string) => void;
  getBadgeProgress: (badgeId: string, userId: string, habitId?: string) => number;
  getDisplayBadges: (userId: string, habitId?: string) => BadgeDisplay[];
  getEarnedBadges: (userId: string) => UserBadge[];
  getTotalBadgeCount: (userId: string) => { earned: number; total: number };
  clearNewBadgeQueue: () => void;
  
  // Helper methods
  calculateStreakProgress: (habitId: string, threshold: number) => number;
  calculateConsistencyProgress: (habitId: string, threshold: number, timeframe?: string) => number;
  calculateRecoveryProgress: (userId: string, habitId?: string, threshold?: number) => number;
  calculateResearchEngagement: (userId: string) => number;
  calculateTotalCompletions: (userId: string, habitId?: string, timeframe?: string) => number;
}

export const useBadgeStore = create<BadgeState>()(
  persist(
      (set, get) => ({
        userBadges: [],
        availableBadges: MILESTONE_BADGES,
        newBadgeQueue: [],
        
        checkForNewBadges: (userId: string, habitId?: string) => {
          const { userBadges, availableBadges } = get();
          const newBadges: UserBadge[] = [];
          
          for (const badge of availableBadges) {
            // Skip if already earned (for habit-specific badges, check specific habit)
            const existingBadge = userBadges.find(ub => 
              ub.badgeId === badge.id && 
              ub.userId === userId &&
              (!badge.requirement.habitSpecific || ub.habitId === habitId)
            );
            
            if (existingBadge) continue;
            
            // Check if requirement is met
            const progress = get().getBadgeProgress(badge.id, userId, habitId);
            
            if (progress >= 100) {
              const newBadge: UserBadge = {
                badgeId: badge.id,
                userId,
                habitId: badge.requirement.habitSpecific ? habitId : undefined,
                earnedAt: new Date().toISOString(),
                isNew: true,
                progress: 100
              };
              
              newBadges.push(newBadge);
              
              console.log(`🏆 New badge earned: ${badge.name} for user ${userId}${habitId ? ` on habit ${habitId}` : ''}`);
            }
          }
          
          if (newBadges.length > 0) {
            set(state => ({
              userBadges: [...state.userBadges, ...newBadges],
              newBadgeQueue: [...state.newBadgeQueue, ...newBadges]
            }));
          }
          
          return newBadges;
        },
        
        getBadgeProgress: (badgeId: string, userId: string, habitId?: string) => {
          const badge = get().availableBadges.find(b => b.id === badgeId);
          if (!badge) return 0;
          
          // Check if already earned
          const existingBadge = get().userBadges.find(ub => 
            ub.badgeId === badge.id && 
            ub.userId === userId &&
            (!badge.requirement.habitSpecific || ub.habitId === habitId)
          );
          
          if (existingBadge) return 100;
          
          switch (badge.requirement.type) {
            case 'streak':
              if (!habitId) return 0;
              return get().calculateStreakProgress(habitId, badge.requirement.threshold);
              
            case 'consistency_rate':
              if (!habitId) return 0;
              return get().calculateConsistencyProgress(
                habitId, 
                badge.requirement.threshold, 
                badge.requirement.timeframe
              );
              
            case 'total_completions':
              return Math.min(
                (get().calculateTotalCompletions(userId, habitId, badge.requirement.timeframe) / 
                badge.requirement.threshold) * 100,
                100
              );
              
            case 'recovery_success':
              return get().calculateRecoveryProgress(userId, habitId, badge.requirement.threshold);
              
            case 'research_engagement':
              return Math.min(
                (get().calculateResearchEngagement(userId) / badge.requirement.threshold) * 100,
                100
              );
              
            default:
              return 0;
          }
        },
        
        calculateStreakProgress: (habitId: string, threshold: number) => {
          const { userProgress } = useUserStore.getState();
          const progress = userProgress.find(p => p.habitId === habitId);
          const currentStreak = progress?.currentStreak || 0;
          return Math.min((currentStreak / threshold) * 100, 100);
        },
        
        calculateConsistencyProgress: (habitId: string, threshold: number, timeframe?: string) => {
          const { userProgress } = useUserStore.getState();
          const progress = userProgress.find(p => p.habitId === habitId);
          if (!progress) return 0;
          
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
              // All time - use date started
              startDate = new Date(progress.dateStarted);
          }
          
          const daysInRange = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
          const completionsInRange = progress.completions.filter(date => 
            new Date(date) >= startDate
          ).length;
          
          const consistencyRate = (completionsInRange / daysInRange) * 100;
          
          if (consistencyRate >= threshold) {
            return 100;
          } else {
            return (consistencyRate / threshold) * 100;
          }
        },
        
        calculateRecoveryProgress: (userId: string, habitId?: string, threshold: number = 1) => {
          const { activeRecoverySessions, recentCompassionEvents } = useRecoveryStore.getState();
          
          // Count successful recoveries
          let successfulRecoveries = 0;
          
          if (habitId) {
            // Check for specific habit recoveries
            const habitRecoveries = activeRecoverySessions.filter(session => 
              session.habitId === habitId && session.completed
            );
            successfulRecoveries = habitRecoveries.length;
            
            // Also check if habit was restarted after compassion message
            const compassionEvents = recentCompassionEvents.filter(event => 
              event.habitId === habitId && event.userResponse === 'accepted_recovery'
            );
            successfulRecoveries += compassionEvents.length;
          } else {
            // Global recovery count
            successfulRecoveries = activeRecoverySessions.filter(s => s.completed).length;
            successfulRecoveries += recentCompassionEvents.filter(e => 
              e.userResponse === 'accepted_recovery'
            ).length;
          }
          
          return successfulRecoveries >= threshold ? 100 : (successfulRecoveries / threshold) * 100;
        },
        
        calculateResearchEngagement: (userId: string) => {
          // This would need to be tracked when users click on research explanations
          // For now, we'll use a placeholder implementation
          // In production, this would query actual research view tracking
          const { userHabits } = useUserStore.getState();
          const habitsWithResearch = userHabits.filter(h => h.researchIds && h.researchIds.length > 0);
          return habitsWithResearch.length; // Count of habits where user has access to research
        },
        
        calculateTotalCompletions: (userId: string, habitId?: string, timeframe?: string) => {
          const { userProgress } = useUserStore.getState();
          
          let totalCompletions = 0;
          const relevantProgress = habitId 
            ? userProgress.filter(p => p.habitId === habitId)
            : userProgress;
          
          for (const progress of relevantProgress) {
            if (timeframe === 'all_time' || !timeframe) {
              totalCompletions += progress.totalDays;
            } else {
              // Filter by timeframe
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
                  startDate = new Date(progress.dateStarted);
              }
              
              const completionsInRange = progress.completions.filter(date => 
                new Date(date) >= startDate
              ).length;
              
              totalCompletions += completionsInRange;
            }
          }
          
          return totalCompletions;
        },
        
        getDisplayBadges: (userId: string, habitId?: string) => {
          const { userBadges, availableBadges } = get();
          
          // Filter badges based on whether we're looking at a specific habit or all
          const relevantBadges = habitId
            ? availableBadges.filter(b => b.requirement.habitSpecific || b.requirement.globalAchievement)
            : availableBadges;
          
          return relevantBadges.map(badge => {
            const userBadge = userBadges.find(ub => 
              ub.badgeId === badge.id && 
              ub.userId === userId &&
              (!badge.requirement.habitSpecific || ub.habitId === habitId)
            );
            
            const progress = userBadge ? 100 : get().getBadgeProgress(badge.id, userId, habitId);
            
            return {
              badge,
              userBadge,
              progress,
              isEarned: !!userBadge,
              isNew: userBadge?.isNew || false
            };
          });
        },
        
        getEarnedBadges: (userId: string) => {
          return get().userBadges.filter(badge => badge.userId === userId);
        },
        
        getTotalBadgeCount: (userId: string) => {
          const earned = get().userBadges.filter(b => b.userId === userId).length;
          const total = get().availableBadges.length;
          return { earned, total };
        },
        
        markBadgeAsViewed: (badgeId: string) => {
          set(state => ({
            userBadges: state.userBadges.map(badge =>
              badge.badgeId === badgeId ? { ...badge, isNew: false } : badge
            ),
            newBadgeQueue: state.newBadgeQueue.filter(badge => badge.badgeId !== badgeId)
          }));
        },
        
        clearNewBadgeQueue: () => {
          set({ newBadgeQueue: [] });
        }
      }),
      {
        name: 'badge-storage',
        partialize: (state) => ({
          userBadges: state.userBadges
        })
      }
    )
);

// Badge checking is handled when progress is updated in userStore