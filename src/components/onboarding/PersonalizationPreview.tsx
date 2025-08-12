import React, { useState, useEffect } from 'react';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { Habit } from '../../types';

interface PersonalizationPreviewProps {
  selectedGoals: string[];
  category?: {
    id: string;
    title: string;
    icon: string;
    color: string;
  };
}

interface PreviewHabit {
  id: string;
  title: string;
  timeMinutes: number;
  difficulty: 'trivial' | 'easy' | 'moderate';
  icon?: string;
  credibility: 'high' | 'medium' | 'low';
}

export function PersonalizationPreview({ selectedGoals, category }: PersonalizationPreviewProps) {
  const { animationsEnabled, emotionalDesign } = useUIPreferencesStore();
  const { availableGoals } = useOnboardingStore();
  
  const [previewHabits, setPreviewHabits] = useState<PreviewHabit[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    // Mock habit recommendations based on selected goals
    // In production, this would call a recommendation service
    const mockHabits: PreviewHabit[] = [];
    
    selectedGoals.forEach((goalId) => {
      const goal = availableGoals.find(g => g.id === goalId);
      if (!goal) return;

      // Generate mock habits based on goal type
      if (category?.id === 'health') {
        mockHabits.push(
          {
            id: `${goalId}_1`,
            title: '5-Minute Morning Stretch',
            timeMinutes: 5,
            difficulty: 'easy',
            icon: '🧘‍♀️',
            credibility: 'high'
          },
          {
            id: `${goalId}_2`, 
            title: 'Evening Walk',
            timeMinutes: 15,
            difficulty: 'moderate',
            icon: '🚶‍♀️',
            credibility: 'high'
          }
        );
      } else if (category?.id === 'wellbeing') {
        mockHabits.push(
          {
            id: `${goalId}_1`,
            title: '3-Minute Breathing Exercise',
            timeMinutes: 3,
            difficulty: 'trivial',
            icon: '🌬️',
            credibility: 'high'
          },
          {
            id: `${goalId}_2`,
            title: 'Gratitude Journaling',
            timeMinutes: 8,
            difficulty: 'easy',
            icon: '📓',
            credibility: 'medium'
          }
        );
      } else if (category?.id === 'productivity') {
        mockHabits.push(
          {
            id: `${goalId}_1`,
            title: 'Daily Planning Session',
            timeMinutes: 10,
            difficulty: 'moderate',
            icon: '📅',
            credibility: 'medium'
          },
          {
            id: `${goalId}_2`,
            title: 'Quick Learning Review',
            timeMinutes: 12,
            difficulty: 'moderate',
            icon: '📚',
            credibility: 'high'
          }
        );
      }
    });

    // Remove duplicates and limit to 3-4 habits
    const uniqueHabits = mockHabits
      .filter((habit, index, self) => 
        index === self.findIndex(h => h.title === habit.title)
      )
      .slice(0, 4);

    setPreviewHabits(uniqueHabits);
    setTotalMinutes(uniqueHabits.reduce((sum, habit) => sum + habit.timeMinutes, 0));
  }, [selectedGoals, category, availableGoals]);

  if (selectedGoals.length === 0) {
    return (
      <div className={`card p-6 ${animationsEnabled ? 'animate-fade-in' : ''}`}>
        <div className="text-center text-gray-400">
          <div className="text-3xl mb-3">✨</div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Habit Preview
          </h3>
          <p className="text-xs text-gray-500">
            Select goals to see personalized habit recommendations
          </p>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: PreviewHabit['difficulty']) => {
    switch (difficulty) {
      case 'trivial': return 'text-green-600 bg-green-100';
      case 'easy': return 'text-blue-600 bg-blue-100';
      case 'moderate': return 'text-amber-600 bg-amber-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCredibilityColor = (credibility: PreviewHabit['credibility']) => {
    switch (credibility) {
      case 'high': return 'text-research-700 bg-research-100 border-research-200';
      case 'medium': return 'text-research-600 bg-research-50 border-research-100';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`card ${emotionalDesign === 'compassionate' ? 'card-compassionate' : ''} ${
      animationsEnabled ? 'animate-slide-up' : ''
    }`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Your Personalized Habits
          </h3>
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>{totalMinutes} min/day</span>
          </div>
        </div>
        
        <p className="text-xs text-gray-600">
          Based on your selected {selectedGoals.length > 1 ? 'goals' : 'goal'}
        </p>
      </div>

      <div className="space-y-3">
        {previewHabits.map((habit, index) => (
          <div 
            key={habit.id}
            className={`
              p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors
              ${animationsEnabled ? 'hover:scale-[1.02]' : ''}
            `}
            style={{
              animationDelay: animationsEnabled ? `${index * 100}ms` : '0ms',
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-1 min-w-0">
                {habit.icon && (
                  <div className="text-lg mr-2 mt-0.5">
                    {habit.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {habit.title}
                  </h4>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-xs text-gray-500">
                      {habit.timeMinutes} min
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getDifficultyColor(habit.difficulty)}`}>
                      {habit.difficulty}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={`px-1.5 py-0.5 text-xs rounded border ${getCredibilityColor(habit.credibility)}`}>
                <svg className="w-3 h-3 inline mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                </svg>
                {habit.credibility}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-compassion-50 border border-compassion-200 rounded-lg">
        <div className="flex items-center text-sm">
          <div className="text-compassion-600 mr-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-compassion-800 font-medium">
              Perfect daily routine!
            </p>
            <p className="text-compassion-700 text-xs mt-0.5">
              {previewHabits.length} science-backed habits, {totalMinutes} minutes total
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          You'll customize timing and details next
        </p>
      </div>
    </div>
  );
}