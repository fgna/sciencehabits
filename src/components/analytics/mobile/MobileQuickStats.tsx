/**
 * Mobile Quick Stats Grid
 * 
 * Simplified 2x2 grid showing key metrics with clear visual hierarchy.
 * Optimized for quick scanning on mobile devices.
 */

import React from 'react';
import { AnalyticsData } from '../../../utils/analyticsHelpers';

interface MobileQuickStatsProps {
  analytics: AnalyticsData;
}

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  subtitle: string;
  color: 'purple' | 'green' | 'blue' | 'orange';
}

export function MobileQuickStats({ analytics }: MobileQuickStatsProps) {
  // Calculate neural activations (habit completions)
  const neuralActivations = analytics?.totalCompletions || 0;

  // Calculate best performance (longest streak)
  const bestPerformance = analytics?.longestOverallStreak || 0;

  const stats: StatCardProps[] = [
    {
      icon: "⚡",
      value: neuralActivations,
      label: "Neural Activations",
      subtitle: "Brain strengthening",
      color: "purple"
    },
    {
      icon: "🎯",
      value: analytics?.weeklyConsistencyRate ? `${Math.round(analytics.weeklyConsistencyRate)}%` : "0%",
      label: "Consistency Rate",
      subtitle: "",
      color: "green"
    },
    {
      icon: "🔥",
      value: analytics?.activeHabitsCount || 0,
      label: "Active Habits",
      subtitle: "Currently building",
      color: "blue"
    },
    {
      icon: "📈",
      value: bestPerformance,
      label: "Best Performance",
      subtitle: "Days in a row",
      color: "orange"
    }
  ];

  return (
    <div className="mb-6 px-4">
      <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, subtitle, color }: StatCardProps) {
  const getColorClasses = (color: string) => {
    const colorMap = {
      purple: 'text-purple-600',
      green: 'text-green-600',
      blue: 'text-blue-600',
      orange: 'text-orange-600'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center min-h-[100px] flex flex-col justify-between shadow-sm">
      
      {/* Icon */}
      <div className="text-xl mb-2">{icon}</div>
      
      {/* Value and Labels */}
      <div>
        <div className={`text-xl font-bold mb-1 ${getColorClasses(color)}`}>
          {value}
        </div>
        <div className="text-xs font-medium text-gray-700 leading-tight">
          {label}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}