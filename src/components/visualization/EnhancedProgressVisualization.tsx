import React, { useState, useMemo } from 'react';
import { Habit, HabitProgress, User } from '../../types';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';

interface VisualizationProps {
  habits: Habit[];
  progress: HabitProgress[];
  user: User;
  timeframe: 'week' | 'month' | 'quarter' | 'year';
}

interface StreakVisualization {
  habitId: string;
  habitTitle: string;
  currentStreak: number;
  longestStreak: number;
  streakHistory: Array<{
    date: string;
    streakLength: number;
    isActive: boolean;
  }>;
  category: string;
  color: string;
}

interface CompletionHeatmap {
  date: string;
  completionCount: number;
  maxPossible: number;
  intensity: number; // 0-1
  tooltip: string;
}

interface CategoryProgress {
  category: string;
  completionRate: number;
  totalHabits: number;
  completedHabits: number;
  color: string;
  habits: Array<{
    title: string;
    completionRate: number;
  }>;
}

export function EnhancedProgressVisualization({ habits, progress, user, timeframe }: VisualizationProps) {
  const { animationsEnabled, emotionalDesign } = useUIPreferencesStore();
  const [activeView, setActiveView] = useState<'streaks' | 'heatmap' | 'categories' | 'trends'>('streaks');


  // Calculate streak visualizations
  const streakData = useMemo((): StreakVisualization[] => {
    return habits.map(habit => {
      const habitProgress = progress.find(p => p.habitId === habit.id);
      
      if (!habitProgress) {
        return {
          habitId: habit.id,
          habitTitle: habit.title,
          currentStreak: 0,
          longestStreak: 0,
          streakHistory: [],
          category: habit.category,
          color: getCategoryColor(habit.category)
        };
      }

      // Generate streak history from completions
      const streakHistory = generateStreakHistory(habitProgress.completions);

      return {
        habitId: habit.id,
        habitTitle: habit.title,
        currentStreak: habitProgress.currentStreak,
        longestStreak: habitProgress.longestStreak || habitProgress.currentStreak,
        streakHistory,
        category: habit.category,
        color: getCategoryColor(habit.category)
      };
    });
  }, [habits, progress]);

  // Calculate completion heatmap
  const heatmapData = useMemo((): CompletionHeatmap[] => {
    const days = getTimeframeDays(timeframe);
    const heatmap: CompletionHeatmap[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      let completionCount = 0;
      const maxPossible = habits.length;

      progress.forEach(p => {
        if (p.completions.includes(dateStr)) {
          completionCount++;
        }
      });

      const intensity = maxPossible > 0 ? completionCount / maxPossible : 0;

      heatmap.push({
        date: dateStr,
        completionCount,
        maxPossible,
        intensity,
        tooltip: `${date.toLocaleDateString()}: ${completionCount}/${maxPossible} habits completed`
      });
    }

    return heatmap;
  }, [habits, progress, timeframe]);

  // Calculate category progress
  const categoryData = useMemo((): CategoryProgress[] => {
    const categories = new Map<string, {
      habits: Habit[];
      progress: HabitProgress[];
    }>();

    habits.forEach(habit => {
      if (!categories.has(habit.category)) {
        categories.set(habit.category, { habits: [], progress: [] });
      }
      categories.get(habit.category)!.habits.push(habit);
      
      const habitProgress = progress.find(p => p.habitId === habit.id);
      if (habitProgress) {
        categories.get(habit.category)!.progress.push(habitProgress);
      }
    });

    return Array.from(categories.entries()).map(([category, data]) => {
      const totalCompletions = data.progress.reduce((sum, p) => sum + p.completions.length, 0);
      const totalPossible = data.habits.length * getTimeframeDays(timeframe);
      const completionRate = totalPossible > 0 ? totalCompletions / totalPossible : 0;
      
      const habitDetails = data.habits.map(habit => {
        const habitProgress = data.progress.find(p => p.habitId === habit.id);
        const habitCompletions = habitProgress ? habitProgress.completions.length : 0;
        const habitPossible = getTimeframeDays(timeframe);
        return {
          title: habit.title,
          completionRate: habitPossible > 0 ? habitCompletions / habitPossible : 0
        };
      });

      return {
        category,
        completionRate,
        totalHabits: data.habits.length,
        completedHabits: data.progress.filter(p => p.currentStreak > 0).length,
        color: getCategoryColor(category),
        habits: habitDetails
      };
    });
  }, [habits, progress, timeframe]);

  function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      health: 'bg-compassion-500',
      mindfulness: 'bg-recovery-500',
      productivity: 'bg-progress-500',
      learning: 'bg-research-500',
      creativity: 'bg-orange-500',
      social: 'bg-purple-500',
      default: 'bg-gray-500'
    };
    return colors[category] || colors.default;
  }

  function getTimeframeDays(timeframe: string): number {
    switch (timeframe) {
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
      default: return 30;
    }
  }

  function generateStreakHistory(completions: string[]): StreakVisualization['streakHistory'] {
    // Simple implementation - in a real app, this would be more sophisticated
    return completions.slice(-30).map((date, index) => ({
      date,
      streakLength: index + 1,
      isActive: true
    }));
  }

  function getIntensityColor(intensity: number): string {
    if (intensity === 0) return 'bg-gray-100';
    if (intensity <= 0.25) return 'bg-progress-200';
    if (intensity <= 0.5) return 'bg-progress-400';
    if (intensity <= 0.75) return 'bg-progress-600';
    return 'bg-progress-800';
  }

  const renderStreakView = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Habit Streaks</h3>
      
      {streakData.map(streak => (
        <div key={streak.habitId} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${streak.color.replace('bg-', 'bg-')} mr-3`}></div>
              <h4 className="font-medium text-gray-900">{streak.habitTitle}</h4>
            </div>
            <div className="text-sm text-gray-500 capitalize">{streak.category}</div>
          </div>

          {/* Streak stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-compassion-600">
                {streak.currentStreak}
              </div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-progress-600">
                {streak.longestStreak}
              </div>
              <div className="text-sm text-gray-600">Best Streak</div>
            </div>
          </div>

          {/* Streak visualization */}
          <div className="flex space-x-1 overflow-x-auto">
            {Array.from({ length: Math.min(30, streak.longestStreak || 30) }, (_, i) => (
              <div
                key={i}
                className={`
                  w-3 h-8 rounded-sm flex-shrink-0 transition-all duration-200
                  ${i < streak.currentStreak 
                    ? streak.color.replace('500', '400') 
                    : 'bg-gray-200'
                  }
                  ${animationsEnabled ? 'hover:scale-110' : ''}
                `}
                title={`Day ${i + 1}`}
              />
            ))}
          </div>

          {/* Streak insights */}
          <div className="mt-4 p-3 bg-compassion-50 rounded-lg">
            <p className="text-sm text-compassion-800">
              {streak.currentStreak === 0 
                ? "Ready to start a new streak! Every expert was once a beginner."
                : streak.currentStreak >= 21
                ? `Incredible! You're in the habit formation zone. Research shows 21+ days creates lasting change.`
                : streak.currentStreak >= 7
                ? `Great momentum! You're building neural pathways for long-term success.`
                : `Strong start! Each day makes the next one easier.`
              }
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderHeatmapView = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Heatmap</h3>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Heatmap grid */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs text-gray-600 font-medium p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {heatmapData.map((day, index) => (
            <div
              key={day.date}
              className={`
                w-8 h-8 rounded-sm flex items-center justify-center text-xs font-medium
                ${getIntensityColor(day.intensity)}
                ${day.intensity > 0.5 ? 'text-white' : 'text-gray-600'}
                ${animationsEnabled ? 'hover:scale-110 transition-transform duration-200' : ''}
                cursor-pointer
              `}
              title={day.tooltip}
            >
              {day.completionCount}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">Less</div>
          <div className="flex space-x-1">
            {[0, 0.25, 0.5, 0.75, 1].map(intensity => (
              <div
                key={intensity}
                className={`w-3 h-3 rounded-sm ${getIntensityColor(intensity)}`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-600">More</div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-compassion-600">
            {Math.round(heatmapData.reduce((sum, day) => sum + day.intensity, 0) / heatmapData.length * 100)}%
          </div>
          <div className="text-sm text-gray-600">Average Daily</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-progress-600">
            {heatmapData.filter(day => day.intensity >= 0.8).length}
          </div>
          <div className="text-sm text-gray-600">Great Days</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-research-600">
            {Math.max(...heatmapData.map(day => day.completionCount), 0)}
          </div>
          <div className="text-sm text-gray-600">Best Day</div>
        </div>
      </div>
    </div>
  );

  const renderCategoriesView = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress by Category</h3>
      
      {categoryData.map(category => (
        <div key={category.category} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full ${category.color} mr-3`}></div>
              <h4 className="font-medium text-gray-900 capitalize">{category.category}</h4>
            </div>
            <div className="text-sm text-gray-600">
              {category.completedHabits}/{category.totalHabits} active
            </div>
          </div>

          {/* Category completion rate */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Overall completion rate</span>
              <span className="font-medium">{Math.round(category.completionRate * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${category.color} transition-all duration-500`}
                style={{ width: `${category.completionRate * 100}%` }}
              />
            </div>
          </div>

          {/* Individual habit progress */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-2">Individual Habits</div>
            {category.habits.map((habit, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600 truncate flex-1 mr-4">
                  {habit.title}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${category.color} transition-all duration-300`}
                      style={{ width: `${habit.completionRate * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">
                    {Math.round(habit.completionRate * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderTrendsView = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Trends & Insights</h3>
      
      <div className="bg-gradient-to-r from-compassion-50 to-progress-50 rounded-lg p-6 border border-compassion-200">
        <h4 className="font-semibold text-gray-900 mb-4">Your Progress Story</h4>
        
        {/* Weekly progress trend */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dayData = heatmapData.find(d => d.date === date.toISOString().split('T')[0]);
            const intensity = dayData?.intensity || 0;
            
            return (
              <div key={i} className="text-center">
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium mb-1 ${
                    getIntensityColor(intensity)
                  } ${intensity > 0.5 ? 'text-white' : 'text-gray-600'}`}
                >
                  {dayData?.completionCount || 0}
                </div>
                <div className="text-xs text-gray-600">
                  {date.toLocaleDateString('en', { weekday: 'short' })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/80 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">🔥</span>
              <span className="font-medium text-gray-900">Best Performing</span>
            </div>
            <p className="text-sm text-gray-700">
              {categoryData.sort((a, b) => b.completionRate - a.completionRate)[0]?.category || 'No data'} habits are your strongest area
            </p>
          </div>

          <div className="bg-white/80 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">💪</span>
              <span className="font-medium text-gray-900">Growth Opportunity</span>
            </div>
            <p className="text-sm text-gray-700">
              Focus on {categoryData.sort((a, b) => a.completionRate - b.completionRate)[0]?.category || 'consistency'} for balanced progress
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header with view selector */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Progress Visualization</h2>
        
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'streaks', label: 'Streaks', icon: '🔥' },
            { key: 'heatmap', label: 'Heatmap', icon: '📊' },
            { key: 'categories', label: 'Categories', icon: '📋' },
            { key: 'trends', label: 'Trends', icon: '📈' }
          ].map(view => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key as any)}
              className={`
                flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${activeView === view.key 
                  ? 'bg-white text-progress-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <span className="mr-1">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on active view */}
      {activeView === 'streaks' && renderStreakView()}
      {activeView === 'heatmap' && renderHeatmapView()}
      {activeView === 'categories' && renderCategoriesView()}
      {activeView === 'trends' && renderTrendsView()}
    </div>
  );
}