import { Habit, HabitProgress, User } from '../types';

export interface RecoveryTrigger {
  type: 'streak_broken' | 'completion_decline' | 'motivation_drop' | 'overcommitment' | 'life_disruption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  triggeredAt: string;
  metadata: Record<string, any>;
}

export interface RecoveryRecommendation {
  id: string;
  habitId: string;
  type: 'reduce_difficulty' | 'pause_habit' | 'habit_stacking' | 'micro_commitment' | 'restart_fresh';
  title: string;
  description: string;
  actionSteps: string[];
  expectedOutcome: string;
  researchBacking: {
    principle: string;
    source: string;
  };
  priority: 'low' | 'medium' | 'high';
  timeToComplete: number; // minutes
}

export interface RecoveryPlan {
  userId: string;
  triggers: RecoveryTrigger[];
  recommendations: RecoveryRecommendation[];
  supportMessage: string;
  emotionalTone: 'gentle' | 'encouraging' | 'understanding' | 'motivational';
  recoveryStrategy: 'gradual_rebuild' | 'reset_and_restart' | 'adjust_expectations' | 'temporary_pause';
  estimatedRecoveryTime: number; // days
}

export interface MotivationalMessage {
  id: string;
  context: 'streak_start' | 'streak_continue' | 'streak_recovery' | 'milestone' | 'struggle' | 'encouragement';
  tone: 'celebratory' | 'supportive' | 'gentle' | 'inspiring' | 'understanding' | 'encouraging' | 'motivational';
  message: string;
  researchBased: boolean;
  personalizable: boolean;
  triggers: {
    streakLength?: number;
    completionRate?: number;
    timeOfDay?: string;
    strugglingDays?: number;
  };
}

class RecoveryService {
  private readonly RECOVERY_THRESHOLDS = {
    STREAK_BROKEN: 1, // days without completion after 3+ day streak
    COMPLETION_DECLINE: 0.3, // 30% drop in completion rate
    MOTIVATION_DROP: 0.5, // subjective or calculated motivation score
    OVERCOMMITMENT: 5, // too many habits active at once
    LIFE_DISRUPTION: 7 // extended period without activity
  };

  /**
   * Analyze user patterns and detect recovery triggers
   */
  async analyzeRecoveryNeeds(
    user: User,
    habits: Habit[],
    progress: HabitProgress[]
  ): Promise<RecoveryPlan | null> {
    const triggers = this.detectRecoveryTriggers(habits, progress);
    
    if (triggers.length === 0) {
      return null; // User is doing well
    }

    const recommendations = await this.generateRecoveryRecommendations(user, habits, progress, triggers);
    const strategy = this.determineRecoveryStrategy(triggers);
    const supportMessage = this.generateSupportMessage(triggers, strategy);

    return {
      userId: user.id,
      triggers,
      recommendations,
      supportMessage,
      emotionalTone: this.selectEmotionalTone(triggers),
      recoveryStrategy: strategy,
      estimatedRecoveryTime: this.estimateRecoveryTime(triggers, strategy)
    };
  }

  /**
   * Detect various triggers that indicate a user needs recovery support
   */
  private detectRecoveryTriggers(habits: Habit[], progress: HabitProgress[]): RecoveryTrigger[] {
    const triggers: RecoveryTrigger[] = [];
    const now = new Date();

    progress.forEach(habitProgress => {
      // Streak broken trigger
      if (habitProgress.longestStreak >= 3 && habitProgress.currentStreak === 0) {
        const daysSinceLast = habitProgress.lastCompletionDate 
          ? (now.getTime() - new Date(habitProgress.lastCompletionDate).getTime()) / (1000 * 60 * 60 * 24)
          : 999;
        
        if (daysSinceLast <= this.RECOVERY_THRESHOLDS.STREAK_BROKEN + 5) {
          triggers.push({
            type: 'streak_broken',
            severity: habitProgress.longestStreak >= 14 ? 'high' : 'medium',
            confidence: 0.9,
            triggeredAt: new Date().toISOString(),
            metadata: {
              habitId: habitProgress.habitId,
              brokenStreak: habitProgress.longestStreak,
              daysSinceLast
            }
          });
        }
      }

      // Completion decline trigger
      const recentCompletions = habitProgress.completions.slice(-30);
      const olderCompletions = habitProgress.completions.slice(-60, -30);
      
      if (recentCompletions.length >= 10 && olderCompletions.length >= 10) {
        const recentRate = recentCompletions.length / 30;
        const olderRate = olderCompletions.length / 30;
        const decline = olderRate - recentRate;
        
        if (decline >= this.RECOVERY_THRESHOLDS.COMPLETION_DECLINE) {
          triggers.push({
            type: 'completion_decline',
            severity: decline >= 0.5 ? 'high' : 'medium',
            confidence: 0.8,
            triggeredAt: new Date().toISOString(),
            metadata: {
              habitId: habitProgress.habitId,
              decline,
              recentRate,
              olderRate
            }
          });
        }
      }

      // Life disruption trigger (extended inactivity)
      if (habitProgress.lastCompletionDate) {
        const daysSinceLast = (now.getTime() - new Date(habitProgress.lastCompletionDate).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLast >= this.RECOVERY_THRESHOLDS.LIFE_DISRUPTION) {
          triggers.push({
            type: 'life_disruption',
            severity: daysSinceLast >= 30 ? 'critical' : daysSinceLast >= 14 ? 'high' : 'medium',
            confidence: 0.7,
            triggeredAt: new Date().toISOString(),
            metadata: {
              habitId: habitProgress.habitId,
              daysSinceLast
            }
          });
        }
      }
    });

    // Overcommitment trigger
    const activeHabits = habits.length;
    if (activeHabits >= this.RECOVERY_THRESHOLDS.OVERCOMMITMENT) {
      const strugglingHabits = progress.filter(p => p.currentStreak === 0 || 
        (p.completions.slice(-7).length / 7) < 0.5).length;
      
      if (strugglingHabits >= activeHabits * 0.6) {
        triggers.push({
          type: 'overcommitment',
          severity: activeHabits >= 10 ? 'critical' : activeHabits >= 7 ? 'high' : 'medium',
          confidence: 0.85,
          triggeredAt: new Date().toISOString(),
          metadata: {
            totalHabits: activeHabits,
            strugglingHabits
          }
        });
      }
    }

    return triggers;
  }

  /**
   * Generate personalized recovery recommendations
   */
  private async generateRecoveryRecommendations(
    user: User,
    habits: Habit[],
    progress: HabitProgress[],
    triggers: RecoveryTrigger[]
  ): Promise<RecoveryRecommendation[]> {
    const recommendations: RecoveryRecommendation[] = [];

    triggers.forEach(trigger => {
      switch (trigger.type) {
        case 'streak_broken':
          recommendations.push({
            id: `recovery-${trigger.type}-${Date.now()}`,
            habitId: trigger.metadata.habitId,
            type: 'micro_commitment',
            title: 'Start with a Micro-Commitment',
            description: `Your ${trigger.metadata.brokenStreak}-day streak was impressive! Let's rebuild with something so small it feels almost too easy.`,
            actionSteps: [
              'Choose just 2 minutes of this habit',
              'Commit to doing it at the same time as before',
              'Focus only on showing up, not perfection',
              'Celebrate each small win'
            ],
            expectedOutcome: 'Rebuild momentum without pressure, leading to sustainable restart',
            researchBacking: {
              principle: 'Starting small reduces activation energy and rebuilds confidence',
              source: 'BJ Fogg, Tiny Habits research'
            },
            priority: 'high',
            timeToComplete: 2
          });
          break;

        case 'completion_decline':
          recommendations.push({
            id: `recovery-${trigger.type}-${Date.now()}`,
            habitId: trigger.metadata.habitId,
            type: 'reduce_difficulty',
            title: 'Reduce Difficulty Temporarily',
            description: 'Your completion rate has dropped. Let\'s make this habit easier to maintain consistency.',
            actionSteps: [
              'Cut the habit time in half',
              'Remove any complex requirements',
              'Focus on the core action only',
              'Increase difficulty only after 2 weeks of consistency'
            ],
            expectedOutcome: 'Higher completion rate and restored confidence',
            researchBacking: {
              principle: 'Reducing difficulty temporarily maintains habit loop while rebuilding capability',
              source: 'Atomic Habits, James Clear'
            },
            priority: 'medium',
            timeToComplete: 5
          });
          break;

        case 'overcommitment':
          recommendations.push({
            id: `recovery-${trigger.type}-${Date.now()}`,
            habitId: 'all',
            type: 'pause_habit',
            title: 'Pause and Prioritize',
            description: `You're managing ${trigger.metadata.totalHabits} habits. Let's pause some to focus on what matters most.`,
            actionSteps: [
              'Choose your top 3 most important habits',
              'Pause the rest for 2 weeks',
              'Master those 3 habits first',
              'Gradually reintroduce others one at a time'
            ],
            expectedOutcome: 'Higher success rate on priority habits, reduced overwhelm',
            researchBacking: {
              principle: 'Limited willpower requires strategic focus on fewer behaviors',
              source: 'Roy Baumeister, willpower research'
            },
            priority: 'high',
            timeToComplete: 15
          });
          break;

        case 'life_disruption':
          recommendations.push({
            id: `recovery-${trigger.type}-${Date.now()}`,
            habitId: trigger.metadata.habitId,
            type: 'restart_fresh',
            title: 'Fresh Start with Self-Compassion',
            description: `Life happens. You've had ${Math.round(trigger.metadata.daysSinceLast)} days away - that's okay.`,
            actionSteps: [
              'Acknowledge this is a fresh beginning, not a failure',
              'Start with 50% of your previous commitment',
              'Choose your most meaningful habit first',
              'Be extra gentle with yourself for the first week'
            ],
            expectedOutcome: 'Renewed motivation and realistic re-engagement',
            researchBacking: {
              principle: 'Self-compassion improves motivation and reduces perfectionism',
              source: 'Kristin Neff, self-compassion research'
            },
            priority: 'high',
            timeToComplete: 10
          });
          break;
      }
    });

    return recommendations;
  }

  /**
   * Determine overall recovery strategy
   */
  private determineRecoveryStrategy(triggers: RecoveryTrigger[]): RecoveryPlan['recoveryStrategy'] {
    const severities = triggers.map(t => t.severity);
    const hasCritical = severities.includes('critical');
    const hasMultipleHigh = severities.filter(s => s === 'high').length >= 2;
    const hasOvercommitment = triggers.some(t => t.type === 'overcommitment');
    const hasLifeDisruption = triggers.some(t => t.type === 'life_disruption');

    if (hasCritical || hasLifeDisruption) {
      return 'reset_and_restart';
    } else if (hasOvercommitment) {
      return 'adjust_expectations';
    } else if (hasMultipleHigh) {
      return 'temporary_pause';
    } else {
      return 'gradual_rebuild';
    }
  }

  /**
   * Generate supportive message based on triggers and strategy
   */
  private generateSupportMessage(
    triggers: RecoveryTrigger[],
    strategy: RecoveryPlan['recoveryStrategy']
  ): string {
    const triggerTypes = triggers.map(t => t.type);

    if (triggerTypes.includes('life_disruption')) {
      return "Life has a way of disrupting even our best intentions. You're not behind - you're exactly where you need to be. Let's start fresh with kindness toward yourself.";
    }

    if (triggerTypes.includes('overcommitment')) {
      return "I can see you're ambitious about building positive habits, which is wonderful! Sometimes the most productive thing we can do is focus on fewer things and do them really well.";
    }

    if (triggerTypes.includes('streak_broken')) {
      return "Breaking a streak doesn't erase the progress you've made. Every day you practiced that habit strengthened neural pathways that are still there. You're rebuilding, not starting over.";
    }

    if (triggerTypes.includes('completion_decline')) {
      return "I've noticed things have been tougher lately. That's completely normal - habits naturally ebb and flow. Let's adjust things to make success feel more achievable again.";
    }

    return "Every expert was once a beginner, and every pro was once an amateur. You're doing great by staying aware and wanting to improve. Let's find what works best for you right now.";
  }

  /**
   * Select appropriate emotional tone for recovery messaging
   */
  private selectEmotionalTone(triggers: RecoveryTrigger[]): RecoveryPlan['emotionalTone'] {
    const severities = triggers.map(t => t.severity);
    const hasCritical = severities.includes('critical');
    const hasLifeDisruption = triggers.some(t => t.type === 'life_disruption');

    if (hasCritical || hasLifeDisruption) {
      return 'understanding';
    } else if (triggers.some(t => t.type === 'streak_broken')) {
      return 'gentle';
    } else if (triggers.some(t => t.type === 'overcommitment')) {
      return 'encouraging';
    } else {
      return 'motivational';
    }
  }

  /**
   * Estimate recovery time based on triggers and strategy
   */
  private estimateRecoveryTime(
    triggers: RecoveryTrigger[],
    strategy: RecoveryPlan['recoveryStrategy']
  ): number {
    const baseDays = {
      'gradual_rebuild': 7,
      'adjust_expectations': 14,
      'temporary_pause': 21,
      'reset_and_restart': 30
    };

    let days = baseDays[strategy];

    // Adjust based on trigger severity
    const hasCritical = triggers.some(t => t.severity === 'critical');
    const hasMultipleHigh = triggers.filter(t => t.severity === 'high').length >= 2;

    if (hasCritical) days *= 1.5;
    if (hasMultipleHigh) days *= 1.2;

    return Math.round(days);
  }

  /**
   * Generate contextual motivational messages
   */
  generateMotivationalMessage(
    context: MotivationalMessage['context'],
    progress?: HabitProgress,
    habit?: Habit
  ): MotivationalMessage {
    const messageBank: Record<string, MotivationalMessage[]> = {
      streak_start: [
        {
          id: 'streak-start-1',
          context: 'streak_start',
          tone: 'inspiring',
          message: "Day 1 is the hardest day - you just conquered it! 🌱 The first step of any journey is the most courageous.",
          researchBased: true,
          personalizable: false,
          triggers: { streakLength: 1 }
        },
        {
          id: 'streak-start-2',
          context: 'streak_start',
          tone: 'celebratory',
          message: "You started! That's 80% of success right there. Research shows that people who track their habits are 2x more likely to achieve their goals. You're already ahead! 🚀",
          researchBased: true,
          personalizable: false,
          triggers: { streakLength: 1 }
        }
      ],
      streak_continue: [
        {
          id: 'streak-continue-1',
          context: 'streak_continue',
          tone: 'encouraging',
          message: "{streak} days strong! Your brain is literally rewiring itself for success. Each day makes the next one easier. 🧠✨",
          researchBased: true,
          personalizable: true,
          triggers: { streakLength: 3 }
        },
        {
          id: 'streak-continue-2',
          context: 'streak_continue',
          tone: 'inspiring',
          message: "Amazing {streak}-day streak! You're proving to yourself that you're someone who follows through. That's the most powerful belief you can build. 💪",
          researchBased: false,
          personalizable: true,
          triggers: { streakLength: 7 }
        }
      ],
      struggle: [
        {
          id: 'struggle-1',
          context: 'struggle',
          tone: 'understanding',
          message: "It's okay to have tough days. Progress isn't always linear, and that's completely normal. What matters is that you're here, trying. That's courage. 💛",
          researchBased: false,
          personalizable: false,
          triggers: { strugglingDays: 3 }
        },
        {
          id: 'struggle-2',
          context: 'struggle',
          tone: 'gentle',
          message: "Sometimes the most productive thing you can do is rest. Self-compassion is proven to improve motivation more than self-criticism. Be kind to yourself today. 🤗",
          researchBased: true,
          personalizable: false,
          triggers: { strugglingDays: 5 }
        }
      ]
    };

    const contextMessages = messageBank[context] || [];
    if (contextMessages.length === 0) {
      // Fallback message
      return {
        id: 'fallback',
        context,
        tone: 'encouraging',
        message: "Every small step counts. You're building something meaningful, one day at a time.",
        researchBased: false,
        personalizable: false,
        triggers: {}
      };
    }

    // Select appropriate message based on progress
    let selectedMessage = contextMessages[0];
    
    if (progress) {
      const streak = progress.currentStreak;
      const appropriateMessages = contextMessages.filter(msg => 
        !msg.triggers.streakLength || streak >= msg.triggers.streakLength
      );
      
      if (appropriateMessages.length > 0) {
        selectedMessage = appropriateMessages[Math.floor(Math.random() * appropriateMessages.length)];
      }
    }

    // Personalize message if needed
    if (selectedMessage.personalizable && progress) {
      selectedMessage.message = selectedMessage.message.replace('{streak}', progress.currentStreak.toString());
    }

    return selectedMessage;
  }

  /**
   * Apply recovery recommendations to habits
   */
  async applyRecoveryRecommendation(
    habit: Habit,
    recommendation: RecoveryRecommendation
  ): Promise<Habit> {
    const updatedHabit = { ...habit };

    switch (recommendation.type) {
      case 'reduce_difficulty':
        updatedHabit.timeMinutes = Math.max(2, Math.floor(habit.timeMinutes / 2));
        updatedHabit.difficulty = habit.difficulty === 'advanced' ? 'moderate' : 
                                habit.difficulty === 'moderate' ? 'easy' : 'trivial';
        break;

      case 'micro_commitment':
        updatedHabit.timeMinutes = Math.min(5, Math.max(2, habit.timeMinutes));
        updatedHabit.difficulty = 'trivial';
        break;

      case 'restart_fresh':
        updatedHabit.timeMinutes = Math.floor(habit.timeMinutes * 0.5);
        break;
    }

    return updatedHabit;
  }
}

export const recoveryService = new RecoveryService();