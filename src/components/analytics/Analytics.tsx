import React, { useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import { OverviewCard } from './OverviewCard';
import { TimeRangeSelector } from './TimeRangeSelector';
import { HabitBreakdown } from './HabitBreakdown';
import { ExportSection } from './ExportSection';
import { exportToCSV, generatePDFReport } from '../../services/exportService';
import './analytics.css';

export const Analytics: React.FC = () => {
  const { userHabits, userProgress } = useUserStore();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  const analytics = useAnalytics(userHabits, userProgress, selectedTimeRange);

  const handleExportCSV = () => {
    exportToCSV(userHabits, userProgress);
  };

  const handleExportPDF = async () => {
    await generatePDFReport(analytics, selectedTimeRange);
  };

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <h1>Your Progress</h1>
        <TimeRangeSelector 
          value={selectedTimeRange}
          onChange={setSelectedTimeRange}
        />
      </div>

      {/* Overview Cards */}
      <div className="overview-grid">
        <OverviewCard
          title="Total Habits"
          value={userHabits.length}
          icon="📋"
          trend={analytics.habitsTrend}
        />
        <OverviewCard
          title="Completion Rate"
          value={`${analytics.overallCompletionRate}%`}
          icon="✅"
          trend={analytics.completionTrend}
        />
        <OverviewCard
          title="Current Streak"
          value={`${analytics.longestCurrentStreak} days`}
          icon="🔥"
          trend={analytics.streakTrend}
        />
        <OverviewCard
          title="Total Sessions"
          value={analytics.totalSessions}
          icon="💪"
          trend={analytics.sessionsTrend}
        />
      </div>

      {/* Simple Progress Summary (replacing complex chart for now) */}
      <div className="chart-section">
        <div className="chart-header">
          <h3>Progress Summary</h3>
          <p className="chart-subtitle">Your habit completion over the selected period</p>
        </div>
        
        <div className="progress-summary">
          <div className="summary-stat">
            <div className="stat-value">{analytics.totalCompletions}</div>
            <div className="stat-label">Total Completions</div>
          </div>
          <div className="summary-stat">
            <div className="stat-value">{analytics.averageDaily}%</div>
            <div className="stat-label">Average Daily Rate</div>
          </div>
          <div className="summary-stat">
            <div className="stat-value">{analytics.bestDay}</div>
            <div className="stat-label">Best Day</div>
          </div>
          <div className="summary-stat">
            <div className="stat-value">{analytics.consistencyScore}%</div>
            <div className="stat-label">Consistency Score</div>
          </div>
        </div>
      </div>

      {/* Habit Breakdown & Export */}
      <div className="bottom-grid">
        <HabitBreakdown habits={analytics.habitBreakdown} />
        <ExportSection 
          onExportCSV={handleExportCSV} 
          onExportPDF={handleExportPDF} 
        />
      </div>
    </div>
  );
};