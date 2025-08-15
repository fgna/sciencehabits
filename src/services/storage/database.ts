import Dexie, { Table } from 'dexie';
import { User, Habit, Progress, ResearchStudy } from '../../types';

// Offline queue item interface
export interface OfflineQueueItem {
  id: string;
  type: 'HABIT_COMPLETION' | 'CUSTOM_HABIT' | 'PROGRESS_UPDATE' | 'HABIT_DELETION' | 'USER_UPDATE';
  data: any;
  timestamp: number;
  retryCount: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  lastError?: string;
}

export class ScienceHabitsDB extends Dexie {
  users!: Table<User, string>;
  habits!: Table<Habit, string>;
  progress!: Table<Progress, string>;
  research!: Table<ResearchStudy, string>;
  offlineQueue!: Table<OfflineQueueItem, string>;

  constructor() {
    super('ScienceHabitsDB');
    
    this.version(1).stores({
      users: 'id, createdAt, language, lifestyle, preferredTime',
      habits: 'id, category, isCustom, difficulty, *goalTags, *lifestyleTags, *timeTags',
      progress: 'id, userId, habitId, dateStarted, currentStreak, longestStreak',
      research: 'id, category, year, credibilityTier, *habitCategories'
    });
    
    // Updated schema for enhanced data
    this.version(2).stores({
      users: 'id, name, createdAt, language, lifestyle, preferredTime',
      habits: 'id, category, isCustom, difficulty, effectivenessScore, evidenceStrength, frequency, *goalTags, *lifestyleTags, *timeTags',
      progress: 'id, userId, habitId, dateStarted, currentStreak, longestStreak',
      research: 'id, category, year, studyType, sampleSize, evidenceLevel, studyQuality, *habitRelevance'
    });

    // Version 3: Non-daily habit tracking support
    this.version(3).stores({
      users: 'id, name, createdAt, language, lifestyle, preferredTime, dailyMinutes',
      habits: 'id, category, isCustom, difficulty, effectivenessScore, evidenceStrength, frequency.type, *goalTags, *lifestyleTags, *timeTags',
      progress: 'id, userId, habitId, dateStarted, currentStreak, longestStreak, lastCompletionDate, *completions',
      research: 'id, category, year, studyType, sampleSize, evidenceLevel, studyQuality, *habitRelevance'
    });

    // Version 4: Offline queue support for service worker
    this.version(4).stores({
      users: 'id, name, createdAt, language, lifestyle, preferredTime, dailyMinutes',
      habits: 'id, category, isCustom, difficulty, effectivenessScore, evidenceStrength, frequency.type, *goalTags, *lifestyleTags, *timeTags',
      progress: 'id, userId, habitId, dateStarted, currentStreak, longestStreak, lastCompletionDate, *completions',
      research: 'id, category, year, studyType, sampleSize, evidenceLevel, studyQuality, *habitRelevance',
      offlineQueue: 'id, type, timestamp, priority, userId, retryCount'
    });
  }
}

export const db = new ScienceHabitsDB();

// Initialize database with default data
export async function initializeDatabase() {
  try {
    // Check if we need to reload data (for enhanced data format)
    const currentVersion = localStorage.getItem('sciencehabits_data_version');
    const expectedVersion = '4.0'; // Offline queue support for service worker
    
    if (currentVersion !== expectedVersion) {
      console.log('Data version mismatch, clearing and reloading data...');
      await db.habits.clear();
      await db.research.clear();
      localStorage.setItem('sciencehabits_data_version', expectedVersion);
    }
    
    // Check if habits already exist
    const habitCount = await db.habits.count();
    if (habitCount === 0) {
      // Load initial habits and research data
      const { loadInitialData } = await import('../../data/loader');
      await loadInitialData();
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Database helper functions
export const dbHelpers = {
  // Database operations
  async initializeDatabase(): Promise<void> {
    return initializeDatabase();
  },

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...userData
    };
    
    await db.users.add(user);
    return user;
  },

  async getUser(id: string): Promise<User | undefined> {
    return await db.users.get(id);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await db.users.update(id, updates);
  },

  // Habit operations
  async getAllHabits(): Promise<Habit[]> {
    return await db.habits.toArray();
  },

  async getRecommendedHabits(user: User): Promise<Habit[]> {
    // Get all non-custom habits
    const allHabits = await db.habits.where('isCustom').equals(0).toArray();
    
    // Filter and score habits based on user preferences
    const scoredHabits = allHabits
      .map(habit => {
        // Map old goal tags to new ones for compatibility
        const userGoalsMapped = user.goals.map(goal => {
          const goalMap: {[key: string]: string[]} = {
            'improve_focus': ['cognitive_performance', 'focus'],
            'reduce_stress': ['stress_reduction', 'anxiety_management'],
            'increase_energy': ['energy'],
            'better_sleep': ['sleep_quality'],
            'build_confidence': ['mood', 'life_satisfaction'],
            'improve_mood': ['mood'],
            'boost_creativity': ['cognitive_performance'],
            'enhance_memory': ['brain_health', 'cognitive_performance']
          };
          return goalMap[goal] || [goal];
        }).flat();
        
        const matchesGoals = habit.goalTags.some(tag => userGoalsMapped.includes(tag));
        const matchesLifestyle = habit.lifestyleTags.includes(user.lifestyle) || habit.lifestyleTags.includes('all');
        const matchesTime = habit.timeTags.some(tag => [user.preferredTime, 'flexible'].includes(tag));
        const matchesDuration = habit.timeMinutes <= user.dailyMinutes;
        
        // Calculate priority score
        let score = 0;
        if (matchesGoals) score += 40;
        if (matchesLifestyle) score += 20;
        if (matchesTime) score += 20;
        if (matchesDuration) score += 20;
        
        // Prioritize by tier and effectiveness
        if (habit.category === 'tier1_foundation') score += 100;
        else if (habit.category === 'tier2_optimization') score += 50;
        else if (habit.category === 'tier3_microhabits') score += 25;
        
        // Add effectiveness bonus
        if (habit.effectivenessScore) score += habit.effectivenessScore / 10;
        
        console.log(`Habit ${habit.title}: score=${score}, category=${habit.category}, effectiveness=${habit.effectivenessScore}`);
        
        return { habit, score, matches: matchesGoals && matchesLifestyle && matchesTime && matchesDuration };
      })
      .filter(item => item.score > 40) // Must have at least basic matching
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, 6); // Limit to 6 recommendations
    
    return scoredHabits.map(item => item.habit);
  },

  async createCustomHabit(habitData: Omit<Habit, 'id' | 'isCustom'>): Promise<Habit> {
    const habit: Habit = {
      id: crypto.randomUUID(),
      isCustom: true,
      ...habitData
    };
    
    await db.habits.add(habit);
    return habit;
  },

  // Progress operations
  async getProgress(userId: string, habitId: string): Promise<Progress | undefined> {
    const id = `${userId}:${habitId}`;
    return await db.progress.get(id);
  },

  async createProgress(userId: string, habitId: string): Promise<Progress> {
    const progress: Progress = {
      id: `${userId}:${habitId}`,
      userId,
      habitId,
      dateStarted: new Date().toISOString(),
      completions: [],
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0
    };
    
    await db.progress.add(progress);
    return progress;
  },

  async markHabitComplete(userId: string, habitId: string, date?: string): Promise<void> {
    const completionDate = date || new Date().toISOString().split('T')[0];
    console.log('markHabitComplete called:', { userId, habitId, completionDate });
    
    let progress = await this.getProgress(userId, habitId);
    console.log('Existing progress found:', progress);
    
    if (!progress) {
      console.log('No progress found, creating new progress entry...');
      progress = await this.createProgress(userId, habitId);
      console.log('Progress created:', progress);
    }

    // Get habit to check frequency type
    const habit = await db.habits.get(habitId);
    if (!habit) {
      console.error('Habit not found:', habitId);
      return;
    }

    // Avoid duplicate completions for the same day
    if (!progress.completions.includes(completionDate)) {
      console.log('Adding new completion for date:', completionDate);
      const updatedCompletions = [...progress.completions, completionDate].sort();
      
      // Calculate streaks based on habit frequency
      const { currentStreak, longestStreak } = habit.frequency.type === 'daily' 
        ? calculateStreaks(updatedCompletions)
        : { currentStreak: progress.currentStreak, longestStreak: progress.longestStreak };

      console.log('Calculated streaks:', { currentStreak, longestStreak });
      
      const updateData: any = {
        completions: updatedCompletions,
        currentStreak,
        longestStreak: Math.max(longestStreak, progress.longestStreak),
        totalDays: updatedCompletions.length,
        lastCompletionDate: completionDate
      };

      // Handle weekly progress tracking
      if (habit.frequency.type === 'weekly' && habit.frequency.weeklyTarget) {
        const { getWeekStart } = await import('../../utils/weeklyGoalHelpers');
        const weekStart = getWeekStart(new Date(completionDate));
        await this.updateWeeklyProgress(userId, habitId, weekStart, true);
        
        // Recalculate frequency-aware streak for weekly habits
        updateData.frequencyAwareStreak = {
          current: await this.calculateFrequencyAwareStreak(userId, habitId),
          type: 'weekly',
          lastCalculated: new Date().toISOString()
        };
      }

      // Handle periodic progress tracking
      if (habit.frequency.type === 'periodic') {
        await this.updatePeriodicProgress(userId, habitId, true);
        
        // Recalculate frequency-aware streak for periodic habits
        updateData.frequencyAwareStreak = {
          current: await this.calculateFrequencyAwareStreak(userId, habitId),
          type: 'periodic',
          lastCalculated: new Date().toISOString()
        };
      }

      // For daily habits, update frequency-aware streak
      if (habit.frequency.type === 'daily') {
        updateData.frequencyAwareStreak = {
          current: currentStreak,
          type: 'daily',
          lastCalculated: new Date().toISOString()
        };
      }
      
      console.log('Updating progress with:', updateData);
      await db.progress.update(progress.id, updateData);
      console.log('Progress updated successfully');
    } else {
      console.log('Completion already exists for date:', completionDate);
    }
  },

  async getUserProgress(userId: string): Promise<Progress[]> {
    return await db.progress.where('userId').equals(userId).toArray();
  },

  // Research operations
  async getResearchForHabit(habitId: string): Promise<ResearchStudy[]> {
    const habit = await db.habits.get(habitId);
    if (!habit) return [];
    
    return await db.research.where('id').anyOf(habit.researchIds).toArray();
  },

  // Custom habit operations
  async getCustomHabits(userId: string): Promise<Habit[]> {
    // Get user's progress to find which custom habits they're tracking
    const progress = await db.progress.where('userId').equals(userId).toArray();
    const habitIds = progress.map(p => p.habitId);
    
    // Filter to only custom habits
    const habits = await db.habits.where('id').anyOf(habitIds).toArray();
    return habits.filter(h => h.isCustom);
  },

  async updateHabit(habitId: string, updates: Partial<Habit>): Promise<void> {
    await db.habits.update(habitId, updates);
  },

  async deleteHabit(habitId: string): Promise<void> {
    await db.habits.delete(habitId);
  },

  async deleteProgress(userId: string, habitId: string): Promise<void> {
    const id = `${userId}:${habitId}`;
    await db.progress.delete(id);
  },

  // Non-daily habit tracking methods
  async updateWeeklyProgress(userId: string, habitId: string, weekStart: string, completedSession: boolean): Promise<void> {
    const progress = await this.getProgress(userId, habitId);
    if (!progress) return;

    // Find or create weekly progress entry
    const weeklyProgress = progress.weeklyProgress || [];
    const weekIndex = weeklyProgress.findIndex(w => w.weekStart === weekStart);

    if (weekIndex >= 0) {
      // Update existing week
      if (completedSession) {
        weeklyProgress[weekIndex].completedSessions++;
        const today = new Date().toISOString().split('T')[0];
        if (!weeklyProgress[weekIndex].completedDates.includes(today)) {
          weeklyProgress[weekIndex].completedDates.push(today);
        }
      }
      weeklyProgress[weekIndex].weeklyGoalMet = 
        weeklyProgress[weekIndex].completedSessions >= weeklyProgress[weekIndex].targetSessions;
    } else {
      // Create new weekly progress entry
      const habit = await db.habits.get(habitId);
      const targetSessions = habit?.frequency.weeklyTarget?.sessionsPerWeek || 3;
      
      weeklyProgress.push({
        weekStart,
        completedSessions: completedSession ? 1 : 0,
        targetSessions,
        weeklyGoalMet: false,
        completedDates: completedSession ? [new Date().toISOString().split('T')[0]] : []
      });
    }

    await db.progress.update(progress.id, { 
      weeklyProgress,
      lastCompletionDate: completedSession ? new Date().toISOString().split('T')[0] : progress.lastCompletionDate
    });
  },

  async updatePeriodicProgress(userId: string, habitId: string, completed: boolean): Promise<void> {
    const progress = await this.getProgress(userId, habitId);
    if (!progress) return;

    const habit = await db.habits.get(habitId);
    if (!habit?.frequency.periodicTarget) return;

    const { interval, intervalCount } = habit.frequency.periodicTarget;
    const now = new Date();
    const completionDate = now.toISOString().split('T')[0];
    
    // Calculate interval dates based on frequency
    let intervalStart: Date;
    let intervalEnd: Date;

    switch (interval) {
      case 'monthly':
        intervalStart = new Date(now.getFullYear(), now.getMonth() - (intervalCount - 1), 1);
        intervalEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        intervalStart = new Date(now.getFullYear(), quarterStart, 1);
        intervalEnd = new Date(now.getFullYear(), quarterStart + 3, 0);
        break;
      case 'yearly':
        intervalStart = new Date(now.getFullYear(), 0, 1);
        intervalEnd = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        intervalStart = new Date(now);
        intervalEnd = new Date(now);
    }

    const periodicProgress = progress.periodicProgress || [];
    const intervalKey = `${intervalStart.toISOString().split('T')[0]}_${intervalEnd.toISOString().split('T')[0]}`;
    const existingIndex = periodicProgress.findIndex(p => 
      p.intervalStart === intervalStart.toISOString().split('T')[0] &&
      p.intervalEnd === intervalEnd.toISOString().split('T')[0]
    );

    const progressEntry = {
      intervalStart: intervalStart.toISOString().split('T')[0],
      intervalEnd: intervalEnd.toISOString().split('T')[0],
      completed,
      completedDate: completed ? completionDate : undefined,
      daysSinceCompletion: completed ? 0 : undefined,
      intervalType: interval
    };

    if (existingIndex >= 0) {
      periodicProgress[existingIndex] = progressEntry;
    } else {
      periodicProgress.push(progressEntry);
    }

    await db.progress.update(progress.id, { 
      periodicProgress,
      lastCompletionDate: completed ? completionDate : progress.lastCompletionDate
    });
  },

  async calculateFrequencyAwareStreak(userId: string, habitId: string): Promise<number> {
    const progress = await this.getProgress(userId, habitId);
    const habit = await db.habits.get(habitId);
    
    if (!progress || !habit) return 0;

    switch (habit.frequency.type) {
      case 'daily':
        return progress.currentStreak;
      
      case 'weekly':
        if (!progress.weeklyProgress) return 0;
        const recentWeeks = progress.weeklyProgress
          .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
          .slice(0, 12); // Look at last 12 weeks
        
        let weeklyStreak = 0;
        for (const week of recentWeeks) {
          if (week.weeklyGoalMet) {
            weeklyStreak++;
          } else {
            break;
          }
        }
        return weeklyStreak;
      
      case 'periodic':
        if (!progress.periodicProgress) return 0;
        const recentPeriods = progress.periodicProgress
          .sort((a, b) => b.intervalStart.localeCompare(a.intervalStart))
          .slice(0, 12); // Look at last 12 periods
        
        let periodicStreak = 0;
        for (const period of recentPeriods) {
          if (period.completed) {
            periodicStreak++;
          } else {
            break;
          }
        }
        return periodicStreak;
      
      default:
        return progress.currentStreak;
    }
  },

  // Offline Queue operations for service worker coordination
  async addToOfflineQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queueItem: OfflineQueueItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
      ...item
    };

    await db.offlineQueue.add(queueItem);
    console.log('[DB] Added to offline queue:', queueItem.type, queueItem.id);
    return queueItem.id;
  },

  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    return await db.offlineQueue.orderBy('timestamp').toArray();
  },

  async removeFromOfflineQueue(itemId: string): Promise<void> {
    await db.offlineQueue.delete(itemId);
    console.log('[DB] Removed from offline queue:', itemId);
  },

  async updateOfflineQueueItem(itemId: string, updates: Partial<OfflineQueueItem>): Promise<void> {
    await db.offlineQueue.update(itemId, updates);
  },

  async clearOfflineQueue(): Promise<void> {
    await db.offlineQueue.clear();
    console.log('[DB] Cleared offline queue');
  },

  async getOfflineQueueStats(): Promise<{ count: number; oldestTimestamp: number | null }> {
    const items = await db.offlineQueue.toArray();
    return {
      count: items.length,
      oldestTimestamp: items.length > 0 ? Math.min(...items.map(item => item.timestamp)) : null
    };
  },

  // Enhanced habit completion with offline queue support
  async markHabitCompleteWithOfflineSupport(userId: string, habitId: string, date?: string): Promise<void> {
    const completionDate = date || new Date().toISOString().split('T')[0];

    try {
      // Try to mark complete immediately
      await this.markHabitComplete(userId, habitId, completionDate);
      console.log('[DB] Habit marked complete:', { userId, habitId, completionDate });
    } catch (error) {
      console.error('[DB] Failed to mark habit complete, queueing for offline sync:', error);
      
      // If it fails, add to offline queue
      await this.addToOfflineQueue({
        type: 'HABIT_COMPLETION',
        data: { userId, habitId, date: completionDate },
        priority: 'high',
        userId
      });
    }
  }
};

// Helper function to calculate streaks
function calculateStreaks(completions: string[]): { currentStreak: number; longestStreak: number } {
  if (completions.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const sortedDates = completions.sort();
  let currentStreak = 1;
  let longestStreak = 1;
  let tempStreak = 1;

  // Calculate current streak (from today backwards)
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (completions.includes(todayStr)) {
    let checkDate = today;
    currentStreak = 0;
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (completions.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else if (completions.includes(yesterdayStr)) {
    let checkDate = yesterday;
    currentStreak = 0;
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (completions.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
  }

  // Calculate longest streak overall
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}