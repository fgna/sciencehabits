import Dexie, { Table } from 'dexie';
import { User, Habit, Progress, ResearchStudy } from '../../types';

export class ScienceHabitsDB extends Dexie {
  users!: Table<User, string>;
  habits!: Table<Habit, string>;
  progress!: Table<Progress, string>;
  research!: Table<ResearchStudy, string>;

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
  }
}

export const db = new ScienceHabitsDB();

// Initialize database with default data
export async function initializeDatabase() {
  try {
    // Check if we need to reload data (for enhanced data format)
    const currentVersion = localStorage.getItem('sciencehabits_data_version');
    const expectedVersion = '2.1'; // Enhanced data format with flattened directory
    
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

    // Avoid duplicate completions for the same day
    if (!progress.completions.includes(completionDate)) {
      console.log('Adding new completion for date:', completionDate);
      const updatedCompletions = [...progress.completions, completionDate].sort();
      
      // Calculate streaks
      const { currentStreak, longestStreak } = calculateStreaks(updatedCompletions);
      console.log('Calculated streaks:', { currentStreak, longestStreak });
      
      const updateData = {
        completions: updatedCompletions,
        currentStreak,
        longestStreak: Math.max(longestStreak, progress.longestStreak),
        totalDays: updatedCompletions.length
      };
      
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