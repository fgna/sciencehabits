import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, Button } from '../ui';
import { HabitAnalytics } from '../../utils/analyticsHelpers';
import { formatPercentage } from '../../stores/analyticsStore';

interface HabitCorrelationAnalysisProps {
  habitPerformance: HabitAnalytics[];
  dailyStats: any[];
}

interface CorrelationInsight {
  habit1: string;
  habit2: string;
  correlation: number;
  strength: 'strong' | 'moderate' | 'weak';
  type: 'positive' | 'negative';
  insight: string;
}

export function HabitCorrelationAnalysis({ habitPerformance, dailyStats }: HabitCorrelationAnalysisProps) {
  const [viewMode, setViewMode] = useState<'correlations' | 'comparisons' | 'categories'>('correlations');

  const correlationInsights = useMemo(() => {
    return calculateHabitCorrelations(habitPerformance);
  }, [habitPerformance]);

  const categoryComparisons = useMemo(() => {
    return analyzeHabitsByCategory(habitPerformance);
  }, [habitPerformance]);

  const habitComparisons = useMemo(() => {
    return generateHabitComparisons(habitPerformance);
  }, [habitPerformance]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Habit Relationships & Insights</h3>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'correlations' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('correlations')}
              >
                🔗 Correlations
              </Button>
              <Button
                variant={viewMode === 'comparisons' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('comparisons')}
              >
                📊 Comparisons
              </Button>
              <Button
                variant={viewMode === 'categories' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('categories')}
              >
                🏷️ Categories
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'correlations' && (
            <CorrelationInsightsView insights={correlationInsights} />
          )}
          {viewMode === 'comparisons' && (
            <HabitComparisonsView comparisons={habitComparisons} />
          )}
          {viewMode === 'categories' && (
            <CategoryAnalysisView categories={categoryComparisons} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CorrelationInsightsView({ insights }: { insights: CorrelationInsight[] }) {
  if (insights.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🔗</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Correlations Found</h3>
        <p className="text-gray-600">
          Track more habits consistently to discover meaningful correlations and patterns.
        </p>
      </div>
    );
  }

  const strongCorrelations = insights.filter(i => i.strength === 'strong');
  const moderateCorrelations = insights.filter(i => i.strength === 'moderate');

  return (
    <div className="space-y-6">
      {strongCorrelations.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">💪</span>
            Strong Correlations
          </h4>
          <div className="space-y-3">
            {strongCorrelations.map((insight, index) => (
              <CorrelationCard key={index} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {moderateCorrelations.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">📈</span>
            Moderate Correlations
          </h4>
          <div className="space-y-3">
            {moderateCorrelations.map((insight, index) => (
              <CorrelationCard key={index} insight={insight} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <span className="text-lg">💡</span>
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Understanding Correlations</p>
            <p className="text-sm text-blue-700">
              Positive correlations suggest habits that tend to be completed together, while negative correlations
              indicate habits that are rarely done on the same day. Use this insight to bundle complementary habits
              or identify potential conflicts in your routine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CorrelationCard({ insight }: { insight: CorrelationInsight }) {
  const getCorrelationColor = (correlation: number, type: string) => {
    if (type === 'positive') {
      return correlation > 0.7 ? 'bg-green-100 border-green-300' : 'bg-green-50 border-green-200';
    } else {
      return correlation < -0.7 ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-200';
    }
  };

  const getCorrelationIcon = (type: string) => {
    return type === 'positive' ? '📈' : '📉';
  };

  return (
    <div className={`p-4 rounded-lg border ${getCorrelationColor(insight.correlation, insight.type)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getCorrelationIcon(insight.type)}</span>
            <h5 className="font-medium text-gray-900">
              {insight.habit1} ↔ {insight.habit2}
            </h5>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              insight.strength === 'strong' ? 'bg-purple-100 text-purple-700' :
              insight.strength === 'moderate' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {insight.strength}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{insight.insight}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Correlation: {(insight.correlation * 100).toFixed(1)}%</span>
            <span className="capitalize">{insight.type} relationship</span>
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-600">
          {Math.abs(insight.correlation * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

function HabitComparisonsView({ comparisons }: { comparisons: any[] }) {
  const [sortBy, setSortBy] = useState<'performance' | 'consistency' | 'streak'>('performance');

  const sortedComparisons = [...comparisons].sort((a, b) => {
    switch (sortBy) {
      case 'performance':
        return b.completionRate - a.completionRate;
      case 'consistency':
        return b.consistencyScore - a.consistencyScore;
      case 'streak':
        return b.currentStreak - a.currentStreak;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold text-gray-900">Side-by-Side Comparison</h4>
        <div className="flex space-x-2">
          <Button
            variant={sortBy === 'performance' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSortBy('performance')}
          >
            Performance
          </Button>
          <Button
            variant={sortBy === 'consistency' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSortBy('consistency')}
          >
            Consistency
          </Button>
          <Button
            variant={sortBy === 'streak' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSortBy('streak')}
          >
            Streak
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedComparisons.map((habit, index) => (
          <div key={habit.habitId} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">#{index + 1}</span>
                <h5 className="font-medium text-gray-900">{habit.habitTitle}</h5>
                <span className="text-sm px-2 py-1 bg-white rounded-full text-gray-600 capitalize">
                  {habit.habitCategory}
                </span>
              </div>
              <div className="text-lg font-bold text-primary-600">
                {Math.round(habit.completionRate)}%
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{habit.totalCompletions}</div>
                <div className="text-gray-500">Completions</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">{habit.currentStreak}</div>
                <div className="text-gray-500">Current Streak</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{habit.longestStreak}</div>
                <div className="text-gray-500">Best Streak</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{Math.round(habit.consistencyScore)}</div>
                <div className="text-gray-500">Consistency</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">{habit.daysTracked}</div>
                <div className="text-gray-500">Days Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-600">
                  {Math.round(habit.averageGapBetweenCompletions)}
                </div>
                <div className="text-gray-500">Avg Gap</div>
              </div>
            </div>

            <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-500"
                style={{ width: `${Math.max(5, habit.completionRate)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryAnalysisView({ categories }: { categories: any[] }) {
  return (
    <div className="space-y-6">
      <h4 className="text-md font-semibold text-gray-900">Performance by Category</h4>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const getCategoryIcon = (cat: string) => {
            const icons = {
              stress: '🧘‍♀️',
              productivity: '⚡',
              health: '💪',
              energy: '🔋',
              sleep: '😴',
              unknown: '✨'
            };
            return icons[cat as keyof typeof icons] || icons.unknown;
          };

          return (
            <Card key={category.category} className="hover:shadow-md transition-shadow">
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl mb-3">{getCategoryIcon(category.category)}</div>
                  <h5 className="font-semibold text-gray-900 capitalize mb-2">{category.category}</h5>
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {Math.round(category.averageCompletionRate)}%
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Average completion rate</p>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active habits:</span>
                      <span className="font-medium">{category.totalHabits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total completions:</span>
                      <span className="font-medium">{category.totalCompletions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best performer:</span>
                      <span className="font-medium text-green-600">{category.bestPerformingHabit}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all duration-500"
                      style={{ width: `${Math.max(5, category.averageCompletionRate)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <h5 className="font-semibold text-gray-900">Category Insights</h5>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {generateCategoryInsights(categories).map((insight, index) => (
              <div key={index} className={`p-3 rounded-lg ${insight.type === 'positive' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-start space-x-2">
                  <span className="text-lg">{insight.icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${insight.type === 'positive' ? 'text-green-800' : 'text-blue-800'}`}>
                      {insight.title}
                    </p>
                    <p className={`text-sm ${insight.type === 'positive' ? 'text-green-700' : 'text-blue-700'}`}>
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function calculateHabitCorrelations(habitPerformance: HabitAnalytics[]): CorrelationInsight[] {
  const insights: CorrelationInsight[] = [];

  if (habitPerformance.length < 2) return insights;

  for (let i = 0; i < habitPerformance.length; i++) {
    for (let j = i + 1; j < habitPerformance.length; j++) {
      const habit1 = habitPerformance[i];
      const habit2 = habitPerformance[j];

      // Simple correlation based on completion rates and streaks
      const rateCorrelation = 1 - Math.abs(habit1.completionRate - habit2.completionRate) / 100;
      const streakCorrelation = 1 - Math.abs(habit1.currentStreak - habit2.currentStreak) / Math.max(habit1.currentStreak, habit2.currentStreak, 1);
      const consistencyCorrelation = 1 - Math.abs(habit1.consistencyScore - habit2.consistencyScore) / 100;

      const correlation = (rateCorrelation + streakCorrelation + consistencyCorrelation) / 3;

      let strength: 'strong' | 'moderate' | 'weak' = 'weak';
      if (Math.abs(correlation) > 0.7) strength = 'strong';
      else if (Math.abs(correlation) > 0.5) strength = 'moderate';

      if (strength !== 'weak') {
        const type = correlation > 0 ? 'positive' : 'negative';
        const insight = type === 'positive'
          ? `These habits tend to be completed together, suggesting they complement each other well in your routine.`
          : `These habits are rarely completed on the same day, which might indicate competing priorities or scheduling conflicts.`;

        insights.push({
          habit1: habit1.habitTitle,
          habit2: habit2.habitTitle,
          correlation: correlation,
          strength,
          type,
          insight
        });
      }
    }
  }

  return insights.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 6);
}

function generateHabitComparisons(habitPerformance: HabitAnalytics[]) {
  return habitPerformance.map(habit => ({
    ...habit,
    relativePerformance: habit.completionRate / (habitPerformance.reduce((sum, h) => sum + h.completionRate, 0) / habitPerformance.length) * 100
  }));
}

function analyzeHabitsByCategory(habitPerformance: HabitAnalytics[]) {
  const categories = habitPerformance.reduce((acc, habit) => {
    const category = habit.habitCategory || 'unknown';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(habit);
    return acc;
  }, {} as Record<string, HabitAnalytics[]>);

  return Object.entries(categories).map(([category, habits]) => ({
    category,
    totalHabits: habits.length,
    averageCompletionRate: habits.reduce((sum, h) => sum + h.completionRate, 0) / habits.length,
    totalCompletions: habits.reduce((sum, h) => sum + h.totalCompletions, 0),
    bestPerformingHabit: habits.reduce((best, current) => 
      current.completionRate > best.completionRate ? current : best
    ).habitTitle,
    habits
  }));
}

function generateCategoryInsights(categories: any[]) {
  const insights = [];
  const bestCategory = categories.reduce((best, current) => 
    current.averageCompletionRate > best.averageCompletionRate ? current : best
  );
  
  const worstCategory = categories.reduce((worst, current) => 
    current.averageCompletionRate < worst.averageCompletionRate ? current : worst
  );

  insights.push({
    title: `${bestCategory.category.charAt(0).toUpperCase() + bestCategory.category.slice(1)} is your strongest category`,
    message: `With an average ${Math.round(bestCategory.averageCompletionRate)}% completion rate, you're excelling in ${bestCategory.category} habits.`,
    type: 'positive' as const,
    icon: '🏆'
  });

  if (bestCategory !== worstCategory) {
    insights.push({
      title: `Consider focusing more on ${worstCategory.category} habits`,
      message: `Your ${worstCategory.category} habits have a ${Math.round(worstCategory.averageCompletionRate)}% completion rate. This might be an area for improvement.`,
      type: 'info' as const,
      icon: '💡'
    });
  }

  return insights;
}