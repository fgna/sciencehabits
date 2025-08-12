import { Habit, HabitProgress, User } from '../types';

export interface DifficultyAdjustment {
  habitId: string;
  currentDifficulty: DifficultyLevel;
  recommendedDifficulty: DifficultyLevel;
  adjustment: 'increase' | 'decrease' | 'maintain';
  confidence: number; // 0-1
  reasoning: string;
  suggestedChanges: DifficultyChange[];
}

export interface DifficultyLevel {
  name: 'trivial' | 'easy' | 'moderate' | 'challenging' | 'intense';
  timeMinutes: number;
  frequency: 'daily' | 'weekdays' | '3x_week' | '2x_week' | 'weekly';
  complexity: number; // 1-5 scale
  intensity: number; // 1-5 scale
}

export interface DifficultyChange {
  type: 'time' | 'frequency' | 'complexity' | 'intensity';
  currentValue: any;
  suggestedValue: any;
  impact: string;
}

export interface AdaptiveMetrics {
  completionRate: number; // 0-1
  consistencyScore: number; // 0-1, based on streak patterns
  progressTrend: number; // -1 to 1, negative = declining
  engagementLevel: number; // 0-1, based on time since last completion
  difficultyMatchScore: number; // 0-1, how well current difficulty matches user
}

class AdaptiveDifficultyService {
  private readonly DIFFICULTY_LEVELS: Record<string, DifficultyLevel> = {
    trivial: {
      name: 'trivial',
      timeMinutes: 2,
      frequency: 'daily',
      complexity: 1,
      intensity: 1
    },
    easy: {
      name: 'easy',
      timeMinutes: 5,
      frequency: 'daily',
      complexity: 2,
      intensity: 2
    },
    moderate: {
      name: 'moderate',
      timeMinutes: 15,
      frequency: 'daily',
      complexity: 3,
      intensity: 3
    },
    challenging: {
      name: 'challenging',
      timeMinutes: 30,
      frequency: 'weekdays',
      complexity: 4,
      intensity: 4
    },
    intense: {
      name: 'intense',
      timeMinutes: 45,
      frequency: '3x_week',
      complexity: 5,
      intensity: 5
    }
  };

  /**
   * Analyze habit performance and suggest difficulty adjustments
   */
  async analyzeDifficultyAdjustment(
    habit: Habit,
    progress: HabitProgress[],
    user: User
  ): Promise<DifficultyAdjustment> {
    const metrics = this.calculateAdaptiveMetrics(habit, progress);
    const currentDifficulty = this.getCurrentDifficultyLevel(habit);
    const recommendedDifficulty = this.calculateOptimalDifficulty(habit, metrics, user);
    
    const adjustment = this.determineAdjustmentDirection(currentDifficulty, recommendedDifficulty);
    const suggestedChanges = this.generateSpecificChanges(habit, currentDifficulty, recommendedDifficulty);
    
    return {
      habitId: habit.id,
      currentDifficulty,
      recommendedDifficulty,
      adjustment,
      confidence: this.calculateConfidence(metrics),
      reasoning: this.generateReasoning(metrics, adjustment),
      suggestedChanges
    };
  }

  /**
   * Calculate adaptive metrics based on historical performance
   */
  private calculateAdaptiveMetrics(habit: Habit, progress: HabitProgress[]): AdaptiveMetrics {
    if (progress.length === 0) {
      return {
        completionRate: 0.5, // Neutral starting point
        consistencyScore: 0.5,
        progressTrend: 0,
        engagementLevel: 0.8, // High for new habits
        difficultyMatchScore: 0.5
      };
    }

    // Calculate completion rate over last 30 entries or all if less
    const recentProgress = progress.slice(-30);
    const completionRate = recentProgress.filter(p => p.completed).length / recentProgress.length;

    // Calculate consistency score based on streak patterns
    const consistencyScore = this.calculateConsistencyScore(recentProgress);

    // Calculate progress trend (improving/declining)
    const progressTrend = this.calculateProgressTrend(progress);

    // Calculate engagement level based on recency
    const engagementLevel = this.calculateEngagementLevel(progress);

    // Calculate how well current difficulty matches user capability
    const difficultyMatchScore = this.calculateDifficultyMatchScore(completionRate, consistencyScore);

    return {
      completionRate,
      consistencyScore,
      progressTrend,
      engagementLevel,
      difficultyMatchScore
    };
  }

  /**
   * Get current difficulty level of a habit
   */
  private getCurrentDifficultyLevel(habit: Habit): DifficultyLevel {
    const timeMinutes = habit.timeMinutes || 10;
    const frequency = habit.frequency || 'daily';
    
    // Determine difficulty based on time commitment and frequency
    if (timeMinutes <= 3) return this.DIFFICULTY_LEVELS.trivial;
    if (timeMinutes <= 10) return this.DIFFICULTY_LEVELS.easy;
    if (timeMinutes <= 20) return this.DIFFICULTY_LEVELS.moderate;
    if (timeMinutes <= 40) return this.DIFFICULTY_LEVELS.challenging;
    return this.DIFFICULTY_LEVELS.intense;
  }

  /**
   * Calculate optimal difficulty based on metrics and user preferences
   */
  private calculateOptimalDifficulty(
    habit: Habit,
    metrics: AdaptiveMetrics,
    user: User
  ): DifficultyLevel {
    const { completionRate, consistencyScore, progressTrend, engagementLevel } = metrics;
    
    // Base difficulty on completion rate
    let targetDifficulty: keyof typeof this.DIFFICULTY_LEVELS;
    
    if (completionRate >= 0.9 && consistencyScore >= 0.8) {
      // User is crushing it - can handle more challenge
      if (progressTrend > 0.2) targetDifficulty = 'challenging';
      else targetDifficulty = 'moderate';
    } else if (completionRate >= 0.7 && consistencyScore >= 0.6) {
      // User is doing well - maintain or slightly increase
      targetDifficulty = 'moderate';
    } else if (completionRate >= 0.5) {
      // User is struggling - make it easier
      targetDifficulty = 'easy';
    } else {
      // User is really struggling - make it very easy
      targetDifficulty = 'trivial';
    }

    // Adjust based on user preferences
    if (user.preferredIntensity === 'low') {
      targetDifficulty = this.reduceDifficulty(targetDifficulty);
    } else if (user.preferredIntensity === 'high' && completionRate > 0.8) {
      targetDifficulty = this.increaseDifficulty(targetDifficulty);
    }

    // Adjust based on engagement level
    if (engagementLevel < 0.5) {
      targetDifficulty = this.reduceDifficulty(targetDifficulty);
    }

    return this.DIFFICULTY_LEVELS[targetDifficulty];
  }

  /**
   * Determine if we should increase, decrease, or maintain difficulty
   */
  private determineAdjustmentDirection(
    current: DifficultyLevel,
    recommended: DifficultyLevel
  ): 'increase' | 'decrease' | 'maintain' {
    const currentScore = current.complexity + current.intensity;
    const recommendedScore = recommended.complexity + recommended.intensity;
    
    if (recommendedScore > currentScore) return 'increase';
    if (recommendedScore < currentScore) return 'decrease';
    return 'maintain';
  }

  /**
   * Generate specific changes to implement the difficulty adjustment
   */
  private generateSpecificChanges(
    habit: Habit,
    current: DifficultyLevel,
    recommended: DifficultyLevel
  ): DifficultyChange[] {
    const changes: DifficultyChange[] = [];

    // Time adjustment
    if (current.timeMinutes !== recommended.timeMinutes) {
      changes.push({
        type: 'time',
        currentValue: current.timeMinutes,
        suggestedValue: recommended.timeMinutes,
        impact: recommended.timeMinutes > current.timeMinutes 
          ? 'Increase time commitment for greater impact'
          : 'Reduce time to improve consistency'
      });
    }

    // Frequency adjustment
    if (current.frequency !== recommended.frequency) {
      changes.push({
        type: 'frequency',
        currentValue: current.frequency,
        suggestedValue: recommended.frequency,
        impact: this.getFrequencyImpact(current.frequency, recommended.frequency)
      });
    }

    // Complexity adjustment
    if (current.complexity !== recommended.complexity) {
      changes.push({
        type: 'complexity',
        currentValue: current.complexity,
        suggestedValue: recommended.complexity,
        impact: recommended.complexity > current.complexity
          ? 'Add more components to increase effectiveness'
          : 'Simplify to reduce barriers to completion'
      });
    }

    return changes;
  }

  /**
   * Calculate confidence score for the recommendation
   */
  private calculateConfidence(metrics: AdaptiveMetrics): number {
    const factors = [
      metrics.completionRate > 0.3 ? 0.25 : 0, // Have some completion data
      metrics.consistencyScore > 0.2 ? 0.25 : 0, // Have some consistency
      metrics.engagementLevel > 0.3 ? 0.25 : 0, // User is engaged
      Math.abs(metrics.progressTrend) > 0.1 ? 0.25 : 0.1 // Clear trend or stable
    ];
    
    return factors.reduce((sum, factor) => sum + factor, 0);
  }

  /**
   * Generate human-readable reasoning for the recommendation
   */
  private generateReasoning(metrics: AdaptiveMetrics, adjustment: string): string {
    const { completionRate, consistencyScore, progressTrend } = metrics;
    
    if (adjustment === 'decrease') {
      if (completionRate < 0.5) {
        return `Your completion rate is ${Math.round(completionRate * 100)}%. Reducing difficulty can help build consistency and confidence.`;
      } else if (consistencyScore < 0.4) {
        return `While you complete this habit sometimes, building a more consistent routine with easier parameters will create stronger long-term success.`;
      }
    } else if (adjustment === 'increase') {
      if (completionRate > 0.8 && progressTrend > 0) {
        return `You're crushing this habit with ${Math.round(completionRate * 100)}% completion! You're ready for a bigger challenge to maximize your growth.`;
      } else if (consistencyScore > 0.7) {
        return `Your consistency is excellent. Increasing the challenge will help you get even more value from this habit.`;
      }
    } else {
      return `Your current difficulty level is working well. Keep up the great work!`;
    }

    return 'Based on your performance patterns, this adjustment will optimize your success.';
  }

  // Helper methods

  private calculateConsistencyScore(progress: HabitProgress[]): number {
    if (progress.length < 3) return 0.5;
    
    // Look at streaks and gaps
    let streaks: number[] = [];
    let currentStreak = 0;
    
    progress.forEach(p => {
      if (p.completed) {
        currentStreak++;
      } else {
        if (currentStreak > 0) {
          streaks.push(currentStreak);
          currentStreak = 0;
        }
      }
    });
    
    if (currentStreak > 0) streaks.push(currentStreak);
    
    // Calculate consistency based on streak patterns
    const avgStreak = streaks.length > 0 ? streaks.reduce((sum, s) => sum + s, 0) / streaks.length : 0;
    const maxStreak = Math.max(...streaks, 0);
    
    return Math.min(1, (avgStreak / progress.length) + (maxStreak / progress.length) * 0.5);
  }

  private calculateProgressTrend(progress: HabitProgress[]): number {
    if (progress.length < 14) return 0; // Need at least 2 weeks of data
    
    const firstHalf = progress.slice(0, Math.floor(progress.length / 2));
    const secondHalf = progress.slice(Math.floor(progress.length / 2));
    
    const firstHalfRate = firstHalf.filter(p => p.completed).length / firstHalf.length;
    const secondHalfRate = secondHalf.filter(p => p.completed).length / secondHalf.length;
    
    return secondHalfRate - firstHalfRate; // Positive = improving, negative = declining
  }

  private calculateEngagementLevel(progress: HabitProgress[]): number {
    if (progress.length === 0) return 0.8; // High for new habits
    
    const lastEntry = progress[progress.length - 1];
    const lastDate = lastEntry.date || lastEntry.lastCompletionDate;
    
    if (!lastDate) {
      return 0.5; // Neutral engagement if no date available
    }
    
    const daysSinceLastEntry = (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);
    
    // Decay engagement based on time since last entry
    return Math.max(0.1, 1 - (daysSinceLastEntry / 7)); // Full engagement if within a week
  }

  private calculateDifficultyMatchScore(completionRate: number, consistencyScore: number): number {
    // Ideal completion rate is around 70-80%
    const idealCompletionRate = 0.75;
    const completionScore = 1 - Math.abs(completionRate - idealCompletionRate) / idealCompletionRate;
    
    // Weight completion rate and consistency
    return (completionScore * 0.7) + (consistencyScore * 0.3);
  }

  private reduceDifficulty(current: keyof typeof this.DIFFICULTY_LEVELS): keyof typeof this.DIFFICULTY_LEVELS {
    const levels: (keyof typeof this.DIFFICULTY_LEVELS)[] = ['trivial', 'easy', 'moderate', 'challenging', 'intense'];
    const currentIndex = levels.indexOf(current);
    return levels[Math.max(0, currentIndex - 1)];
  }

  private increaseDifficulty(current: keyof typeof this.DIFFICULTY_LEVELS): keyof typeof this.DIFFICULTY_LEVELS {
    const levels: (keyof typeof this.DIFFICULTY_LEVELS)[] = ['trivial', 'easy', 'moderate', 'challenging', 'intense'];
    const currentIndex = levels.indexOf(current);
    return levels[Math.min(levels.length - 1, currentIndex + 1)];
  }

  private getFrequencyImpact(current: string, recommended: string): string {
    const frequencies = {
      'daily': 7,
      'weekdays': 5,
      '3x_week': 3,
      '2x_week': 2,
      'weekly': 1
    };

    const currentScore = frequencies[current as keyof typeof frequencies] || 7;
    const recommendedScore = frequencies[recommended as keyof typeof frequencies] || 7;

    if (recommendedScore > currentScore) {
      return 'Increase frequency to build stronger habits';
    } else {
      return 'Reduce frequency to prevent burnout and maintain consistency';
    }
  }

  /**
   * Apply difficulty adjustment to a habit
   */
  async applyDifficultyAdjustment(
    habit: Habit,
    adjustment: DifficultyAdjustment
  ): Promise<Habit> {
    const updatedHabit = { ...habit };

    adjustment.suggestedChanges.forEach(change => {
      switch (change.type) {
        case 'time':
          updatedHabit.timeMinutes = change.suggestedValue;
          break;
        case 'frequency':
          updatedHabit.frequency = change.suggestedValue;
          break;
        case 'complexity':
          // This would be habit-specific implementation
          updatedHabit.difficulty = change.suggestedValue > 3 ? 'advanced' : 
                                   change.suggestedValue > 1 ? 'moderate' : 'easy';
          break;
      }
    });

    return updatedHabit;
  }
}

export const adaptiveDifficultyService = new AdaptiveDifficultyService();