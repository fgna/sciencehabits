import React, { useState, useEffect } from 'react';
import { Habit, HabitProgress, User } from '../../types';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { recoveryService, MotivationalMessage } from '../../services/recoveryService';

interface ProgressMetric {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  significance: 'low' | 'medium' | 'high';
  context: string;
  researchNote?: string;
}

interface ProgressStory {
  title: string;
  narrative: string;
  highlights: string[];
  challenges: string[];
  nextSteps: string[];
  motivationalMessage: MotivationalMessage;
}

interface EnhancedProgressProps {
  user: User;
  habits: Habit[];
  progress: HabitProgress[];
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  onTimeframeChange: (timeframe: 'week' | 'month' | 'quarter' | 'year') => void;
}

export function EnhancedProgressCommunication({ 
  user, 
  habits, 
  progress, 
  timeframe,
  onTimeframeChange 
}: EnhancedProgressProps) {
  const { animationsEnabled, emotionalDesign } = useUIPreferencesStore();
  const [progressStory, setProgressStory] = useState<ProgressStory | null>(null);
  const [metrics, setMetrics] = useState<ProgressMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateProgressCommunication();
  }, [habits, progress, timeframe, user]);

  const generateProgressCommunication = async () => {
    setIsLoading(true);
    
    try {
      const calculatedMetrics = calculateProgressMetrics();
      const story = generateProgressStory(calculatedMetrics);
      
      setMetrics(calculatedMetrics);
      setProgressStory(story);
    } catch (error) {
      console.error('Failed to generate progress communication:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgressMetrics = (): ProgressMetric[] => {
    const now = new Date();
    const timeframeMs = getTimeframeMs(timeframe);
    const cutoffDate = new Date(now.getTime() - timeframeMs);

    // Overall completion rate
    const recentCompletions = progress.reduce((total, p) => {
      const recentDates = p.completions.filter(date => new Date(date) >= cutoffDate);
      return total + recentDates.length;
    }, 0);
    
    const totalPossibleDays = Math.floor(timeframeMs / (1000 * 60 * 60 * 24)) * habits.length;
    const completionRate = totalPossibleDays > 0 ? (recentCompletions / totalPossibleDays) * 100 : 0;

    // Streak metrics
    const activeStreaks = progress.filter(p => p.currentStreak > 0).length;
    const averageStreak = progress.reduce((sum, p) => sum + p.currentStreak, 0) / progress.length;
    const longestCurrentStreak = Math.max(...progress.map(p => p.currentStreak), 0);

    // Consistency score (how many days they completed at least one habit)
    const daysWithActivity = new Set();
    progress.forEach(p => {
      p.completions.forEach(date => {
        if (new Date(date) >= cutoffDate) {
          daysWithActivity.add(date);
        }
      });
    });
    
    const totalDaysInPeriod = Math.floor(timeframeMs / (1000 * 60 * 60 * 24));
    const consistencyScore = (daysWithActivity.size / totalDaysInPeriod) * 100;

    // Calculate trends (compare to previous period)
    const previousPeriodStart = new Date(cutoffDate.getTime() - timeframeMs);
    const previousCompletions = progress.reduce((total, p) => {
      const prevDates = p.completions.filter(date => {
        const d = new Date(date);
        return d >= previousPeriodStart && d < cutoffDate;
      });
      return total + prevDates.length;
    }, 0);
    
    const previousRate = totalPossibleDays > 0 ? (previousCompletions / totalPossibleDays) * 100 : 0;
    const completionTrend = completionRate - previousRate;

    return [
      {
        id: 'completion-rate',
        label: 'Completion Rate',
        value: completionRate,
        displayValue: `${Math.round(completionRate)}%`,
        trend: completionTrend > 5 ? 'up' : completionTrend < -5 ? 'down' : 'stable',
        trendValue: Math.abs(completionTrend),
        significance: completionTrend > 15 || completionTrend < -15 ? 'high' : 
                     completionTrend > 5 || completionTrend < -5 ? 'medium' : 'low',
        context: `${Math.round(recentCompletions)} habits completed out of ${totalPossibleDays} possible`,
        researchNote: completionRate >= 70 ? 'Excellent! Research shows 70%+ consistency leads to lasting habit formation.' : 
                     completionRate >= 50 ? 'Good progress! You\'re building sustainable habits.' :
                     'Building habits takes time. Even 30% consistency is valuable progress.'
      },
      {
        id: 'active-streaks',
        label: 'Active Streaks',
        value: activeStreaks,
        displayValue: `${activeStreaks} habits`,
        trend: 'stable',
        trendValue: 0,
        significance: activeStreaks >= habits.length * 0.7 ? 'high' : 'medium',
        context: `${activeStreaks} out of ${habits.length} habits have active streaks`,
        researchNote: 'Streaks create positive momentum and strengthen neural pathways for habit formation.'
      },
      {
        id: 'consistency-score',
        label: 'Daily Consistency',
        value: consistencyScore,
        displayValue: `${Math.round(consistencyScore)}%`,
        trend: 'stable',
        trendValue: 0,
        significance: consistencyScore >= 80 ? 'high' : consistencyScore >= 60 ? 'medium' : 'low',
        context: `Active on ${daysWithActivity.size} out of ${totalDaysInPeriod} days`,
        researchNote: 'Showing up daily, even for small actions, builds the identity of someone who follows through.'
      },
      {
        id: 'longest-streak',
        label: 'Best Current Streak',
        value: longestCurrentStreak,
        displayValue: `${longestCurrentStreak} days`,
        trend: 'stable',
        trendValue: 0,
        significance: longestCurrentStreak >= 21 ? 'high' : longestCurrentStreak >= 7 ? 'medium' : 'low',
        context: longestCurrentStreak > 0 ? 'Keep it going!' : 'Ready to start a new streak?',
        researchNote: 'Research shows it takes 18-254 days to form a habit, with an average of 66 days.'
      }
    ];
  };

  const generateProgressStory = (metrics: ProgressMetric[]): ProgressStory => {
    const completionRate = metrics.find(m => m.id === 'completion-rate')?.value || 0;
    const activeStreaks = metrics.find(m => m.id === 'active-streaks')?.value || 0;
    const consistencyScore = metrics.find(m => m.id === 'consistency-score')?.value || 0;
    const longestStreak = metrics.find(m => m.id === 'longest-streak')?.value || 0;

    // Generate narrative based on performance
    let title = '';
    let narrative = '';
    let highlights: string[] = [];
    let challenges: string[] = [];
    let nextSteps: string[] = [];

    if (completionRate >= 80 && consistencyScore >= 80) {
      title = 'Exceptional Progress! 🌟';
      narrative = `You're absolutely crushing it! With an ${Math.round(completionRate)}% completion rate and showing up ${Math.round(consistencyScore)}% of days, you've built incredible momentum. Your consistency is in the top tier of habit builders.`;
      highlights = [
        `Maintained ${activeStreaks} active streaks`,
        `${Math.round(consistencyScore)}% daily consistency`,
        'Building strong neural pathways through repetition'
      ];
      nextSteps = [
        'Consider adding a new challenging habit',
        'Share your success strategy with others',
        'Reflect on how these habits are improving your life'
      ];
    } else if (completionRate >= 60 && consistencyScore >= 60) {
      title = 'Strong Foundation Building 💪';
      narrative = `You're building solid habits! A ${Math.round(completionRate)}% completion rate shows you're developing consistency. Your ${Math.round(consistencyScore)}% daily engagement demonstrates real commitment to change.`;
      highlights = [
        `Consistent effort with ${Math.round(completionRate)}% completion rate`,
        `Active engagement ${Math.round(consistencyScore)}% of the time`,
        longestStreak > 0 ? `Longest current streak: ${longestStreak} days` : 'Building momentum'
      ];
      if (completionRate < 70) {
        challenges = ['Room to improve completion rate', 'Some habits may need adjustment'];
      }
      nextSteps = [
        'Focus on your most important 2-3 habits',
        'Identify patterns in your most successful days',
        'Consider if any habits need difficulty adjustments'
      ];
    } else if (completionRate >= 40) {
      title = 'Finding Your Rhythm 🎯';
      narrative = `You're in the learning phase of habit building. A ${Math.round(completionRate)}% completion rate shows you're experimenting and finding what works. This exploration is valuable and normal.`;
      highlights = [
        'Actively experimenting with habit formation',
        activeStreaks > 0 ? `${activeStreaks} habits showing positive momentum` : 'Learning what works for you',
        'Building awareness of your patterns'
      ];
      challenges = [
        'Completion rate has room for improvement',
        'May benefit from reducing complexity',
        'Finding the right difficulty balance'
      ];
      nextSteps = [
        'Focus on just 1-2 keystone habits',
        'Make habits smaller and easier',
        'Identify your best times and contexts for success'
      ];
    } else {
      title = 'Every Expert Was Once a Beginner 🌱';
      narrative = `You're at the beginning of your habit journey, and that takes courage. Starting is the hardest part, and you've already taken that step. Every small action is building the foundation for lasting change.`;
      highlights = [
        'Taking the brave step to build new habits',
        'Learning about yourself and what motivates you',
        'Each attempt is valuable data for improvement'
      ];
      challenges = [
        'Building initial momentum',
        'Finding sustainable approaches',
        'Overcoming initial resistance'
      ];
      nextSteps = [
        'Start with one tiny habit (2 minutes max)',
        'Focus on showing up rather than perfection',
        'Celebrate every small win'
      ];
    }

    // Generate motivational message based on performance
    let motivationalContext: MotivationalMessage['context'];
    if (longestStreak >= 7) {
      motivationalContext = 'streak_continue';
    } else if (longestStreak >= 1) {
      motivationalContext = 'streak_start';
    } else if (completionRate < 30) {
      motivationalContext = 'struggle';
    } else {
      motivationalContext = 'encouragement';
    }

    const motivationalMessage = recoveryService.generateMotivationalMessage(
      motivationalContext,
      progress[0], // Use first habit's progress as example
      habits[0]
    );

    return {
      title,
      narrative,
      highlights,
      challenges,
      nextSteps,
      motivationalMessage
    };
  };

  const getTimeframeMs = (timeframe: string): number => {
    const day = 1000 * 60 * 60 * 24;
    switch (timeframe) {
      case 'week': return day * 7;
      case 'month': return day * 30;
      case 'quarter': return day * 90;
      case 'year': return day * 365;
      default: return day * 30;
    }
  };

  const getMetricIcon = (metric: ProgressMetric): string => {
    switch (metric.id) {
      case 'completion-rate': return '📊';
      case 'active-streaks': return '🔥';
      case 'consistency-score': return '📅';
      case 'longest-streak': return '🏆';
      default: return '📈';
    }
  };

  const getTrendIcon = (trend: ProgressMetric['trend']): string => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '→';
    }
  };

  const getSignificanceColor = (significance: ProgressMetric['significance']): string => {
    switch (significance) {
      case 'high': return 'text-compassion-600';
      case 'medium': return 'text-progress-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-progress-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with timeframe selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Your Progress Story</h1>
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          {['week', 'month', 'quarter', 'year'].map(tf => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf as any)}
              className={`
                px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize
                ${timeframe === tf 
                  ? 'bg-white text-progress-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Progress story */}
      {progressStory && (
        <div className="bg-gradient-to-br from-compassion-50 to-progress-50 rounded-xl p-6 border border-compassion-200">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {progressStory.title}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {progressStory.narrative}
            </p>
          </div>

          {/* Motivational message */}
          <div className="bg-white/80 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="text-2xl mr-3">💝</div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Daily Inspiration</h3>
                <p className="text-sm text-gray-700">
                  {progressStory.motivationalMessage.message}
                </p>
                {progressStory.motivationalMessage.researchBased && (
                  <div className="mt-2 flex items-center text-xs text-research-600">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Research-backed insight
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Highlights and challenges */}
          <div className="grid md:grid-cols-2 gap-4">
            {progressStory.highlights.length > 0 && (
              <div>
                <h4 className="font-medium text-compassion-800 mb-2">🌟 Highlights</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {progressStory.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-compassion-500 mr-2">•</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {progressStory.challenges.length > 0 && (
              <div>
                <h4 className="font-medium text-recovery-800 mb-2">💪 Growth Areas</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {progressStory.challenges.map((challenge, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-recovery-500 mr-2">•</span>
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Next steps */}
          {progressStory.nextSteps.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-progress-800 mb-2">🎯 Recommended Next Steps</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {progressStory.nextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-progress-500 mr-2">•</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(metric => (
          <div key={metric.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">{getMetricIcon(metric)}</div>
              <div className="flex items-center text-sm text-gray-500">
                {getTrendIcon(metric.trend)}
                {metric.trendValue > 0 && (
                  <span className="ml-1">
                    {metric.trend === 'up' ? '+' : '-'}{Math.round(metric.trendValue)}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="mb-2">
              <div className={`text-2xl font-bold ${getSignificanceColor(metric.significance)}`}>
                {metric.displayValue}
              </div>
              <div className="text-sm font-medium text-gray-700">
                {metric.label}
              </div>
            </div>
            
            <div className="text-xs text-gray-600 mb-2">
              {metric.context}
            </div>
            
            {metric.researchNote && (
              <div className="text-xs text-research-600 bg-research-50 rounded p-2">
                <div className="flex items-start">
                  <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {metric.researchNote}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Visual progress timeline - placeholder for future implementation */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Progress Timeline</h3>
        <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-sm">Visual timeline coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}