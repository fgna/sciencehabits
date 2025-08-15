/**
 * Mobile Metrics Grid - 2x2 Layout
 * 
 * Optimized for mobile with expandable science explanations,
 * thumb-friendly touch targets, and progressive disclosure.
 */

import React, { useState } from 'react';
import { AnalyticsData } from '../../../utils/analyticsHelpers';

interface MobileMetricsGridProps {
  analytics: AnalyticsData | null;
}

interface MetricCardProps {
  icon: string;
  value: string | number;
  label: string;
  subtitle: string;
  color: 'green' | 'blue' | 'purple' | 'orange';
  explanation: {
    science: string;
    motivation: string;
    research: string;
  };
}

export function MobileMetricsGrid({ analytics }: MobileMetricsGridProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Calculate mobile-optimized metrics
  const metrics: MetricCardProps[] = [
    {
      icon: "📊",
      value: analytics?.weeklyConsistencyRate ? `${Math.round(analytics.weeklyConsistencyRate)}%` : "0%",
      label: "Weekly Consistency",
      subtitle: "Optimal zone",
      color: "green",
      explanation: {
        science: "Research shows 70-80% weekly consistency builds stronger neural pathways than perfectionist 100% followed by burnout cycles.",
        motivation: "Each week in the optimal zone literally rewires your brain for automatic positive behaviors!",
        research: "Lally et al., 2010 - Habit Formation Study"
      }
    },
    {
      icon: "📈",
      value: analytics?.completionTrend ? (analytics.completionTrend > 0 ? "improving" : analytics.completionTrend < 0 ? "declining" : "stable") : "stable",
      label: "Monthly Trend", 
      subtitle: "Neuroplasticity",
      color: "blue",
      explanation: {
        science: "Habit formation follows a curve, not a straight line. Neural pathways strengthen through repetition over time.",
        motivation: "Each month builds on the last. Small improvements create massive long-term change.",
        research: "Neuroplasticity research, Doidge 2007"
      }
    },
    {
      icon: "🎯",
      value: analytics?.activeHabitsCount || 0,
      label: "Active Habits",
      subtitle: "Building",
      color: "purple",
      explanation: {
        science: "The brain can effectively automate 3-5 habits simultaneously without depleting willpower.",
        motivation: "You're building a foundation of success. Each habit makes the next one easier.",
        research: "Baumeister & Tierney - Willpower Research"
      }
    },
    {
      icon: "🔄",
      value: analytics?.achievements?.length || 0,
      label: "Recovery Wins",
      subtitle: "Restarts",
      color: "orange",
      explanation: {
        science: "Resilience after setbacks is the strongest predictor of long-term habit success.",
        motivation: "Every restart proves your resilience. You're training your comeback ability.",
        research: "Resilience research, Southwick & Charney 2012"
      }
    }
  ];

  const getColorClasses = (color: string, type: 'text' | 'bg' | 'border') => {
    const colorMap = {
      green: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
      blue: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
      purple: { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
      orange: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' }
    };
    return colorMap[color as keyof typeof colorMap]?.[type] || '';
  };

  return (
    <div className="p-4 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Your Progress</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.label}
            metric={metric}
            isExpanded={expandedCard === metric.label}
            onToggleExpand={() => setExpandedCard(
              expandedCard === metric.label ? null : metric.label
            )}
            getColorClasses={getColorClasses}
          />
        ))}
      </div>
    </div>
  );
}

interface MetricCardComponentProps {
  metric: MetricCardProps;
  isExpanded: boolean;
  onToggleExpand: () => void;
  getColorClasses: (color: string, type: 'text' | 'bg' | 'border') => string;
}

function MetricCard({ metric, isExpanded, onToggleExpand, getColorClasses }: MetricCardComponentProps) {
  return (
    <div className={`bg-white rounded-lg border-2 transition-all duration-200 ${
      isExpanded ? getColorClasses(metric.color, 'border') : 'border-gray-200'
    }`}>
      
      {/* Main Metric Display */}
      <div className="p-4 min-h-[100px] flex flex-col justify-between">
        
        {/* Header with Icon and Info Button */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl">{metric.icon}</span>
          <button 
            onClick={onToggleExpand}
            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${metric.label}`}
          >
            <span className="text-xs text-gray-600">
              {isExpanded ? '↑' : 'ℹ️'}
            </span>
          </button>
        </div>
        
        {/* Value Display */}
        <div className="text-center">
          <div className={`text-xl font-bold mb-1 ${getColorClasses(metric.color, 'text')}`}>
            {metric.value}
          </div>
          <div className="text-xs font-medium text-gray-700 leading-tight">
            {metric.label}
          </div>
          <div className="text-xs text-gray-500">
            {metric.subtitle}
          </div>
        </div>
      </div>
      
      {/* Expandable Science Explanation */}
      {isExpanded && (
        <div className={`mx-2 mb-2 p-3 rounded-lg ${getColorClasses(metric.color, 'bg')} border-t border-gray-100`}>
          <div className="space-y-2">
            
            {/* Science Explanation */}
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-1">🧠 The Science</h4>
              <p className="text-xs text-gray-700 leading-relaxed">
                {metric.explanation.science}
              </p>
            </div>
            
            {/* Motivation */}
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-1">💪 Why This Matters</h4>
              <p className="text-xs text-gray-700 leading-relaxed">
                {metric.explanation.motivation}
              </p>
            </div>
            
            {/* Research Source */}
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 italic">
                📚 {metric.explanation.research}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}