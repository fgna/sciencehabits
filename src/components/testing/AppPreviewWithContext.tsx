/**
 * App Preview with User Context Component
 * 
 * Displays the main application interface with a selected mock user's data
 * allowing testing of different user journey scenarios and behavioral patterns.
 */

import React, { useState, useEffect } from 'react';
import { MockUserProfile, BehaviorEvent } from '../../types/testing';

interface AppPreviewWithContextProps {
  user: MockUserProfile;
  onBehaviorEvent: (event: BehaviorEvent) => void;
  isRecording?: boolean;
}

export const AppPreviewWithContext: React.FC<AppPreviewWithContextProps> = ({
  user,
  onBehaviorEvent,
  isRecording = true
}) => {
  const [currentView, setCurrentView] = useState<'today' | 'habits' | 'analytics' | 'profile'>('today');
  const [sessionStartTime] = useState(Date.now());
  const [interactions, setInteractions] = useState(0);

  // Record behavior events
  const recordEvent = (action: string, data: any = {}) => {
    if (!isRecording) return;
    
    const event: BehaviorEvent = {
      userId: user.id,
      action,
      data: {
        ...data,
        currentView,
        sessionDuration: Date.now() - sessionStartTime,
        totalInteractions: interactions
      },
      timestamp: new Date().toISOString()
    };
    
    onBehaviorEvent(event);
    setInteractions(prev => prev + 1);
  };

  // Simulate app engagement patterns
  useEffect(() => {
    recordEvent('session_start', {
      userScenario: user.scenario,
      engagementLevel: user.behavior.engagementLevel
    });

    return () => {
      recordEvent('session_end', {
        finalView: currentView,
        totalInteractions: interactions
      });
    };
  }, []);

  const handleViewChange = (view: typeof currentView) => {
    recordEvent('view_change', { from: currentView, to: view });
    setCurrentView(view);
  };

  const handleHabitInteraction = (habitId: string, action: 'complete' | 'skip' | 'view') => {
    recordEvent('habit_interaction', {
      habitId,
      action,
      userEngagementLevel: user.behavior.engagementLevel
    });
  };

  const getViewContent = () => {
    switch (currentView) {
      case 'today':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Today's Progress</h2>
              <p className="text-sm text-gray-600 mb-4">
                Complete your daily habits to maintain your streak and build lasting change.
              </p>
              
              {/* Today's streak info */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user.analytics.currentStreak}</div>
                  <div className="text-xs text-gray-600">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {user.analytics.lastSevenDays[user.analytics.lastSevenDays.length - 1]?.completionRate || 0}%
                  </div>
                  <div className="text-xs text-gray-600">Today's Rate</div>
                </div>
              </div>
            </div>

            {/* Today's Habits */}
            <div className="space-y-3">
              {user.habits.active.slice(0, 3).map((habit, index) => {
                const lastCompletion = habit.completions[habit.completions.length - 1];
                const completedToday = lastCompletion && lastCompletion.date === new Date().toISOString().split('T')[0] && lastCompletion.completed;
                
                return (
                  <div 
                    key={habit.habitId}
                    className={`border rounded-lg p-4 ${completedToday ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{habit.habitTitle}</h3>
                        <p className="text-sm text-gray-600">
                          {habit.currentStreak} day streak • {habit.completionRate}% completion rate
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!completedToday ? (
                          <>
                            <button
                              onClick={() => handleHabitInteraction(habit.habitId, 'complete')}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleHabitInteraction(habit.habitId, 'skip')}
                              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                            >
                              Skip
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center text-green-600">
                            <span className="text-sm">✓ Completed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'habits':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">My Habits</h2>
            
            {/* Habit Categories */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-green-600">{user.habits.active.length}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-blue-600">{user.habits.completed.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>

            {/* All Habits List */}
            <div className="space-y-3">
              {[...user.habits.active, ...user.habits.paused].map(habit => (
                <div key={habit.habitId} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{habit.habitTitle}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>Streak: {habit.currentStreak} days</span>
                        <span>Success: {habit.completionRate}%</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          habit.status === 'active' ? 'bg-green-100 text-green-800' :
                          habit.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {habit.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleHabitInteraction(habit.habitId, 'view')}
                      className="px-3 py-1 text-blue-600 text-sm hover:bg-blue-50 rounded-md"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
            
            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{user.analytics.longestStreak}</div>
                <div className="text-sm text-gray-600">Longest Streak</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{user.analytics.completionRate}%</div>
                <div className="text-sm text-gray-600">Overall Success</div>
              </div>
            </div>

            {/* Weekly Progress */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Last 7 Days</h3>
              <div className="space-y-2">
                {user.analytics.lastSevenDays.slice(-5).map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            day.completionRate >= 80 ? 'bg-green-500' :
                            day.completionRate >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${day.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{day.completionRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{user.scenario.replace('_', ' ')} user</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Member Since</label>
                  <p className="text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Goals</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.onboarding.selectedGoals.map(goal => (
                      <span key={goal} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {goal.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Engagement Level</label>
                  <p className={`text-sm capitalize ${
                    user.behavior.engagementLevel === 'high' ? 'text-green-600' :
                    user.behavior.engagementLevel === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {user.behavior.engagementLevel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Testing Context Header */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-yellow-800">
            <span>🧪</span>
            <span>Testing Mode: {user.name} ({user.scenario.replace('_', ' ')})</span>
            {isRecording && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
          </div>
          
          <div className="text-xs text-yellow-700">
            Interactions: {interactions} | Session: {Math.round((Date.now() - sessionStartTime) / 1000)}s
          </div>
        </div>
      </div>

      {/* App Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4">
          <nav className="flex space-x-8">
            {[
              { key: 'today', label: 'Today', icon: '📅' },
              { key: 'habits', label: 'My Habits', icon: '✅' },
              { key: 'analytics', label: 'Analytics', icon: '📊' },
              { key: 'profile', label: 'Profile', icon: '👤' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => handleViewChange(key as typeof currentView)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                  currentView === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* App Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {getViewContent()}
      </div>
    </div>
  );
};