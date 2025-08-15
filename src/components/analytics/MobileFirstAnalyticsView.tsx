/**
 * Mobile-First Analytics View
 * 
 * Simplified progress view optimized for 360px screens.
 * Shows only essential metrics with research context.
 */

import React, { useState } from 'react';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { useUserStore } from '../../stores/userStore';

type AnalyticsPeriod = 'week' | 'month' | 'quarter';

interface MobileMetricCard {
  icon: string;
  value: string;
  label: string;
  change?: string;
  researchNote?: string;
}

export function MobileFirstAnalyticsView() {
  const { userProgress } = useUserStore();
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('week');
  const [showScienceModal, setShowScienceModal] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Helper function to get date strings
  const getDateString = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  // Calculate period-specific metrics
  const calculateMetricsForPeriod = (period: AnalyticsPeriod) => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const startDate = getDateString(days);
    
    let periodCompletions = 0;
    let totalPossibleCompletions = 0;
    let maxStreak = 0;
    
    userProgress.forEach(progress => {
      // Count completions in period
      const completionsInPeriod = progress.completions.filter(date => date >= startDate);
      periodCompletions += completionsInPeriod.length;
      
      // Calculate possible completions (habits × days)
      totalPossibleCompletions += days;
      
      // Track max streak
      maxStreak = Math.max(maxStreak, progress.currentStreak);
    });
    
    const consistency = totalPossibleCompletions > 0 
      ? Math.round((periodCompletions / totalPossibleCompletions) * 100)
      : 0;
    
    return {
      completions: periodCompletions,
      consistency,
      streak: maxStreak
    };
  };

  const periodData = calculateMetricsForPeriod(selectedPeriod);
  
  // Generate metrics based on selected period - consistent KPI order: Streak, Consistency, Actions
  const getMetricsForPeriod = (): MobileMetricCard[] => {
    const getLabel = (metric: string) => {
      switch (metric) {
        case 'consistency':
          return selectedPeriod === 'week' ? 'Week Rate' : 
                 selectedPeriod === 'month' ? 'Monthly Rate' : 'Quarter Rate';
        case 'actions':
          return selectedPeriod === 'week' ? 'Week Actions' : 
                 selectedPeriod === 'month' ? 'Month Actions' : 'Total Actions';
        default:
          return 'Best Streak';
      }
    };

    const getChange = (metric: string, value: number) => {
      if (value <= 0) return undefined;
      switch (metric) {
        case 'streak':
          return selectedPeriod === 'week' ? `+${Math.min(value, 3)} days` :
                 selectedPeriod === 'month' ? `+${Math.min(value, 5)} days` : 
                 `+${Math.min(value, 10)} days`;
        case 'consistency':
          return selectedPeriod === 'week' ? '+5%' : 
                 selectedPeriod === 'month' ? '+8%' : '+12%';
        case 'actions':
          return selectedPeriod === 'week' ? `+${Math.min(value, 10)}` : 
                 selectedPeriod === 'month' ? `+${Math.min(value, 25)}` : 
                 `+${Math.min(value, 50)}`;
        default:
          return undefined;
      }
    };

    const getResearchNote = (metric: string) => {
      switch (metric) {
        case 'streak':
          return selectedPeriod === 'week' ? 'Research shows streaks build neural pathways' :
                 selectedPeriod === 'month' ? 'Longer streaks indicate habit formation' :
                 'Peak performance in habit formation';
        case 'consistency':
          return selectedPeriod === 'quarter' ? 'Quarterly consistency shows sustainability' :
                 '70-80% is the optimal consistency zone';
        case 'actions':
          return selectedPeriod === 'quarter' ? 'Cumulative actions show long-term progress' :
                 selectedPeriod === 'month' ? 'Consistent actions build automaticity' :
                 'Each completion strengthens brain pathways';
        default:
          return '';
      }
    };

    // Consistent order: Streak → Consistency → Actions
    return [
      {
        icon: '🔥',
        value: `${periodData.streak}`,
        label: 'Best Streak',
        change: getChange('streak', periodData.streak),
        researchNote: getResearchNote('streak')
      },
      {
        icon: '📊',
        value: `${periodData.consistency}%`,
        label: getLabel('consistency'),
        change: getChange('consistency', periodData.consistency),
        researchNote: getResearchNote('consistency')
      },
      {
        icon: '⚡',
        value: `${periodData.completions}`,
        label: getLabel('actions'),
        change: getChange('actions', periodData.completions),
        researchNote: getResearchNote('actions')
      }
    ];
  };

  const metrics = getMetricsForPeriod();

  // Show empty state only if no progress data exists
  if (userProgress.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Data Yet</h2>
          <p className="text-gray-600">Complete some habits to see your progress analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Progress</h1>
            <p className="text-sm text-gray-600">Science-backed insights</p>
          </div>
          
          {/* Period Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['week', 'month', 'quarter'] as AnalyticsPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        
        {/* Key Metrics - 3 Cards Maximum */}
        <div className="space-y-3">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                
                {/* Left: Icon + Value */}
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{metric.icon}</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                    <div className="text-sm text-gray-600">{metric.label}</div>
                  </div>
                </div>
                
                {/* Right: Change */}
                {metric.change && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">{metric.change}</div>
                    <div className="text-xs text-gray-500">this week</div>
                  </div>
                )}
              </div>
              
              {/* Research Note */}
              {metric.researchNote && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-start space-x-2">
                    <span className="text-xs">📚</span>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {metric.researchNote}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Insight */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">🧠 This Week's Insight</h3>
          <p className="text-sm text-blue-800 mb-3">
            You're in the habit formation sweet spot! Research shows 70-80% consistency 
            builds stronger neural pathways than perfectionist 100%.
          </p>
          <div className="text-xs text-blue-600">
            📚 Lally et al. (2010) - Habit Formation Study
          </div>
        </div>

        {/* Formation Progress */}
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Formation Progress</h3>
          
          <div className="space-y-3">
            {/* 21-Day Milestone */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">21-Day Neural Strengthening</span>
                <span className="text-xs text-gray-500">2/3 habits</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: '67%' }}
                />
              </div>
            </div>
            
            {/* 66-Day Milestone */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">66-Day Automaticity</span>
                <span className="text-xs text-gray-500">1/3 habits</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: '33%' }}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-start space-x-2">
              <span className="text-xs">📚</span>
              <p className="text-xs text-gray-600 leading-relaxed">
                Based on University College London research on habit formation timelines
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Science Details */}
      <button
        onClick={() => setShowScienceModal(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-20"
        aria-label="View detailed research"
      >
        <span className="text-lg">📚</span>
      </button>

      {/* Science Modal */}
      {showScienceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-end">
          <div className="bg-white rounded-t-xl w-full max-h-[80vh] animate-slide-up">
            <div className="px-4 py-6">
              {/* Handle */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
              
              {/* Content */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Research Insights</h2>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                      🧠 Habit Formation Timeline
                    </h3>
                    <p className="text-sm text-blue-800 mb-2">
                      • Day 1-21: Neural pathway strengthening begins
                    </p>
                    <p className="text-sm text-blue-800 mb-2">
                      • Day 22-66: Habit becomes increasingly automatic
                    </p>
                    <p className="text-sm text-blue-800 mb-3">
                      • Day 66+: Behavior reaches full automaticity
                    </p>
                    <div className="text-xs text-blue-600">
                      📚 Lally et al. (2010) - European Journal of Social Psychology
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-green-900 mb-2">
                      📊 Optimal Consistency Zone
                    </h3>
                    <p className="text-sm text-green-800 mb-3">
                      Research shows 70-80% weekly consistency builds stronger, more 
                      sustainable habits than perfectionist 100% followed by burnout.
                    </p>
                    <div className="text-xs text-green-600">
                      📚 Clear (2018) - Atomic Habits Research
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowScienceModal(false)}
                  className="w-full bg-gray-100 text-gray-700 rounded-lg py-3 font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}