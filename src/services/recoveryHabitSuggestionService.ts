import { Habit, HabitProgress, User } from '../types';
import { RecoveryTrigger, RecoveryPlan } from './recoveryService';

export interface RecoveryHabitSuggestion {
  id: string;
  type: 'bridge_habit' | 'reset_habit' | 'micro_habit' | 'anchor_habit' | 'momentum_habit';
  title: string;
  description: string;
  category: string;
  timeMinutes: number;
  difficulty: 'trivial' | 'easy' | 'moderate';
  instructions: string;
  whyEffective: string;
  researchBacking: {
    principle: string;
    source: string;
    citation?: string;
  };
  triggers: {
    applicableFor: RecoveryTrigger['type'][];
    recoveryPhase: 'immediate' | 'rebuilding' | 'strengthening' | 'stabilizing';
    strugglingHabits?: string[];
  };
  personalizable: boolean;
  estimatedSuccessRate: number; // 0-100
  prerequisites?: string[];
}

export interface PersonalizedRecoveryPlan {
  userId: string;
  triggeredBy: RecoveryTrigger[];
  phase: 'crisis' | 'stabilizing' | 'rebuilding' | 'thriving';
  primaryStrategy: 'reduce' | 'pause' | 'bridge' | 'restart';
  suggestedHabits: RecoveryHabitSuggestion[];
  timeframe: number; // days
  successMetrics: {
    targetCompletionRate: number;
    milestones: Array<{
      day: number;
      goal: string;
      celebration: string;
    }>;
  };
}

class RecoveryHabitSuggestionService {
  private recoveryHabitsDatabase: RecoveryHabitSuggestion[] = [];

  constructor() {
    this.initializeRecoveryHabitsDatabase();
  }

  /**
   * Generate personalized recovery suggestions based on user's situation
   */
  async generateRecoveryPlan(
    user: User,
    habits: Habit[],
    progress: HabitProgress[],
    triggers: RecoveryTrigger[]
  ): Promise<PersonalizedRecoveryPlan> {
    const phase = this.determineRecoveryPhase(triggers);
    const strategy = this.determineRecoveryStrategy(triggers, habits, progress);
    const suggestedHabits = this.selectAppropriateHabits(user, habits, progress, triggers, phase, strategy);
    
    return {
      userId: user.id,
      triggeredBy: triggers,
      phase,
      primaryStrategy: strategy,
      suggestedHabits,
      timeframe: this.calculateRecoveryTimeframe(phase, strategy),
      successMetrics: this.generateSuccessMetrics(phase, strategy)
    };
  }

  /**
   * Get specific recovery habits for different situations
   */
  getRecoveryHabitsForTrigger(
    triggerType: RecoveryTrigger['type'],
    userPreferences: {
      preferredTime: User['preferredTime'];
      lifestyle: User['lifestyle'];
      categories: string[];
    }
  ): RecoveryHabitSuggestion[] {
    return this.recoveryHabitsDatabase
      .filter(habit => habit.triggers.applicableFor.includes(triggerType))
      .filter(habit => userPreferences.categories.includes(habit.category))
      .sort((a, b) => b.estimatedSuccessRate - a.estimatedSuccessRate)
      .slice(0, 5);
  }

  /**
   * Create bridge habits to reconnect with struggling main habits
   */
  createBridgeHabits(strugglingHabits: Habit[], progress: HabitProgress[]): RecoveryHabitSuggestion[] {
    const bridgeHabits: RecoveryHabitSuggestion[] = [];

    strugglingHabits.forEach(habit => {
      const habitProgress = progress.find(p => p.habitId === habit.id);
      
      // Create a micro version of the habit
      bridgeHabits.push({
        id: `bridge-${habit.id}-${Date.now()}`,
        type: 'bridge_habit',
        title: `Mini ${habit.title}`,
        description: `A 2-minute version of ${habit.title} to rebuild your connection with this habit`,
        category: habit.category,
        timeMinutes: 2,
        difficulty: 'trivial',
        instructions: `Do just the first 2 minutes of your ${habit.title} routine. Focus on showing up, not perfection.`,
        whyEffective: `Bridge habits help you reconnect with dormant habits by removing barriers and rebuilding the neural pathway through minimal commitment.`,
        researchBacking: {
          principle: 'Lowering activation energy makes habits more accessible',
          source: 'BJ Fogg, Tiny Habits methodology',
          citation: 'Fogg, B.J. (2019). Tiny Habits: The Small Changes That Change Everything'
        },
        triggers: {
          applicableFor: ['streak_broken', 'completion_decline', 'motivation_drop'],
          recoveryPhase: 'immediate',
          strugglingHabits: [habit.id]
        },
        personalizable: true,
        estimatedSuccessRate: 85,
        prerequisites: []
      });

      // Create an anchor habit if the original had timing issues
      if (habitProgress && habitProgress.currentStreak === 0) {
        bridgeHabits.push({
          id: `anchor-${habit.id}-${Date.now()}`,
          type: 'anchor_habit',
          title: `${habit.title} Anchor`,
          description: `Connect ${habit.title} to an existing strong habit`,
          category: habit.category,
          timeMinutes: habit.timeMinutes,
          difficulty: 'easy',
          instructions: `After I [your strongest daily habit], I will do ${habit.title} for just 5 minutes.`,
          whyEffective: `Habit stacking leverages existing neural pathways to create new ones, increasing success rates dramatically.`,
          researchBacking: {
            principle: 'Implementation intentions and habit stacking',
            source: 'James Clear, Atomic Habits',
            citation: 'Clear, J. (2018). Atomic Habits'
          },
          triggers: {
            applicableFor: ['streak_broken', 'completion_decline'],
            recoveryPhase: 'rebuilding'
          },
          personalizable: true,
          estimatedSuccessRate: 75
        });
      }
    });

    return bridgeHabits;
  }

  private determineRecoveryPhase(triggers: RecoveryTrigger[]): PersonalizedRecoveryPlan['phase'] {
    const severities = triggers.map(t => t.severity);
    const triggerTypes = triggers.map(t => t.type);

    if (severities.includes('critical') || triggerTypes.includes('life_disruption')) {
      return 'crisis';
    } else if (triggerTypes.includes('overcommitment') || severities.filter(s => s === 'high').length >= 2) {
      return 'stabilizing';
    } else if (triggerTypes.includes('streak_broken') || triggerTypes.includes('completion_decline')) {
      return 'rebuilding';
    } else {
      return 'thriving';
    }
  }

  private determineRecoveryStrategy(
    triggers: RecoveryTrigger[],
    habits: Habit[],
    progress: HabitProgress[]
  ): PersonalizedRecoveryPlan['primaryStrategy'] {
    const triggerTypes = triggers.map(t => t.type);

    if (triggerTypes.includes('overcommitment')) {
      return 'reduce';
    } else if (triggerTypes.includes('life_disruption')) {
      return 'restart';
    } else if (triggerTypes.includes('streak_broken') && habits.length <= 3) {
      return 'bridge';
    } else {
      return 'pause';
    }
  }

  private selectAppropriateHabits(
    user: User,
    habits: Habit[],
    progress: HabitProgress[],
    triggers: RecoveryTrigger[],
    phase: PersonalizedRecoveryPlan['phase'],
    strategy: PersonalizedRecoveryPlan['primaryStrategy']
  ): RecoveryHabitSuggestion[] {
    const suggestions: RecoveryHabitSuggestion[] = [];
    const triggerTypes = triggers.map(t => t.type);

    // Phase-specific suggestions
    if (phase === 'crisis') {
      suggestions.push(...this.getCrisisRecoveryHabits(user));
    } else if (phase === 'stabilizing') {
      suggestions.push(...this.getStabilizingHabits(user));
    } else if (phase === 'rebuilding') {
      suggestions.push(...this.getRebuildingHabits(user, habits, progress));
    }

    // Strategy-specific suggestions
    if (strategy === 'bridge') {
      const strugglingHabits = habits.filter(h => {
        const p = progress.find(prog => prog.habitId === h.id);
        return p && p.currentStreak === 0;
      });
      suggestions.push(...this.createBridgeHabits(strugglingHabits, progress));
    }

    // Trigger-specific suggestions
    triggerTypes.forEach(triggerType => {
      const triggerHabits = this.recoveryHabitsDatabase.filter(h => 
        h.triggers.applicableFor.includes(triggerType)
      );
      suggestions.push(...triggerHabits);
    });

    // Remove duplicates and sort by success rate
    const uniqueSuggestions = suggestions.filter((habit, index, self) => 
      index === self.findIndex(h => h.id === habit.id)
    );

    return uniqueSuggestions
      .sort((a, b) => b.estimatedSuccessRate - a.estimatedSuccessRate)
      .slice(0, 6);
  }

  private getCrisisRecoveryHabits(user: User): RecoveryHabitSuggestion[] {
    return [
      {
        id: 'crisis-breathing',
        type: 'micro_habit',
        title: '3 Deep Breaths',
        description: 'Take three conscious deep breaths to center yourself',
        category: 'mindfulness',
        timeMinutes: 1,
        difficulty: 'trivial',
        instructions: 'When you feel overwhelmed, stop and take three slow, deep breaths. Focus only on the breath.',
        whyEffective: 'Breathing exercises activate the parasympathetic nervous system, reducing stress and creating mental space for positive action.',
        researchBacking: {
          principle: 'Breathwork for stress reduction and nervous system regulation',
          source: 'Harvard Health Publishing',
          citation: 'Harvard Health. (2020). Relaxation techniques: Breath control helps quell errant stress response'
        },
        triggers: {
          applicableFor: ['life_disruption', 'overcommitment', 'motivation_drop'],
          recoveryPhase: 'immediate'
        },
        personalizable: false,
        estimatedSuccessRate: 95
      },
      {
        id: 'crisis-self-compassion',
        type: 'micro_habit',
        title: 'Self-Compassion Check',
        description: 'Speak to yourself like a good friend would',
        category: 'mindfulness',
        timeMinutes: 2,
        difficulty: 'trivial',
        instructions: 'When struggling, ask: "What would I tell a good friend in this situation?" Then offer yourself the same kindness.',
        whyEffective: 'Self-compassion increases resilience and motivation while reducing self-criticism that can paralyze action.',
        researchBacking: {
          principle: 'Self-compassion enhances motivation and reduces perfectionism',
          source: 'Kristin Neff research',
          citation: 'Neff, K. (2011). Self-Compassion: The Proven Power of Being Kind to Yourself'
        },
        triggers: {
          applicableFor: ['life_disruption', 'streak_broken', 'motivation_drop'],
          recoveryPhase: 'immediate'
        },
        personalizable: false,
        estimatedSuccessRate: 88
      }
    ];
  }

  private getStabilizingHabits(user: User): RecoveryHabitSuggestion[] {
    return [
      {
        id: 'stabilize-morning-anchor',
        type: 'anchor_habit',
        title: 'Morning Anchor Routine',
        description: 'One simple thing you do every morning without fail',
        category: 'productivity',
        timeMinutes: 5,
        difficulty: 'easy',
        instructions: 'Choose one simple morning action (make bed, drink water, look outside). Do this before anything else.',
        whyEffective: 'Morning anchors create a foundation of success that builds momentum for the entire day.',
        researchBacking: {
          principle: 'Morning routines and keystone habits',
          source: 'Charles Duhigg, The Power of Habit',
          citation: 'Duhigg, C. (2012). The Power of Habit'
        },
        triggers: {
          applicableFor: ['overcommitment', 'completion_decline'],
          recoveryPhase: 'rebuilding'
        },
        personalizable: true,
        estimatedSuccessRate: 78
      }
    ];
  }

  private getRebuildingHabits(user: User, habits: Habit[], progress: HabitProgress[]): RecoveryHabitSuggestion[] {
    return [
      {
        id: 'rebuild-momentum-tracker',
        type: 'momentum_habit',
        title: 'Daily Win Tracker',
        description: 'Record one small win each day',
        category: 'productivity',
        timeMinutes: 2,
        difficulty: 'trivial',
        instructions: 'Before bed, write down one thing you accomplished today, no matter how small.',
        whyEffective: 'Tracking small wins releases dopamine and builds positive momentum, creating upward spiral of motivation.',
        researchBacking: {
          principle: 'Progress principle and positive reinforcement',
          source: 'Teresa Amabile, The Progress Principle',
          citation: 'Amabile, T. & Kramer, S. (2011). The Progress Principle'
        },
        triggers: {
          applicableFor: ['streak_broken', 'completion_decline', 'motivation_drop'],
          recoveryPhase: 'rebuilding'
        },
        personalizable: false,
        estimatedSuccessRate: 85
      }
    ];
  }

  private calculateRecoveryTimeframe(
    phase: PersonalizedRecoveryPlan['phase'],
    strategy: PersonalizedRecoveryPlan['primaryStrategy']
  ): number {
    const baseDays = {
      crisis: 14,
      stabilizing: 21,
      rebuilding: 30,
      thriving: 7
    };

    const strategyMultipliers = {
      reduce: 0.8,
      pause: 1.2,
      bridge: 1.0,
      restart: 1.5
    };

    return Math.round(baseDays[phase] * strategyMultipliers[strategy]);
  }

  private generateSuccessMetrics(
    phase: PersonalizedRecoveryPlan['phase'],
    strategy: PersonalizedRecoveryPlan['primaryStrategy']
  ): PersonalizedRecoveryPlan['successMetrics'] {
    const targetRates = {
      crisis: 30,
      stabilizing: 50,
      rebuilding: 65,
      thriving: 80
    };

    const milestoneTemplates = {
      crisis: [
        { day: 3, goal: 'Complete any habit 3 days', celebration: 'You\'re taking care of yourself! 💛' },
        { day: 7, goal: 'One week of self-compassion', celebration: 'You\'re rebuilding with kindness!' },
        { day: 14, goal: 'Two weeks of gentle progress', celebration: 'You\'re finding your rhythm again!' }
      ],
      stabilizing: [
        { day: 7, goal: 'Establish morning anchor', celebration: 'Your foundation is strong! 🏛️' },
        { day: 14, goal: 'Consistent with 2-3 key habits', celebration: 'You\'re creating stability!' },
        { day: 21, goal: 'Three weeks of focused effort', celebration: 'Momentum is building! 📈' }
      ],
      rebuilding: [
        { day: 7, goal: 'Bridge back to main habits', celebration: 'You\'re reconnecting! 🌉' },
        { day: 14, goal: '50% completion rate', celebration: 'Solid progress! You\'re back!' },
        { day: 30, goal: 'Sustainable routine established', celebration: 'You\'ve rebuilt beautifully! 🏆' }
      ],
      thriving: [
        { day: 7, goal: 'Optimize existing habits', celebration: 'You\'re leveling up! ⚡' }
      ]
    };

    return {
      targetCompletionRate: targetRates[phase],
      milestones: milestoneTemplates[phase] || []
    };
  }

  private initializeRecoveryHabitsDatabase(): void {
    this.recoveryHabitsDatabase = [
      // Micro habits for immediate relief
      {
        id: 'micro-water',
        type: 'micro_habit',
        title: 'Drink One Glass of Water',
        description: 'Simple hydration to start positive momentum',
        category: 'health',
        timeMinutes: 1,
        difficulty: 'trivial',
        instructions: 'Fill a glass with water and drink it mindfully. Notice the taste and temperature.',
        whyEffective: 'Hydration improves cognitive function and creates an easy win to build momentum.',
        researchBacking: {
          principle: 'Hydration affects cognitive performance',
          source: 'Journal of Nutrition',
          citation: 'Ganio, M.S. et al. (2011). Mild dehydration impairs cognitive performance'
        },
        triggers: {
          applicableFor: ['motivation_drop', 'life_disruption'],
          recoveryPhase: 'immediate'
        },
        personalizable: false,
        estimatedSuccessRate: 98
      },

      {
        id: 'micro-gratitude',
        type: 'micro_habit',
        title: 'One Thing I\'m Grateful For',
        description: 'Notice one positive thing in your current situation',
        category: 'mindfulness',
        timeMinutes: 1,
        difficulty: 'trivial',
        instructions: 'Think of one thing you\'re grateful for right now. It can be as simple as having a roof over your head.',
        whyEffective: 'Gratitude shifts focus to positive aspects, improving mood and motivation.',
        researchBacking: {
          principle: 'Gratitude improves well-being and resilience',
          source: 'Positive Psychology research',
          citation: 'Emmons, R.A. & McCullough, M.E. (2003). Counting blessings versus burdens'
        },
        triggers: {
          applicableFor: ['motivation_drop', 'streak_broken', 'completion_decline'],
          recoveryPhase: 'immediate'
        },
        personalizable: false,
        estimatedSuccessRate: 92
      },

      // Bridge habits for reconnection
      {
        id: 'bridge-movement',
        type: 'bridge_habit',
        title: '2-Minute Movement',
        description: 'Any gentle movement to reconnect with your body',
        category: 'health',
        timeMinutes: 2,
        difficulty: 'trivial',
        instructions: 'Stretch, walk around your home, or do gentle movements. Listen to what your body needs.',
        whyEffective: 'Movement releases endorphins and helps break negative thought patterns.',
        researchBacking: {
          principle: 'Exercise improves mood and cognitive function',
          source: 'Harvard Health',
          citation: 'Harvard Health. (2018). Regular exercise changes the brain'
        },
        triggers: {
          applicableFor: ['streak_broken', 'motivation_drop'],
          recoveryPhase: 'rebuilding'
        },
        personalizable: true,
        estimatedSuccessRate: 87
      },

      // Anchor habits for stability
      {
        id: 'anchor-bed-making',
        type: 'anchor_habit',
        title: 'Make Your Bed',
        description: 'Start each day with a completed task',
        category: 'productivity',
        timeMinutes: 2,
        difficulty: 'easy',
        instructions: 'Make your bed as soon as you get up. Focus on creating one neat, accomplished space.',
        whyEffective: 'Bed-making creates immediate sense of achievement and order that cascades through the day.',
        researchBacking: {
          principle: 'Small wins create positive momentum',
          source: 'Admiral William McRaven',
          citation: 'McRaven, W. (2017). Make Your Bed: Little Things That Can Change Your Life'
        },
        triggers: {
          applicableFor: ['overcommitment', 'completion_decline'],
          recoveryPhase: 'rebuilding'
        },
        personalizable: false,
        estimatedSuccessRate: 81
      },

      // Reset habits for fresh starts
      {
        id: 'reset-evening-review',
        type: 'reset_habit',
        title: '2-Minute Evening Check-in',
        description: 'Gentle reflection to close the day with intention',
        category: 'mindfulness',
        timeMinutes: 2,
        difficulty: 'easy',
        instructions: 'Before sleep, ask: "What went well today?" and "What do I want to focus on tomorrow?"',
        whyEffective: 'Evening reflection helps process the day and set positive intentions for tomorrow.',
        researchBacking: {
          principle: 'Reflection improves learning and goal achievement',
          source: 'Harvard Business School',
          citation: 'Di Stefano, G. et al. (2014). Learning by thinking: How reflection aids performance'
        },
        triggers: {
          applicableFor: ['life_disruption', 'streak_broken'],
          recoveryPhase: 'rebuilding'
        },
        personalizable: true,
        estimatedSuccessRate: 79
      }
    ];
  }
}

export const recoveryHabitSuggestionService = new RecoveryHabitSuggestionService();