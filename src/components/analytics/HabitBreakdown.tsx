import React from 'react';

interface HabitAnalytics {
  id: string;
  title: string;
  completionRate: number;
  currentStreak: number;
  totalSessions: number;
  category?: string;
}

interface HabitBreakdownProps {
  habits: HabitAnalytics[];
}

export const HabitBreakdown: React.FC<HabitBreakdownProps> = ({ habits }) => {
  return (
    <div className="habit-breakdown">
      <h3>Habit Performance</h3>
      
      <div className="habits-list">
        {habits.length === 0 ? (
          <div className="no-habits">
            <p className="text-gray-500 text-sm">No habit data available yet. Start completing habits to see your progress!</p>
          </div>
        ) : (
          habits.map(habit => (
            <div key={habit.id} className="habit-item">
              <div className="habit-info">
                <span className="habit-name">{habit.title}</span>
                {habit.category && (
                  <span className="habit-category">{habit.category}</span>
                )}
              </div>
              
              <div className="habit-stats">
                <div className="stat">
                  <span className="stat-value">{habit.completionRate}%</span>
                  <span className="stat-label">Success</span>
                </div>
                
                <div className="stat">
                  <span className="stat-value">{habit.currentStreak}</span>
                  <span className="stat-label">Streak</span>
                </div>
                
                <div className="stat">
                  <span className="stat-value">{habit.totalSessions}</span>
                  <span className="stat-label">Sessions</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.min(habit.completionRate, 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};