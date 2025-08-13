// Development utility to generate sample data for testing
import { Progress, User, Habit } from '../types';

export function generateSampleProgressData(
  userId: string, 
  habitIds: string[], 
  daysBack: number = 30
): Progress[] {
  const progressEntries: Progress[] = [];
  const today = new Date();

  habitIds.forEach((habitId, habitIndex) => {
    const completions: string[] = [];
    const streakPattern = [0.8, 0.6, 0.9, 0.7, 0.85]; // Different completion rates for variety
    const completionRate = streakPattern[habitIndex % streakPattern.length];

    // Generate completions going backwards from today
    for (let i = 0; i < daysBack; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Random completion based on pattern, with higher chance for recent days
      const recentBonus = i < 7 ? 0.2 : 0; // Higher completion rate for last 7 days
      if (Math.random() < (completionRate + recentBonus)) {
        completions.push(date.toISOString().split('T')[0]);
      }
    }

    // Sort completions chronologically
    completions.sort();

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    // Check if completed today or yesterday to maintain streak
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (completions.includes(todayStr)) {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (completions.includes(yesterdayStr)) {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 2);
    }
    
    // Count consecutive days backwards
    while (currentStreak < daysBack) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (completions.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak by finding max consecutive completions
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedCompletions = completions.sort();
    
    for (let i = 0; i < sortedCompletions.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedCompletions[i - 1]);
        const currDate = new Date(sortedCompletions[i]);
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    const progress: Progress = {
      id: `${userId}:${habitId}`,
      userId,
      habitId,
      dateStarted: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completions,
      currentStreak,
      longestStreak,
      totalDays: completions.length,
      lastCompletionDate: completions.length > 0 ? completions[completions.length - 1] : undefined
    };

    progressEntries.push(progress);
  });

  return progressEntries;
}

export function createSampleUser(): User {
  return {
    id: 'demo-user',
    name: 'Demo User',
    createdAt: new Date().toISOString(),
    goals: ['improve_health', 'reduce_stress', 'increase_energy'],
    dailyMinutes: 30,
    preferredTime: 'morning',
    lifestyle: 'professional',
    language: 'en',
    trial: {
      hasUsedTrial: true,
      isActive: true,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    isPremium: false
  };
}

// Add sample completions to existing user progress (for development/testing)
export async function addSampleCompletionsToExistingProgress(
  currentProgress: Progress[],
  daysToAdd: number = 14
): Promise<Progress[]> {
  if (currentProgress.length === 0) {
    console.log('No existing progress found to add sample completions to');
    return currentProgress;
  }

  const updatedProgress = currentProgress.map(progress => {
    const existingCompletions = new Set(progress.completions);
    const newCompletions: string[] = [];
    const today = new Date();

    // Add some completions for the last `daysToAdd` days
    for (let i = 0; i < daysToAdd; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Don't duplicate existing completions
      if (!existingCompletions.has(dateStr)) {
        // 70% chance of completion for sample data
        if (Math.random() < 0.7) {
          newCompletions.push(dateStr);
        }
      }
    }

    if (newCompletions.length === 0) {
      return progress; // No new completions to add
    }

    // Combine and sort completions
    const allCompletions = [...progress.completions, ...newCompletions].sort();

    // Recalculate streaks
    let currentStreak = 0;
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (allCompletions.includes(todayStr)) {
      currentStreak = 1;
      let checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - 1);
      
      while (currentStreak < daysToAdd) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (allCompletions.includes(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else if (allCompletions.includes(yesterdayStr)) {
      currentStreak = 1;
      let checkDate = new Date(yesterday);
      checkDate.setDate(checkDate.getDate() - 1);
      
      while (currentStreak < daysToAdd) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (allCompletions.includes(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = progress.longestStreak; // Keep existing longest
    let tempStreak = 0;
    
    for (let i = 0; i < allCompletions.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(allCompletions[i - 1]);
        const currDate = new Date(allCompletions[i]);
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return {
      ...progress,
      completions: allCompletions,
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalDays: allCompletions.length,
      lastCompletionDate: allCompletions[allCompletions.length - 1]
    };
  });

  console.log('✅ Added sample completions to existing progress:', {
    progressEntries: updatedProgress.length,
    totalCompletions: updatedProgress.reduce((sum, p) => sum + p.completions.length, 0),
    totalCurrentStreaks: updatedProgress.map(p => p.currentStreak),
    longestStreaks: updatedProgress.map(p => p.longestStreak)
  });

  return updatedProgress;
}