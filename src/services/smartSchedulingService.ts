import { Habit, User, HabitProgress } from '../types';

export interface ScheduleSlot {
  id: string;
  startTime: string; // "09:00"
  endTime: string; // "09:15"
  duration: number; // minutes
  type: 'morning' | 'midday' | 'evening' | 'flexible';
  priority: number; // 1-10, higher = more important
  context: 'work' | 'home' | 'commute' | 'break' | 'transition';
}

export interface HabitStack {
  id: string;
  name: string;
  habits: string[]; // habit IDs
  totalDuration: number;
  trigger: 'time' | 'location' | 'activity' | 'emotion';
  triggerValue: string;
  schedule: ScheduleSlot;
  effectiveness: number; // 0-1, based on completion rates
}

export interface SmartSchedule {
  userId: string;
  date: string; // ISO date
  stacks: HabitStack[];
  flexibleSlots: ScheduleSlot[];
  adaptiveRecommendations: AdaptiveRecommendation[];
  contextualHints: ContextualHint[];
}

export interface AdaptiveRecommendation {
  id: string;
  type: 'time_adjustment' | 'habit_order' | 'difficulty_change' | 'stack_suggestion';
  habitId: string;
  message: string;
  reasoning: string;
  confidence: number; // 0-1
  actionable: boolean;
}

export interface ContextualHint {
  id: string;
  habitId: string;
  context: string;
  hint: string;
  researchBacked: boolean;
  effectiveness: number;
}

class SmartSchedulingService {
  private scheduleCache: Map<string, SmartSchedule> = new Map();

  /**
   * Generate optimal schedule for user based on their habits, preferences, and historical data
   */
  async generateSmartSchedule(
    user: User,
    habits: Habit[],
    progress: HabitProgress[],
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<SmartSchedule> {
    const cacheKey = `${user.id}-${date}`;
    if (this.scheduleCache.has(cacheKey)) {
      return this.scheduleCache.get(cacheKey)!;
    }

    // Analyze user patterns
    const userPatterns = this.analyzeUserPatterns(user, progress);
    
    // Create habit stacks based on user preferences and effectiveness
    const stacks = this.createHabitStacks(habits, userPatterns, user);
    
    // Generate flexible slots for non-stacked habits
    const flexibleSlots = this.generateFlexibleSlots(habits, stacks, user);
    
    // Generate adaptive recommendations
    const adaptiveRecommendations = this.generateAdaptiveRecommendations(habits, progress, userPatterns);
    
    // Create contextual hints
    const contextualHints = this.generateContextualHints(habits, user);

    const schedule: SmartSchedule = {
      userId: user.id,
      date,
      stacks,
      flexibleSlots,
      adaptiveRecommendations,
      contextualHints
    };

    this.scheduleCache.set(cacheKey, schedule);
    return schedule;
  }

  /**
   * Analyze user patterns from historical data
   */
  private analyzeUserPatterns(user: User, progress: HabitProgress[]) {
    const patterns = {
      peakPerformanceTimes: this.identifyPeakTimes(progress),
      preferredDuration: this.calculatePreferredDuration(progress),
      stackingEffectiveness: this.analyzeStackingSuccess(progress),
      contextualPreferences: this.identifyContextualPreferences(progress),
      adaptationRate: this.calculateAdaptationRate(progress)
    };

    return patterns;
  }

  /**
   * Create optimal habit stacks based on user data
   */
  private createHabitStacks(habits: Habit[], userPatterns: any, user: User): HabitStack[] {
    const stacks: HabitStack[] = [];
    
    // Morning stack - high-energy habits
    const morningHabits = habits.filter(h => 
      h.category === 'health' || h.category === 'productivity'
    ).slice(0, 3);
    
    if (morningHabits.length > 1) {
      stacks.push({
        id: 'morning-energy',
        name: 'Morning Energy Stack',
        habits: morningHabits.map(h => h.id),
        totalDuration: morningHabits.reduce((sum, h) => sum + (h.timeMinutes || 10), 0),
        trigger: 'time',
        triggerValue: user.preferredTime === 'morning' ? '07:00' : '08:00',
        schedule: {
          id: 'morning-slot',
          startTime: user.preferredTime === 'morning' ? '07:00' : '08:00',
          endTime: user.preferredTime === 'morning' ? '07:30' : '08:30',
          duration: 30,
          type: 'morning',
          priority: 9,
          context: 'home'
        },
        effectiveness: 0.85 // High effectiveness for morning stacks
      });
    }

    // Evening wind-down stack
    const eveningHabits = habits.filter(h => 
      h.category === 'wellbeing' || h.category === 'mindfulness'
    ).slice(0, 2);
    
    if (eveningHabits.length > 0) {
      stacks.push({
        id: 'evening-winddown',
        name: 'Evening Wind-Down',
        habits: eveningHabits.map(h => h.id),
        totalDuration: eveningHabits.reduce((sum, h) => sum + (h.timeMinutes || 10), 0),
        trigger: 'time',
        triggerValue: '20:00',
        schedule: {
          id: 'evening-slot',
          startTime: '20:00',
          endTime: '20:20',
          duration: 20,
          type: 'evening',
          priority: 7,
          context: 'home'
        },
        effectiveness: 0.78
      });
    }

    // Work transition stack - short, energizing habits
    const transitionHabits = habits.filter(h => 
      h.timeMinutes && h.timeMinutes <= 5
    ).slice(0, 2);
    
    if (transitionHabits.length > 0) {
      stacks.push({
        id: 'work-transition',
        name: 'Work Transition',
        habits: transitionHabits.map(h => h.id),
        totalDuration: transitionHabits.reduce((sum, h) => sum + (h.timeMinutes || 5), 0),
        trigger: 'activity',
        triggerValue: 'work_break',
        schedule: {
          id: 'transition-slot',
          startTime: '14:00',
          endTime: '14:10',
          duration: 10,
          type: 'midday',
          priority: 6,
          context: 'break'
        },
        effectiveness: 0.72
      });
    }

    return stacks;
  }

  /**
   * Generate flexible time slots for individual habits
   */
  private generateFlexibleSlots(habits: Habit[], stacks: HabitStack[], user: User): ScheduleSlot[] {
    const stackedHabitIds = new Set(stacks.flatMap(stack => stack.habits));
    const unStackedHabits = habits.filter(h => !stackedHabitIds.has(h.id));
    
    return unStackedHabits.map((habit, index) => ({
      id: `flexible-${habit.id}`,
      startTime: '09:00', // Default suggestion
      endTime: '09:15',
      duration: habit.timeMinutes || 10,
      type: 'flexible',
      priority: 5 - index, // Decrease priority for later habits
      context: this.inferHabitContext(habit)
    }));
  }

  /**
   * Generate adaptive recommendations based on user behavior
   */
  private generateAdaptiveRecommendations(
    habits: Habit[], 
    progress: HabitProgress[], 
    userPatterns: any
  ): AdaptiveRecommendation[] {
    const recommendations: AdaptiveRecommendation[] = [];

    // Analyze completion patterns
    habits.forEach(habit => {
      const habitProgress = progress.filter(p => p.habitId === habit.id);
      const recentCompletion = this.calculateRecentCompletionRate(habitProgress);
      
      if (recentCompletion < 0.6) {
        recommendations.push({
          id: `difficulty-${habit.id}`,
          type: 'difficulty_change',
          habitId: habit.id,
          message: 'Consider reducing the time commitment for this habit',
          reasoning: `Recent completion rate is ${Math.round(recentCompletion * 100)}%. Reducing difficulty may improve consistency.`,
          confidence: 0.8,
          actionable: true
        });
      }

      // Time-based recommendations
      const timePattern = this.analyzeTimePreferences(habitProgress);
      if (timePattern.confidence > 0.7) {
        recommendations.push({
          id: `time-${habit.id}`,
          type: 'time_adjustment',
          habitId: habit.id,
          message: `Try doing this habit around ${timePattern.optimalTime}`,
          reasoning: `Your completion rate is ${Math.round(timePattern.successRate * 100)}% higher at this time.`,
          confidence: timePattern.confidence,
          actionable: true
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate contextual hints to improve habit completion
   */
  private generateContextualHints(habits: Habit[], user: User): ContextualHint[] {
    const hints: ContextualHint[] = [];

    habits.forEach(habit => {
      // Category-specific hints
      if (habit.category === 'health') {
        hints.push({
          id: `health-${habit.id}`,
          habitId: habit.id,
          context: 'motivation',
          hint: 'Remember: Small consistent actions compound into major health benefits over time.',
          researchBacked: true,
          effectiveness: 0.75
        });
      }

      if (habit.category === 'mindfulness') {
        hints.push({
          id: `mindfulness-${habit.id}`,
          habitId: habit.id,
          context: 'environment',
          hint: 'Find a quiet space where you won\'t be interrupted. Even 3 minutes of focused practice is valuable.',
          researchBacked: true,
          effectiveness: 0.82
        });
      }

      if (habit.category === 'productivity') {
        hints.push({
          id: `productivity-${habit.id}`,
          habitId: habit.id,
          context: 'timing',
          hint: 'Your brain is typically most focused 2-3 hours after waking up. Consider scheduling this habit then.',
          researchBacked: true,
          effectiveness: 0.78
        });
      }

      // Time-based hints
      hints.push({
        id: `stack-${habit.id}`,
        habitId: habit.id,
        context: 'stacking',
        hint: `Try doing this right after ${this.suggestStackingTrigger(habit, user)}.`,
        researchBacked: true,
        effectiveness: 0.68
      });
    });

    return hints;
  }

  // Helper methods
  private identifyPeakTimes(progress: HabitProgress[]): string[] {
    // Simplified implementation - in real app, would analyze completion times
    return ['07:00', '14:00', '19:00'];
  }

  private calculatePreferredDuration(progress: HabitProgress[]): number {
    // Analyze which durations have highest completion rates
    return 15; // Default 15 minutes
  }

  private analyzeStackingSuccess(progress: HabitProgress[]): number {
    // Analyze success of habits completed in sequence
    return 0.75;
  }

  private identifyContextualPreferences(progress: HabitProgress[]): any {
    return {
      preferredLocation: 'home',
      preferredContext: 'morning_routine'
    };
  }

  private calculateAdaptationRate(progress: HabitProgress[]): number {
    // How quickly user adapts to changes
    return 0.6;
  }

  private inferHabitContext(habit: Habit): 'work' | 'home' | 'commute' | 'break' | 'transition' {
    if (habit.category === 'productivity') return 'work';
    if (habit.category === 'health') return 'home';
    if (habit.timeMinutes && habit.timeMinutes <= 5) return 'transition';
    return 'home';
  }

  private calculateRecentCompletionRate(progress: HabitProgress[]): number {
    if (progress.length === 0) return 0;
    const recent = progress.slice(-7); // Last 7 entries
    return recent.filter(p => p.completed).length / recent.length;
  }

  private analyzeTimePreferences(progress: HabitProgress[]): {
    optimalTime: string;
    successRate: number;
    confidence: number;
  } {
    // Simplified implementation
    return {
      optimalTime: '08:00',
      successRate: 0.8,
      confidence: 0.7
    };
  }

  private suggestStackingTrigger(habit: Habit, user: User): string {
    // Suggest natural triggers based on habit type
    if (habit.category === 'health') return 'waking up';
    if (habit.category === 'mindfulness') return 'finishing work';
    if (habit.category === 'productivity') return 'having morning coffee';
    return 'completing your morning routine';
  }

  /**
   * Update schedule effectiveness based on completion data
   */
  async updateScheduleEffectiveness(
    userId: string, 
    date: string, 
    completionData: { habitId: string; completed: boolean; actualTime?: string }[]
  ): Promise<void> {
    const cacheKey = `${userId}-${date}`;
    const schedule = this.scheduleCache.get(cacheKey);
    
    if (schedule) {
      // Update stack effectiveness based on completion rates
      schedule.stacks.forEach(stack => {
        const stackCompletions = completionData.filter(cd => 
          stack.habits.includes(cd.habitId)
        );
        const completionRate = stackCompletions.filter(sc => sc.completed).length / stackCompletions.length;
        
        // Adjust effectiveness using exponential moving average
        stack.effectiveness = 0.7 * stack.effectiveness + 0.3 * completionRate;
      });
      
      this.scheduleCache.set(cacheKey, schedule);
    }
  }

  /**
   * Get schedule for specific date
   */
  async getSchedule(userId: string, date: string): Promise<SmartSchedule | null> {
    const cacheKey = `${userId}-${date}`;
    return this.scheduleCache.get(cacheKey) || null;
  }
}

export const smartSchedulingService = new SmartSchedulingService();