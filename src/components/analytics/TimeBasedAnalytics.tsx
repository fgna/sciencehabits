import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button } from '../ui';
import { DailyStats, WeeklyStats, MonthlyStats } from '../../utils/analyticsHelpers';
import { formatPercentage } from '../../stores/analyticsStore';

interface TimeBasedAnalyticsProps {
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
}

export function TimeBasedAnalytics({ dailyStats, weeklyStats, monthlyStats }: TimeBasedAnalyticsProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Time-Based Analysis</h3>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'daily' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('daily')}
              >
                Daily
              </Button>
              <Button
                variant={viewMode === 'weekly' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('weekly')}
              >
                Weekly
              </Button>
              <Button
                variant={viewMode === 'monthly' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('monthly')}
              >
                Monthly
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'daily' && <DailyAnalysisView stats={dailyStats} />}
          {viewMode === 'weekly' && <WeeklyAnalysisView stats={weeklyStats} />}
          {viewMode === 'monthly' && <MonthlyAnalysisView stats={monthlyStats} />}
        </CardContent>
      </Card>

      {/* Day of Week Analysis */}
      <DayOfWeekAnalysis dailyStats={dailyStats} />
    </div>
  );
}

function DailyAnalysisView({ stats }: { stats: DailyStats[] }) {
  if (stats.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No daily data available for the selected time range.</p>
      </div>
    );
  }

  const maxCompletions = Math.max(...stats.map(s => s.completions));
  const avgCompletionRate = stats.reduce((sum, s) => sum + s.completionRate, 0) / stats.length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {formatPercentage(avgCompletionRate)}
          </div>
          <p className="text-sm text-blue-800">Average Daily Rate</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {maxCompletions}
          </div>
          <p className="text-sm text-green-800">Best Day</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {stats.filter(s => s.completions > 0).length}
          </div>
          <p className="text-sm text-purple-800">Active Days</p>
        </div>
      </div>

      {/* Daily Chart */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Daily Completion Chart</h4>
        <div className="relative">
          <div className="flex items-end space-x-1 h-32 overflow-x-auto pb-4">
            {stats.slice(-30).map((day, index) => {
              const height = maxCompletions > 0 ? (day.completions / maxCompletions) * 100 : 0;
              const date = new Date(day.date);
              
              return (
                <div key={day.date} className="flex flex-col items-center space-y-1 min-w-0">
                  <div 
                    className={`w-4 rounded-t transition-all duration-300 ${
                      day.completions > 0 ? 'bg-primary-500' : 'bg-gray-200'
                    }`}
                    style={{ height: `${Math.max(4, height)}%` }}
                    title={`${day.date}: ${day.completions} completions (${formatPercentage(day.completionRate)})`}
                  />
                  <div className="text-xs text-gray-500 text-center">
                    <div>{date.getDate()}</div>
                    {index % 7 === 0 && (
                      <div className="text-xs">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Performance */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Recent Performance (Last 7 Days)</h4>
        <div className="space-y-2">
          {stats.slice(-7).map((day) => (
            <div key={day.date} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-sm text-gray-600">
                  {day.dayOfWeek}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {day.completions}/{day.totalHabits}
                </span>
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${Math.max(5, day.completionRate)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-10 text-right">
                  {Math.round(day.completionRate)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeeklyAnalysisView({ stats }: { stats: WeeklyStats[] }) {
  if (stats.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No weekly data available for the selected time range.</p>
      </div>
    );
  }

  const avgWeeklyRate = stats.reduce((sum, s) => sum + s.completionRate, 0) / stats.length;
  const bestWeek = stats.reduce((best, current) => 
    current.completionRate > best.completionRate ? current : best
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {formatPercentage(avgWeeklyRate)}
          </div>
          <p className="text-sm text-blue-800">Average Weekly Rate</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {formatPercentage(bestWeek.completionRate)}
          </div>
          <p className="text-sm text-green-800">Best Week</p>
        </div>
      </div>

      {/* Weekly Performance */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Weekly Performance</h4>
        <div className="space-y-2">
          {stats.slice(-8).map((week, index) => (
            <div key={`${week.weekStart}-${week.weekEnd}`} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">
                  Week {week.weekNumber}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(week.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {week.completions}/{week.totalPossible}
                </span>
                <div className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${Math.max(5, week.completionRate)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-10 text-right">
                  {Math.round(week.completionRate)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthlyAnalysisView({ stats }: { stats: MonthlyStats[] }) {
  if (stats.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No monthly data available for the selected time range.</p>
      </div>
    );
  }

  const avgMonthlyRate = stats.reduce((sum, s) => sum + s.completionRate, 0) / stats.length;
  const bestMonth = stats.reduce((best, current) => 
    current.completionRate > best.completionRate ? current : best
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {formatPercentage(avgMonthlyRate)}
          </div>
          <p className="text-sm text-blue-800">Average Monthly Rate</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {formatPercentage(bestMonth.completionRate)}
          </div>
          <p className="text-sm text-green-800">Best Month ({bestMonth.month})</p>
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Monthly Performance</h4>
        <div className="space-y-3">
          {stats.slice(-6).map((month) => (
            <div key={`${month.month}-${month.year}`} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-lg font-medium text-gray-900">
                  {month.month} {month.year}
                </h5>
                <span className="text-xl font-bold text-primary-600">
                  {Math.round(month.completionRate)}%
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Completions:</span>
                  <span className="ml-2 font-medium">{month.completions}</span>
                </div>
                <div>
                  <span className="text-gray-600">Active Days:</span>
                  <span className="ml-2 font-medium">{month.daysActive}</span>
                </div>
                <div>
                  <span className="text-gray-600">Possible:</span>
                  <span className="ml-2 font-medium">{month.totalPossible}</span>
                </div>
              </div>
              
              <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 transition-all duration-500"
                  style={{ width: `${Math.max(2, month.completionRate)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DayOfWeekAnalysis({ dailyStats }: { dailyStats: DailyStats[] }) {
  const dayOfWeekData = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
    const dayStats = dailyStats.filter(s => s.dayOfWeek === day);
    const avgCompletionRate = dayStats.length > 0 
      ? dayStats.reduce((sum, s) => sum + s.completionRate, 0) / dayStats.length 
      : 0;
    const totalCompletions = dayStats.reduce((sum, s) => sum + s.completions, 0);
    
    return {
      day,
      avgCompletionRate,
      totalCompletions,
      daysTracked: dayStats.length
    };
  });

  const bestDay = dayOfWeekData.reduce((best, current) => 
    current.avgCompletionRate > best.avgCompletionRate ? current : best
  );

  const worstDay = dayOfWeekData.reduce((worst, current) => 
    current.avgCompletionRate < worst.avgCompletionRate ? current : worst
  );

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Day of Week Analysis</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600 mb-1">
                {bestDay.day}
              </div>
              <div className="text-sm text-green-800">
                Best Day ({formatPercentage(bestDay.avgCompletionRate)})
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600 mb-1">
                {worstDay.day}
              </div>
              <div className="text-sm text-red-800">
                Lowest Day ({formatPercentage(worstDay.avgCompletionRate)})
              </div>
            </div>
          </div>

          {/* Day by day breakdown */}
          <div className="space-y-2">
            {dayOfWeekData.map((dayData) => (
              <div key={dayData.day} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-900 w-20">
                  {dayData.day}
                </span>
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 transition-all duration-300"
                      style={{ width: `${Math.max(2, dayData.avgCompletionRate)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {Math.round(dayData.avgCompletionRate)}%
                  </span>
                  <span className="text-xs text-gray-500 w-16 text-right">
                    ({dayData.totalCompletions} total)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}