import { Habit, HabitProgress } from '../types';

export interface ResearchInsight {
  id: string;
  type: 'motivation' | 'technique' | 'troubleshooting' | 'scientific_backing' | 'optimization';
  context: string; // When to show this insight
  title: string;
  content: string;
  source: string;
  citation?: {
    authors: string;
    title: string;
    journal: string;
    year: number;
    doi?: string;
  };
  relevanceScore: number; // 0-1 based on user's current situation
  actionable: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ContextualTrigger {
  type: 'low_completion' | 'streak_break' | 'consistency_drop' | 'plateau' | 'difficulty_spike';
  threshold: number;
  timeframe: 'daily' | 'weekly' | 'monthly';
}

export interface UserContext {
  completionRate: number;
  currentStreak: number;
  streakBreaks: number;
  plateauDuration: number; // days without improvement
  difficultyLevel: string;
  strugglingHabits: string[];
  strengths: string[];
  recentChallenges: string[];
}

class ContextualResearchService {
  private researchDatabase: Map<string, ResearchInsight[]> = new Map();

  constructor() {
    this.initializeResearchDatabase();
  }

  /**
   * Get contextually relevant research insights based on user's current situation
   */
  async getContextualInsights(
    habit: Habit,
    progress: HabitProgress[],
    userContext: UserContext
  ): Promise<ResearchInsight[]> {
    const category = habit.category;
    const categoryInsights = this.researchDatabase.get(category) || [];
    
    // Filter insights based on current context
    const relevantInsights = categoryInsights.filter(insight => 
      this.isInsightRelevant(insight, habit, progress, userContext)
    );

    // Sort by relevance score
    relevantInsights.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return relevantInsights.slice(0, 3); // Return top 3 most relevant
  }

  /**
   * Get research insights for specific situations
   */
  async getInsightsForSituation(
    habit: Habit,
    situation: 'getting_started' | 'struggling' | 'plateauing' | 'optimizing' | 'recovering'
  ): Promise<ResearchInsight[]> {
    const category = habit.category;
    const categoryInsights = this.researchDatabase.get(category) || [];
    
    return categoryInsights.filter(insight => {
      switch (situation) {
        case 'getting_started':
          return insight.difficulty === 'beginner' && insight.actionable;
        case 'struggling':
          return insight.type === 'troubleshooting' || insight.type === 'motivation';
        case 'plateauing':
          return insight.type === 'optimization' || insight.type === 'technique';
        case 'optimizing':
          return insight.type === 'optimization' && insight.difficulty === 'advanced';
        case 'recovering':
          return insight.type === 'motivation' && insight.actionable;
        default:
          return true;
      }
    }).slice(0, 2);
  }

  /**
   * Get research-backed explanations for why habits work
   */
  async getScientificExplanation(habit: Habit): Promise<ResearchInsight[]> {
    const category = habit.category;
    const insights = this.researchDatabase.get(category) || [];
    
    return insights.filter(insight => 
      insight.type === 'scientific_backing'
    );
  }

  /**
   * Generate contextual tips based on user patterns
   */
  async generateContextualTips(
    habits: Habit[],
    progressData: HabitProgress[]
  ): Promise<ResearchInsight[]> {
    const tips: ResearchInsight[] = [];
    
    // Analyze patterns across all habits
    const overallCompletionRate = this.calculateOverallCompletionRate(progressData);
    const strugglingCategories = this.identifyStrugglingCategories(habits, progressData);
    
    // Generate category-specific tips for struggling areas
    strugglingCategories.forEach(category => {
      const categoryTips = this.researchDatabase.get(category) || [];
      const relevantTip = categoryTips.find(tip => 
        tip.type === 'troubleshooting' && tip.actionable
      );
      
      if (relevantTip) {
        tips.push({
          ...relevantTip,
          relevanceScore: 0.9 // High relevance for struggling areas
        });
      }
    });

    return tips;
  }

  /**
   * Check if an insight is relevant to current user context
   */
  private isInsightRelevant(
    insight: ResearchInsight,
    habit: Habit,
    progress: HabitProgress[],
    userContext: UserContext
  ): boolean {
    // Base relevance on completion rate
    if (userContext.completionRate < 0.5 && insight.type !== 'troubleshooting') {
      return false;
    }

    if (userContext.completionRate > 0.8 && insight.type === 'troubleshooting') {
      return false;
    }

    // Consider streak status
    if (userContext.currentStreak === 0 && insight.type === 'optimization') {
      return false;
    }

    // Match difficulty level
    if (insight.difficulty === 'advanced' && userContext.completionRate < 0.7) {
      return false;
    }

    return true;
  }

  /**
   * Calculate relevance score based on multiple factors
   */
  private calculateRelevanceScore(
    insight: ResearchInsight,
    habit: Habit,
    userContext: UserContext
  ): number {
    let score = 0.5; // Base score

    // Boost score based on type relevance
    if (userContext.completionRate < 0.5 && insight.type === 'troubleshooting') {
      score += 0.3;
    }

    if (userContext.completionRate > 0.8 && insight.type === 'optimization') {
      score += 0.2;
    }

    if (userContext.currentStreak === 0 && insight.type === 'motivation') {
      score += 0.3;
    }

    // Adjust for difficulty match
    if (insight.difficulty === 'beginner' && userContext.completionRate < 0.3) {
      score += 0.1;
    }

    if (insight.difficulty === 'advanced' && userContext.completionRate > 0.8) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Initialize the research database with insights for each category
   */
  private initializeResearchDatabase(): void {
    // Health category insights
    this.researchDatabase.set('health', [
      {
        id: 'health-start-small',
        type: 'technique',
        context: 'getting_started',
        title: 'Start Ridiculously Small',
        content: 'Research shows that starting with habits so small they seem trivial increases long-term success rates by 40%. Begin with just 2 minutes of exercise rather than 30.',
        source: 'BJ Fogg, Tiny Habits',
        citation: {
          authors: 'Fogg, B.J.',
          title: 'Tiny Habits: The Small Changes That Change Everything',
          journal: 'Book',
          year: 2019
        },
        relevanceScore: 0.9,
        actionable: true,
        difficulty: 'beginner'
      },
      {
        id: 'health-consistency-over-intensity',
        type: 'scientific_backing',
        context: 'struggling',
        title: 'Consistency Beats Intensity',
        content: 'A meta-analysis of exercise adherence studies found that people who exercised at moderate intensity for 15 minutes daily had 73% better long-term adherence than those doing intense 45-minute sessions 3x/week.',
        source: 'Journal of Behavioral Medicine',
        citation: {
          authors: 'Rhodes, R.E., et al.',
          title: 'Factors associated with exercise adherence among older adults',
          journal: 'Journal of Behavioral Medicine',
          year: 2017,
          doi: '10.1007/s10865-017-9509-9'
        },
        relevanceScore: 0.8,
        actionable: true,
        difficulty: 'intermediate'
      },
      {
        id: 'health-identity-shift',
        type: 'motivation',
        context: 'plateauing',
        title: 'Shift Your Identity',
        content: 'Instead of saying "I want to exercise," say "I am someone who exercises." Identity-based habits are 2x more likely to stick because they align with your self-concept rather than relying on motivation.',
        source: 'James Clear, Atomic Habits',
        citation: {
          authors: 'Clear, J.',
          title: 'Atomic Habits',
          journal: 'Book',
          year: 2018
        },
        relevanceScore: 0.7,
        actionable: true,
        difficulty: 'intermediate'
      }
    ]);

    // Mindfulness category insights
    this.researchDatabase.set('mindfulness', [
      {
        id: 'mindfulness-micro-sessions',
        type: 'technique',
        context: 'getting_started',
        title: 'Micro-Meditation is Effective',
        content: 'Studies show that even 3-minute meditation sessions produce measurable stress reduction and improved focus. Don\'t wait until you have 20 minutes free.',
        source: 'Mindfulness Research',
        citation: {
          authors: 'Zeidan, F., et al.',
          title: 'Brief mindfulness meditation training alters psychological and neuroendocrine responses to psychological stressors',
          journal: 'Psychoneuroendocrinology',
          year: 2014,
          doi: '10.1016/j.psyneuen.2014.01.016'
        },
        relevanceScore: 0.9,
        actionable: true,
        difficulty: 'beginner'
      },
      {
        id: 'mindfulness-anchor-habit',
        type: 'troubleshooting',
        context: 'struggling',
        title: 'Anchor to Existing Habits',
        content: 'Attach your meditation practice to something you already do consistently. "After I pour my morning coffee, I will sit and meditate for 3 minutes." This implementation intention increases success rates by 200-300%.',
        source: 'Implementation Intention Research',
        citation: {
          authors: 'Gollwitzer, P.M.',
          title: 'Implementation intentions: Strong effects of simple plans',
          journal: 'American Psychologist',
          year: 1999
        },
        relevanceScore: 0.8,
        actionable: true,
        difficulty: 'beginner'
      }
    ]);

    // Productivity category insights
    this.researchDatabase.set('productivity', [
      {
        id: 'productivity-pomodoro-research',
        type: 'scientific_backing',
        context: 'optimizing',
        title: 'The Science of Focus Intervals',
        content: 'Research on ultradian rhythms shows our brain naturally operates in 90-120 minute cycles. Breaking work into 25-50 minute focused intervals with breaks optimizes cognitive performance and reduces mental fatigue.',
        source: 'Cognitive Load Theory',
        citation: {
          authors: 'Sweller, J.',
          title: 'Cognitive load theory and complex learning',
          journal: 'Educational Psychology Review',
          year: 2019
        },
        relevanceScore: 0.7,
        actionable: true,
        difficulty: 'intermediate'
      },
      {
        id: 'productivity-environment-design',
        type: 'optimization',
        context: 'plateauing',
        title: 'Environment Shapes Behavior',
        content: 'Studies show that environmental cues account for 45% of daily behaviors. Optimize your workspace: remove distractions, place important tools within reach, and create visual reminders for priorities.',
        source: 'Environmental Psychology Research',
        citation: {
          authors: 'Wood, W., & Neal, D.T.',
          title: 'A new look at habits and the habit-goal interface',
          journal: 'Psychological Review',
          year: 2007
        },
        relevanceScore: 0.8,
        actionable: true,
        difficulty: 'advanced'
      }
    ]);

    // Cross-category insights
    ['health', 'mindfulness', 'productivity'].forEach(category => {
      const existingInsights = this.researchDatabase.get(category) || [];
      
      existingInsights.push({
        id: `${category}-habit-stacking`,
        type: 'technique',
        context: 'optimizing',
        title: 'Habit Stacking Works',
        content: 'Linking new habits to established ones increases success rates by 300%. Use the formula: "After I [existing habit], I will [new habit]." This leverages existing neural pathways.',
        source: 'Behavioral Psychology Research',
        citation: {
          authors: 'Duhigg, C.',
          title: 'The Power of Habit',
          journal: 'Book',
          year: 2012
        },
        relevanceScore: 0.8,
        actionable: true,
        difficulty: 'intermediate'
      });

      this.researchDatabase.set(category, existingInsights);
    });
  }

  // Helper methods

  private calculateOverallCompletionRate(progressData: HabitProgress[]): number {
    if (progressData.length === 0) return 0;
    
    const totalCompletions = progressData.reduce((sum, p) => sum + (p.totalCompletions || 0), 0);
    const totalPossible = progressData.reduce((sum, p) => sum + p.totalDays, 0);
    
    return totalPossible > 0 ? totalCompletions / totalPossible : 0;
  }

  private identifyStrugglingCategories(habits: Habit[], progressData: HabitProgress[]): string[] {
    const categoryRates: Map<string, { completed: number; total: number }> = new Map();
    
    habits.forEach(habit => {
      const habitProgress = progressData.find(p => p.habitId === habit.id);
      const completionRate = habitProgress ? 
        (habitProgress.totalCompletions || 0) / habitProgress.totalDays : 0;
      
      const existing = categoryRates.get(habit.category) || { completed: 0, total: 0 };
      categoryRates.set(habit.category, {
        completed: existing.completed + completionRate,
        total: existing.total + 1
      });
    });

    return Array.from(categoryRates.entries())
      .filter(([_, stats]) => (stats.completed / stats.total) < 0.5)
      .map(([category]) => category);
  }
}

export const contextualResearchService = new ContextualResearchService();