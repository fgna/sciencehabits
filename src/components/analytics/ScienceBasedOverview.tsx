/**
 * Science-Based Analytics Overview
 * 
 * Replaces streak-focused metrics with research-backed progress tracking
 * that emphasizes consistency trends, recovery success, and habit formation science.
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui';
import { AnalyticsData } from '../../utils/analyticsHelpers';

interface ScienceBasedOverviewProps {
  analytics: AnalyticsData;
}

interface MetricExplanation {
  title: string;
  scienceExplanation: string;
  motivation: string;
  researchSource: string;
}

const METRIC_EXPLANATIONS: Record<string, MetricExplanation> = {
  weeklyConsistency: {
    title: "Weekly Consistency Rate",
    scienceExplanation: "Research shows 70-80% weekly consistency builds stronger neural pathways than perfectionist 100% followed by burnout cycles. Your brain adapts to sustainable patterns.",
    motivation: "Each week in the optimal zone literally rewires your brain for automatic positive behaviors!",
    researchSource: "Lally et al., 2010 - Habit Formation Study & Clear, 2018 - Atomic Habits"
  },
  monthlyTrend: {
    title: "Monthly Trend",
    scienceExplanation: "Habit formation follows a curve, not a straight line. Improvements compound over time as neural pathways strengthen through repetition.",
    motivation: "Each month builds on the last. Small improvements create massive long-term change through neuroplasticity.",
    researchSource: "Neuroplasticity research, Doidge 2007"
  },
  activeHabits: {
    title: "Active Habits",
    scienceExplanation: "The brain can effectively automate 3-5 habits simultaneously without depleting willpower. Multiple habits create positive reinforcement loops.",
    motivation: "You're building a foundation of success. Each habit makes the next one easier to maintain.",
    researchSource: "Baumeister & Tierney - Willpower Research"
  },
  recoveryWins: {
    title: "Recovery Wins",
    scienceExplanation: "Resilience after setbacks is the strongest predictor of long-term habit success. Recovery skills strengthen with practice, just like habits.",
    motivation: "Every restart proves your resilience. You're training your comeback ability - the most important skill for lasting change.",
    researchSource: "Resilience research, Southwick & Charney 2012"
  }
};

interface MetricCardProps {
  metricKey: string;
  icon: string;
  value: string | number;
  subtitle: string;
  trend?: string;
  positive?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  metricKey, 
  icon, 
  value, 
  subtitle, 
  trend, 
  positive 
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const explanation = METRIC_EXPLANATIONS[metricKey];
  
  return (
    <div className="relative bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {explanation && (
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-blue-500 hover:text-blue-700 text-sm"
            title="Show science explanation"
          >
            ℹ️
          </button>
        )}
      </div>
      
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600 mb-2">{subtitle}</div>
      
      {trend && (
        <div className={`text-xs ${positive ? 'text-green-600' : 'text-gray-500'}`}>
          {trend}
        </div>
      )}
      
      {/* Science Explanation Tooltip */}
      {showExplanation && explanation && (
        <div className="absolute z-10 w-80 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-lg top-full mt-2 left-0">
          <h4 className="font-semibold text-blue-900 mb-2">{explanation.title}</h4>
          <p className="text-sm text-blue-800 mb-3">{explanation.scienceExplanation}</p>
          <p className="text-sm text-blue-700 font-medium mb-2">💪 {explanation.motivation}</p>
          <p className="text-xs text-blue-600 italic">{explanation.researchSource}</p>
        </div>
      )}
    </div>
  );
};

export function ScienceBasedOverview({ analytics }: ScienceBasedOverviewProps) {
  // Calculate science-based metrics
  const weeklyConsistency = Math.min(100, Math.round(analytics.overallCompletionRate));
  const monthlyTrend = analytics.completionTrend > 0 ? 'improving' : 
                     analytics.completionTrend < -5 ? 'declining' : 'stable';
  const trendPercentage = Math.abs(Math.round(analytics.completionTrend));
  const recoverySuccesses = Math.max(0, analytics.currentStreaks.filter(s => s > 0).length - 1);

  const primaryMetrics = [
    {
      metricKey: 'weeklyConsistency',
      icon: '📊',
      value: `${weeklyConsistency}%`,
      subtitle: 'Focus on trends over perfection',
      trend: `${trendPercentage}% vs last month`,
      positive: monthlyTrend === 'improving'
    },
    {
      metricKey: 'monthlyTrend',
      icon: '📈',
      value: monthlyTrend,
      subtitle: 'Neuroplasticity in action',
      positive: monthlyTrend === 'improving'
    },
    {
      metricKey: 'activeHabits',
      icon: '🎯',
      value: analytics.activeHabitsCount,
      subtitle: 'Currently building'
    },
    {
      metricKey: 'recoveryWins',
      icon: '🔄',
      value: recoverySuccesses,
      subtitle: 'Successful restarts'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Science-Based Primary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {primaryMetrics.map((metric, index) => (
          <MetricCard
            key={index}
            metricKey={metric.metricKey}
            icon={metric.icon}
            value={metric.value}
            subtitle={metric.subtitle}
            trend={metric.trend}
            positive={metric.positive}
          />
        ))}
      </div>
      
      {/* Quick Science Facts */}
      <Card>
        <CardContent>
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              🧠 Science Fact
            </h3>
            <p className="text-sm text-gray-700">
              Your brain physically changes as you build habits. Each repetition strengthens neural pathways, 
              making behaviors feel more automatic over time. You're literally sculpting your future self!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Formation Milestones */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Formation Milestones</h3>
          <p className="text-sm text-gray-600">Track your progress against research-backed habit formation timelines</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* 21-Day Milestone */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🧠</span>
                  <h4 className="font-semibold text-blue-900">21-Day Neural Strengthening</h4>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-700">
                    {analytics.formationMilestones?.day21Milestone.habitsReached || 0}/{analytics.formationMilestones?.day21Milestone.totalHabits || 0}
                  </div>
                  <div className="text-xs text-blue-600">
                    {Math.round(analytics.formationMilestones?.day21Milestone.percentage || 0)}% complete
                  </div>
                </div>
              </div>
              <p className="text-sm text-blue-800 mb-2">
                {analytics.formationMilestones?.day21Milestone.description || 'Initial neural pathway strengthening'}
              </p>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.formationMilestones?.day21Milestone.percentage || 0}%` }}
                />
              </div>
            </div>
            
            {/* 66-Day Milestone */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">⚡</span>
                  <h4 className="font-semibold text-green-900">66-Day Automaticity</h4>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-700">
                    {analytics.formationMilestones?.day66Milestone.habitsReached || 0}/{analytics.formationMilestones?.day66Milestone.totalHabits || 0}
                  </div>
                  <div className="text-xs text-green-600">
                    {Math.round(analytics.formationMilestones?.day66Milestone.percentage || 0)}% complete
                  </div>
                </div>
              </div>
              <p className="text-sm text-green-800 mb-2">
                {analytics.formationMilestones?.day66Milestone.description || 'Research-backed average formation time'}
              </p>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.formationMilestones?.day66Milestone.percentage || 0}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {analytics.formationMilestones?.averageFormationDays || Math.round(analytics.totalDaysTracked / analytics.activeHabitsCount || 0)}
              </div>
              <p className="text-sm text-gray-600">Average Formation Days</p>
              <p className="text-xs text-gray-500">Building neural pathways</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {Math.round(weeklyConsistency)}%
              </div>
              <p className="text-sm text-gray-600">Consistency Rate</p>
              <p className="text-xs text-gray-500">Optimal habit formation zone</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {analytics.totalCompletions}
              </div>
              <p className="text-sm text-gray-600">Neural Activations</p>
              <p className="text-xs text-gray-500">Brain strengthening events</p>
            </div>
          </div>
          
          {/* Individual Habit Progress */}
          {analytics.habitsMilestoneProgress && analytics.habitsMilestoneProgress.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Individual Habit Progress</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analytics.habitsMilestoneProgress.map((habit, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium text-gray-900 text-sm">{habit.habitTitle}</h5>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          habit.formationStage === 'established' ? 'bg-green-100 text-green-800' :
                          habit.formationStage === 'forming' ? 'bg-blue-100 text-blue-800' :
                          habit.formationStage === 'building' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {habit.formationStage}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Day {habit.daysActive}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <div className={`flex items-center space-x-1 ${
                        habit.isAt21Days ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        <span>{habit.isAt21Days ? '✅' : '⏳'}</span>
                        <span>21-day {habit.isAt21Days ? 'reached' : `in ${habit.daysTo21} days`}</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${
                        habit.isAt66Days ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        <span>{habit.isAt66Days ? '✅' : '⏳'}</span>
                        <span>66-day {habit.isAt66Days ? 'reached' : `in ${habit.daysTo66} days`}</span>
                      </div>
                    </div>
                    
                    {habit.milestoneAchievements.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {habit.milestoneAchievements.map((achievement, i) => (
                          <span key={i} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            {achievement}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motivational Science Insights */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Progress Insights</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {generateScienceBasedInsights(analytics, weeklyConsistency, monthlyTrend).map((insight, index) => (
              <div key={index} className={`p-3 rounded-lg ${insight.bgColor} border ${insight.borderColor}`}>
                <div className="flex items-start space-x-2">
                  <span className="text-lg">{insight.icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${insight.textColor}`}>
                      {insight.title}
                    </p>
                    <p className={`text-sm ${insight.messageColor}`}>
                      {insight.message}
                    </p>
                    {insight.science && (
                      <p className={`text-xs italic mt-1 ${insight.scienceColor}`}>
                        🧠 {insight.science}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Research Foundation */}
      <Card>
        <CardContent>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-3">
              🧬 Why These Metrics Matter: The Science of Habit Formation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-purple-800 mb-2">The 70-80% Sweet Spot</h5>
                <p className="text-purple-700">
                  Weekly consistency of 70-80% builds stronger neural pathways than perfectionist 100% followed by burnout. 
                  This optimal zone creates sustainable habit formation without stress.
                </p>
              </div>
              <div>
                <h5 className="font-medium text-purple-800 mb-2">The 66-Day Reality</h5>
                <p className="text-purple-700">
                  Forget "21 days to form a habit." Real research found it takes an average of 66 days, 
                  with individual variation from 18-254 days depending on complexity.
                </p>
              </div>
              <div>
                <h5 className="font-medium text-purple-800 mb-2">Recovery Builds Resilience</h5>
                <p className="text-purple-700">
                  Missing days doesn't break habits - giving up does. Each successful restart strengthens your 
                  recovery skills, the most important predictor of long-term success.
                </p>
              </div>
              <div>
                <h5 className="font-medium text-purple-800 mb-2">Neural Plasticity in Action</h5>
                <p className="text-purple-700">
                  Every repetition physically changes your brain structure. You're literally rewiring neural pathways 
                  to make positive behaviors feel automatic and effortless.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-purple-200">
              <p className="text-xs text-purple-600 italic">
                Based on research by Lally et al. (2010), Duhigg (2012), and neuroplasticity studies by Doidge (2007)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function generateScienceBasedInsights(
  analytics: AnalyticsData, 
  weeklyConsistency: number, 
  monthlyTrend: string
): Array<{
  title: string;
  message: string;
  science?: string;
  icon: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  messageColor: string;
  scienceColor: string;
}> {
  const insights = [];

  // Consistency insights with science
  if (weeklyConsistency >= 75) {
    insights.push({
      title: 'Habit Formation Sweet Spot',
      message: `Your ${weeklyConsistency}% consistency is optimal for building lasting neural pathways without perfectionist burnout.`,
      science: 'Research shows 75%+ consistency builds stronger habits than 100% followed by breaks.',
      icon: '🌟',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      messageColor: 'text-green-700',
      scienceColor: 'text-green-600'
    });
  } else if (weeklyConsistency >= 50) {
    insights.push({
      title: 'Building Neural Momentum',
      message: `Your ${weeklyConsistency}% consistency is actively strengthening brain pathways. Every completion counts!`,
      science: 'Neural plasticity research shows consistent practice creates measurable brain changes.',
      icon: '💪',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      messageColor: 'text-blue-700',
      scienceColor: 'text-blue-600'
    });
  } else {
    insights.push({
      title: 'Foundation Building Phase',
      message: `You're in the early formation stage. Focus on consistent timing and environmental cues to support neural pathway development.`,
      science: 'Early habit formation focuses on establishing cues and rewards rather than frequency.',
      icon: '🌱',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      messageColor: 'text-yellow-700',
      scienceColor: 'text-yellow-600'
    });
  }

  // Trend insights with motivation
  if (monthlyTrend === 'improving') {
    insights.push({
      title: 'Neuroplasticity in Action',
      message: 'Your improving trend shows your brain is adapting! Neural pathways strengthen with each positive change.',
      science: 'Continuous improvement activates brain plasticity mechanisms for lasting behavioral change.',
      icon: '📈',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      messageColor: 'text-green-700',
      scienceColor: 'text-green-600'
    });
  } else if (monthlyTrend === 'declining') {
    insights.push({
      title: 'Recovery Opportunity',
      message: 'Temporary setbacks are normal in habit formation. Your recovery skills are about to get stronger!',
      science: 'Resilience research shows comeback ability is the strongest predictor of long-term success.',
      icon: '🔄',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      messageColor: 'text-blue-700',
      scienceColor: 'text-blue-600'
    });
  }

  // Formation progress insight
  const avgFormationDays = Math.round(analytics.totalDaysTracked / analytics.activeHabitsCount || 0);
  if (avgFormationDays >= 21) {
    insights.push({
      title: 'Neural Pathway Milestone',
      message: `At ${avgFormationDays} days, your brain shows measurable structural changes. Habits are becoming more automatic!`,
      science: 'Around 21 days, myelin sheaths form around neural pathways, making them faster and more efficient.',
      icon: '🧠',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
      messageColor: 'text-purple-700',
      scienceColor: 'text-purple-600'
    });
  }

  return insights.slice(0, 3); // Limit to 3 most relevant insights
}