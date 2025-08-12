import React, { useState, useEffect } from 'react';
import { Habit, HabitProgress, User } from '../../types';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { recoveryService, MotivationalMessage } from '../../services/recoveryService';

interface MotivationalCard {
  id: string;
  message: MotivationalMessage;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: string;
  actions?: {
    primary?: {
      label: string;
      action: () => void;
    };
    secondary?: {
      label: string;
      action: () => void;
    };
  };
  dismissible: boolean;
}

interface MotivationalMessagingProps {
  user: User;
  habits: Habit[];
  progress: HabitProgress[];
  currentContext: {
    timeOfDay: 'morning' | 'midday' | 'evening' | 'night';
    dayOfWeek: string;
    isWeekend: boolean;
    recentActivity: 'active' | 'declining' | 'struggling' | 'recovering';
  };
  onDismiss?: (cardId: string) => void;
  onAction?: (cardId: string, actionType: 'primary' | 'secondary') => void;
}

export function MotivationalMessagingSystem({
  user,
  habits,
  progress,
  currentContext,
  onDismiss,
  onAction
}: MotivationalMessagingProps) {
  const { animationsEnabled, emotionalDesign } = useUIPreferencesStore();
  const [motivationalCards, setMotivationalCards] = useState<MotivationalCard[]>([]);
  const [dismissedCards, setDismissedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateMotivationalCards();
  }, [habits, progress, currentContext, user]);

  const generateMotivationalCards = async () => {
    const cards: MotivationalCard[] = [];
    const now = new Date();

    // Generate different types of motivational messages based on context

    // 1. Daily check-in messages
    if (currentContext.timeOfDay === 'morning') {
      const todayProgress = progress.filter(p => {
        const lastCompletion = p.lastCompletionDate ? new Date(p.lastCompletionDate) : null;
        return lastCompletion && lastCompletion.toDateString() === now.toDateString();
      });

      if (todayProgress.length === 0) {
        cards.push(createDailyStartCard());
      } else if (todayProgress.length < habits.length * 0.5) {
        cards.push(createMidDayBoostCard(todayProgress.length, habits.length));
      } else {
        cards.push(createGreatStartCard(todayProgress.length, habits.length));
      }
    }

    // 2. Streak celebration and recovery messages
    progress.forEach(habitProgress => {
      const habit = habits.find(h => h.id === habitProgress.habitId);
      if (!habit) return;

      // Celebrate milestones
      if (habitProgress.currentStreak === 7 || habitProgress.currentStreak === 30 || habitProgress.currentStreak === 100) {
        cards.push(createStreakMilestoneCard(habit, habitProgress));
      }

      // Recovery encouragement for broken streaks
      if (habitProgress.longestStreak >= 7 && habitProgress.currentStreak === 0) {
        const daysSinceLast = habitProgress.lastCompletionDate 
          ? (now.getTime() - new Date(habitProgress.lastCompletionDate).getTime()) / (1000 * 60 * 60 * 24)
          : 999;
        
        if (daysSinceLast <= 3) {
          cards.push(createStreakRecoveryCard(habit, habitProgress));
        }
      }

      // Struggling habit support
      const recentCompletions = habitProgress.completions.slice(-14).length;
      if (recentCompletions <= 3 && (habitProgress.totalCompletions ?? 0) >= 5) {
        cards.push(createStruggleSupport(habit, habitProgress));
      }
    });

    // 3. Weekly and weekend messages
    if (currentContext.isWeekend) {
      cards.push(createWeekendReflectionCard());
    }

    if (currentContext.dayOfWeek === 'Monday' && currentContext.timeOfDay === 'morning') {
      cards.push(createWeeklyMotivationCard());
    }

    // 4. Research-backed insights
    if (Math.random() < 0.3) { // 30% chance to show research insight
      cards.push(createResearchInsightCard());
    }

    // 5. Seasonal and contextual messages
    cards.push(...generateContextualMessages());

    // Filter out dismissed cards and sort by priority
    const activeCards = cards
      .filter(card => !dismissedCards.has(card.id))
      .filter(card => !card.expiresAt || new Date(card.expiresAt) > now)
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 3); // Show max 3 cards at once

    setMotivationalCards(activeCards);
  };

  const createDailyStartCard = (): MotivationalCard => {
    const messages = [
      "Today is a fresh start. What one small habit will you focus on first? 🌅",
      "Every expert was once a beginner. Every pro was once an amateur. Today, you begin again. ✨",
      "Your future self is rooting for the choices you make today. Let's make them count! 💪",
      "Small actions, repeated consistently, create extraordinary results. Ready to start? 🚀"
    ];

    return {
      id: `daily-start-${Date.now()}`,
      message: {
        id: 'daily-start',
        context: 'encouragement',
        tone: 'inspiring',
        message: messages[Math.floor(Math.random() * messages.length)],
        researchBased: false,
        personalizable: false,
        triggers: {}
      },
      priority: 'medium',
      actions: {
        primary: {
          label: 'View Today\'s Habits',
          action: () => onAction?.('daily-start', 'primary')
        }
      },
      dismissible: true
    };
  };

  const createMidDayBoostCard = (completed: number, total: number): MotivationalCard => {
    return {
      id: `midday-boost-${Date.now()}`,
      message: {
        id: 'midday-boost',
        context: 'encouragement',
        tone: 'encouraging',
        message: `You've completed ${completed} out of ${total} habits today. Every completion strengthens your commitment muscle! 💪`,
        researchBased: true,
        personalizable: true,
        triggers: {}
      },
      priority: 'medium',
      actions: {
        primary: {
          label: 'Continue Building',
          action: () => onAction?.('midday-boost', 'primary')
        }
      },
      dismissible: true
    };
  };

  const createGreatStartCard = (completed: number, total: number): MotivationalCard => {
    return {
      id: `great-start-${Date.now()}`,
      message: {
        id: 'great-start',
        context: 'milestone',
        tone: 'celebratory',
        message: `Fantastic! ${completed} out of ${total} habits completed. You're building unstoppable momentum! 🎉`,
        researchBased: false,
        personalizable: true,
        triggers: {}
      },
      priority: 'high',
      dismissible: true
    };
  };

  const createStreakMilestoneCard = (habit: Habit, progress: HabitProgress): MotivationalCard => {
    const milestoneMessages = {
      7: "One week strong! Your brain is forming new neural pathways. Science says you're building real change! 🧠✨",
      30: "30 days! You've officially built a habit. Research shows this is when behaviors become more automatic. Incredible work! 🏆",
      100: "100 DAYS! You're in the elite tier of habit builders. This is life-changing consistency. You're inspiring! 🌟"
    };

    return {
      id: `streak-milestone-${habit.id}-${progress.currentStreak}`,
      message: {
        id: `streak-${progress.currentStreak}`,
        context: 'milestone',
        tone: 'celebratory',
        message: milestoneMessages[progress.currentStreak as keyof typeof milestoneMessages] || 
                `${progress.currentStreak} days of ${habit.title}! You're proving to yourself that you're someone who follows through. 🔥`,
        researchBased: progress.currentStreak === 7 || progress.currentStreak === 30,
        personalizable: true,
        triggers: { streakLength: progress.currentStreak }
      },
      priority: progress.currentStreak >= 30 ? 'urgent' : 'high',
      actions: {
        primary: {
          label: 'Share This Win',
          action: () => onAction?.(`streak-milestone-${habit.id}`, 'primary')
        },
        secondary: {
          label: 'Keep Building',
          action: () => onAction?.(`streak-milestone-${habit.id}`, 'secondary')
        }
      },
      dismissible: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
  };

  const createStreakRecoveryCard = (habit: Habit, progress: HabitProgress): MotivationalCard => {
    return {
      id: `streak-recovery-${habit.id}`,
      message: {
        id: 'streak-recovery',
        context: 'streak_recovery',
        tone: 'gentle',
        message: `Your ${progress.longestStreak}-day streak with ${habit.title} was amazing! Breaks happen to everyone. Your brain still remembers - you're rebuilding, not starting over. 💛`,
        researchBased: true,
        personalizable: true,
        triggers: {}
      },
      priority: 'high',
      actions: {
        primary: {
          label: 'Restart Gently',
          action: () => onAction?.(`streak-recovery-${habit.id}`, 'primary')
        }
      },
      dismissible: true
    };
  };

  const createStruggleSupport = (habit: Habit, progress: HabitProgress): MotivationalCard => {
    return {
      id: `struggle-support-${habit.id}`,
      message: {
        id: 'struggle-support',
        context: 'struggle',
        tone: 'understanding',
        message: `${habit.title} has been challenging lately. That's completely normal! Even small steps count. Consider making it easier for now - progress over perfection. 🤗`,
        researchBased: true,
        personalizable: true,
        triggers: {}
      },
      priority: 'medium',
      actions: {
        primary: {
          label: 'Adjust Habit',
          action: () => onAction?.(`struggle-support-${habit.id}`, 'primary')
        },
        secondary: {
          label: 'Get Tips',
          action: () => onAction?.(`struggle-support-${habit.id}`, 'secondary')
        }
      },
      dismissible: true
    };
  };

  const createWeekendReflectionCard = (): MotivationalCard => {
    return {
      id: `weekend-reflection-${Date.now()}`,
      message: {
        id: 'weekend-reflection',
        context: 'encouragement',
        tone: 'supportive',
        message: "Weekends are perfect for reflection. How did your habits feel this week? What's one small improvement you could make? 🌟",
        researchBased: false,
        personalizable: false,
        triggers: {}
      },
      priority: 'low',
      actions: {
        primary: {
          label: 'Review Week',
          action: () => onAction?.('weekend-reflection', 'primary')
        }
      },
      dismissible: true
    };
  };

  const createWeeklyMotivationCard = (): MotivationalCard => {
    const messages = [
      "New week, fresh energy! This week, focus on progress over perfection. You've got this! 💪",
      "Monday motivation: You don't have to be perfect, you just have to be consistent. Ready to build? 🚀",
      "Week ahead looks bright! Remember: small, consistent actions compound into life-changing results. ✨"
    ];

    return {
      id: `weekly-motivation-${Date.now()}`,
      message: {
        id: 'weekly-motivation',
        context: 'encouragement',
        tone: 'motivational',
        message: messages[Math.floor(Math.random() * messages.length)],
        researchBased: false,
        personalizable: false,
        triggers: {}
      },
      priority: 'medium',
      dismissible: true
    };
  };

  const createResearchInsightCard = (): MotivationalCard => {
    const insights = [
      {
        message: "Research shows it takes 18-254 days to form a habit (average: 66 days). Be patient with yourself - you're rewiring your brain! 🧠",
        researchBased: true
      },
      {
        message: "Studies prove that people who track their habits are 2x more likely to achieve their goals. You're already ahead by being here! 📊",
        researchBased: true
      },
      {
        message: "Self-compassion increases motivation more than self-criticism, according to research. Be kind to yourself today. 💛",
        researchBased: true
      },
      {
        message: "Small wins trigger dopamine release, making you more likely to continue. Celebrate every completion, no matter how small! 🎉",
        researchBased: true
      }
    ];

    const insight = insights[Math.floor(Math.random() * insights.length)];

    return {
      id: `research-insight-${Date.now()}`,
      message: {
        id: 'research-insight',
        context: 'encouragement',
        tone: 'inspiring',
        message: insight.message,
        researchBased: insight.researchBased,
        personalizable: false,
        triggers: {}
      },
      priority: 'low',
      actions: {
        secondary: {
          label: 'Learn More',
          action: () => onAction?.('research-insight', 'secondary')
        }
      },
      dismissible: true
    };
  };

  const generateContextualMessages = (): MotivationalCard[] => {
    const cards: MotivationalCard[] = [];

    // Time-of-day contextual messages
    if (currentContext.timeOfDay === 'evening') {
      cards.push({
        id: `evening-reflection-${Date.now()}`,
        message: {
          id: 'evening-reflection',
          context: 'encouragement',
          tone: 'supportive',
          message: "End your day with gratitude. What's one habit you're proud of building? Tomorrow is another chance to grow. 🌙",
          researchBased: false,
          personalizable: false,
          triggers: {}
        },
        priority: 'low',
        dismissible: true
      });
    }

    return cards;
  };

  const handleDismiss = (cardId: string) => {
    setDismissedCards(prev => new Set([...prev, cardId]));
    setMotivationalCards(prev => prev.filter(card => card.id !== cardId));
    onDismiss?.(cardId);
  };

  const getCardStyles = (priority: MotivationalCard['priority']) => {
    const baseStyles = `
      rounded-xl border-2 p-4 transition-all duration-300
      ${animationsEnabled ? 'transform hover:scale-[1.01] hover:shadow-lg' : ''}
    `;

    switch (priority) {
      case 'urgent':
        return `${baseStyles} bg-gradient-to-r from-compassion-50 to-progress-50 border-compassion-300 shadow-md`;
      case 'high':
        return `${baseStyles} bg-compassion-50 border-compassion-200`;
      case 'medium':
        return `${baseStyles} bg-progress-50 border-progress-200`;
      case 'low':
        return `${baseStyles} bg-gray-50 border-gray-200`;
      default:
        return `${baseStyles} bg-white border-gray-200`;
    }
  };

  const getToneColor = (tone: MotivationalMessage['tone']) => {
    switch (tone) {
      case 'celebratory': return 'text-compassion-700';
      case 'inspiring': return 'text-progress-700';
      case 'encouraging': return 'text-progress-600';
      case 'motivational': return 'text-progress-700';
      case 'supportive': return 'text-recovery-600';
      case 'gentle': return 'text-recovery-700';
      case 'understanding': return 'text-recovery-600';
      default: return 'text-gray-700';
    }
  };

  if (motivationalCards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Motivation</h2>
      
      {motivationalCards.map(card => (
        <div
          key={card.id}
          className={getCardStyles(card.priority)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-3">
              <p className={`text-sm leading-relaxed ${getToneColor(card.message.tone)}`}>
                {card.message.message}
              </p>
              
              {card.message.researchBased && (
                <div className="mt-2 flex items-center text-xs text-research-600">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Research-backed
                </div>
              )}
            </div>
            
            {card.dismissible && (
              <button
                onClick={() => handleDismiss(card.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Dismiss message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {card.actions && (
            <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-gray-200/50">
              {card.actions.secondary && (
                <button
                  onClick={() => {
                    card.actions?.secondary?.action();
                    onAction?.(card.id, 'secondary');
                  }}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {card.actions.secondary.label}
                </button>
              )}
              {card.actions.primary && (
                <button
                  onClick={() => {
                    card.actions?.primary?.action();
                    onAction?.(card.id, 'primary');
                  }}
                  className="px-3 py-1 text-xs bg-progress-600 text-white rounded-md hover:bg-progress-700 transition-colors"
                >
                  {card.actions.primary.label}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}