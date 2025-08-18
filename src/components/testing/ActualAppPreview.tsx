import React, { useState, useEffect } from 'react';
import { UserTestingContext, BehaviorEvent } from '../../types/testing';
import { Habit } from '../../types';
import { HabitsCarousel } from '../habits/HabitsCarousel';
import { SimplifiedDashboard } from '../dashboard/SimplifiedDashboard';
import { HabitBrowser } from '../habits/HabitBrowser';

interface ActualAppPreviewProps {
  testingContext: UserTestingContext;
  onBehaviorEvent: (event: BehaviorEvent) => void;
}

// Generate realistic fake habit data
const generateFakeHabits = (): Habit[] => {
  const categories = ['better_sleep', 'get_moving', 'feel_better', 'productivity', 'health'];
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  
  const habitTemplates = [
    {
      title: "5-4-3-2-1 Grounding Technique",
      description: "Sensory grounding exercise using sight, sound, touch, smell, and taste to anchor in present moment",
      category: "feel_better",
      difficulty: "beginner" as const,
      timeMinutes: 3,
      effectivenessScore: 8.7,
      evidenceStrength: "high" as const,
      instructions: [
        "Name 5 things you can see around you",
        "Name 4 different sounds you can hear", 
        "Name 3 things you can touch or feel",
        "Name 2 different smells you notice",
        "Name 1 thing you can taste",
        "Take three deep breaths to complete"
      ]
    },
    {
      title: "Morning Light Exposure",
      description: "Get 10-15 minutes of bright morning light within the first hour of waking to regulate circadian rhythm",
      category: "better_sleep",
      difficulty: "beginner" as const, 
      timeMinutes: 15,
      effectivenessScore: 9.2,
      evidenceStrength: "very_high" as const,
      instructions: [
        "Go outside within 1 hour of waking",
        "Face toward the sun (don't look directly at it)",
        "Stay outside for 10-15 minutes",
        "If cloudy, extend to 20-30 minutes",
        "Avoid sunglasses during this time"
      ]
    },
    {
      title: "2-Minute Desk Stretches",
      description: "Quick mobility routine to counteract prolonged sitting and improve posture",
      category: "get_moving",
      difficulty: "beginner" as const,
      timeMinutes: 2,
      effectivenessScore: 7.8,
      evidenceStrength: "moderate" as const,
      instructions: [
        "Stand up and roll shoulders backward 5 times",
        "Stretch neck side to side, holding 10 seconds each",
        "Reach arms overhead and lean left, then right", 
        "Twist spine gently left and right",
        "Touch toes or reach toward floor"
      ]
    },
    {
      title: "Deep Breathing Exercise",
      description: "4-7-8 breathing pattern to activate parasympathetic nervous system and reduce stress",
      category: "feel_better",
      difficulty: "beginner" as const,
      timeMinutes: 5,
      effectivenessScore: 8.9,
      evidenceStrength: "high" as const,
      instructions: [
        "Sit comfortably with back straight",
        "Exhale completely through mouth",
        "Inhale through nose for 4 counts",
        "Hold breath for 7 counts",
        "Exhale through mouth for 8 counts",
        "Repeat cycle 3-4 times"
      ]
    },
    {
      title: "Pomodoro Focus Session", 
      description: "25-minute focused work session followed by 5-minute break to maximize productivity",
      category: "productivity",
      difficulty: "intermediate" as const,
      timeMinutes: 25,
      effectivenessScore: 8.3,
      evidenceStrength: "high" as const,
      instructions: [
        "Choose one specific task to focus on",
        "Set timer for 25 minutes",
        "Work on task with full attention",
        "When timer rings, take 5-minute break",
        "After 4 cycles, take longer 15-30 minute break"
      ]
    },
    {
      title: "Hydration Check-in",
      description: "Mindful water consumption to maintain optimal hydration throughout the day",
      category: "health",
      difficulty: "beginner" as const, 
      timeMinutes: 1,
      effectivenessScore: 7.5,
      evidenceStrength: "moderate" as const,
      instructions: [
        "Check current hydration level (urine color)",
        "Drink 8-16 oz of water slowly",
        "Notice how your body feels",
        "Set reminder for next check-in",
        "Track daily water intake"
      ]
    }
  ];

  return habitTemplates.map((template, index) => ({
    id: `habit-${index + 1}`,
    ...template,
    isCustom: false,
    equipment: 'none' as const,
    goalTags: [template.category],
    lifestyleTags: ['all'],
    timeTags: ['flexible'],
    researchIds: [],
    frequency: {
      type: 'daily' as const
    },
    reminders: {
      enabled: false,
      periodicReminderDays: 7
    }
  }));
};

// Generate fake user progress data
const generateFakeUserData = () => {
  return {
    id: 'test-user',
    name: 'Demo User',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    goals: ['better_sleep', 'get_moving', 'feel_better'],
    lifestyle: 'professional' as const,
    preferredTime: 'morning' as const,
    dailyMinutes: 15,
    language: 'en' as const,
    currentStreak: 7,
    totalCompletions: 142,
    weeklyGoal: 5,
    completionRate: 0.78
  };
};

export function ActualAppPreview({ testingContext, onBehaviorEvent }: ActualAppPreviewProps) {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'habits' | 'browse'>('habits');
  const [fakeHabits] = useState(generateFakeHabits());
  const [fakeUser] = useState(generateFakeUserData());
  const [showBrowser, setShowBrowser] = useState(false);

  // Record behavior events
  const recordEvent = (action: string, data?: any) => {
    onBehaviorEvent({
      action,
      data,
      timestamp: Date.now(),
      userId: testingContext.currentUser?.id || 'demo-user',
      page: currentPage
    });
  };

  const handleHabitToggle = (habitId: string) => {
    recordEvent('habit_completed', { habitId, completed: true });
  };


  const handleAddHabit = () => {
    recordEvent('add_habit_clicked');
    setShowBrowser(true);
  };

  const handlePageChange = (page: typeof currentPage) => {
    recordEvent('page_navigation', { from: currentPage, to: page });
    setCurrentPage(page);
  };

  const handleBrowseHabit = (habitId: string) => {
    recordEvent('browse_habit_clicked', { habitId });
  };

  const handleAddHabitFromBrowser = (habitId: string) => {
    recordEvent('habit_added_from_browser', { habitId });
    setShowBrowser(false);
  };

  useEffect(() => {
    recordEvent('app_preview_loaded', { page: currentPage });
  }, []);

  return (
    <div className="h-full bg-gray-50 overflow-hidden relative">
      {/* Testing Info Banner */}
      {testingContext.isTestingMode && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>🧪 Testing Mode Active</span>
              {testingContext.currentUser && (
                <span className="bg-white bg-opacity-20 rounded px-2 py-1 text-xs">
                  User: {testingContext.currentUser.name}
                </span>
              )}
            </div>
            <div className="text-xs opacity-75">
              Events recorded: {testingContext.behaviorEvents.length}
            </div>
          </div>
        </div>
      )}

      {/* App Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-bold text-gray-900">ScienceHabits</h1>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2">
              Demo
            </span>
          </div>
          
          <nav className="flex space-x-1">
            {[
              { key: 'dashboard', label: '📊 Today', icon: '📊' },
              { key: 'habits', label: '📚 My Habits', icon: '📚' },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => handlePageChange(key as typeof currentPage)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="h-full overflow-auto">
        {currentPage === 'dashboard' && (
          <div className="p-6">
            <SimplifiedDashboard />
          </div>
        )}

        {currentPage === 'habits' && (
          <div className="h-full">
            <HabitsCarousel 
              habits={fakeHabits}
              onHabitToggle={handleHabitToggle}
              onAddHabit={handleAddHabit}
            />
          </div>
        )}
      </div>

      {/* Habit Browser Modal */}
      {showBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <HabitBrowser 
              isOpen={showBrowser}
              onClose={() => {
                recordEvent('browse_modal_closed');
                setShowBrowser(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Data Visualization Overlay */}
      {testingContext.isTestingMode && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-3 max-w-xs">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Live Testing Data</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Page:</span>
              <span className="font-medium">{currentPage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Events:</span>
              <span className="font-medium">{testingContext.behaviorEvents.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Session:</span>
              <span className="font-medium">
                {Math.round((Date.now() - (testingContext.behaviorEvents[0]?.timestamp || Date.now())) / 1000)}s
              </span>
            </div>
          </div>
          
          {/* Recent Actions */}
          {testingContext.behaviorEvents.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-1">Recent Actions:</div>
              <div className="space-y-1">
                {testingContext.behaviorEvents.slice(-3).reverse().map((event, index) => (
                  <div key={index} className="text-xs text-gray-600 truncate">
                    <span className="text-blue-600">•</span> {event.action.replace('_', ' ')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Demo Instructions */}
      <div className="fixed bottom-4 left-4 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-sm">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">🎯 Demo Instructions</h4>
        <div className="text-xs text-blue-800 space-y-1">
          <p>• Navigate between pages to test different views</p>
          <p>• Click habit completion buttons in the carousel</p>
          <p>• Try adding new habits from the browser</p>
          <p>• All interactions are recorded for analysis</p>
        </div>
        <div className="mt-2 text-xs text-blue-600">
          <span className="font-medium">Tip:</span> Check the live data panel to see real-time tracking!
        </div>
      </div>
    </div>
  );
}