import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  category: 'setup' | 'learning' | 'action' | 'mastery';
  estimatedMinutes: number;
  isCompleted: boolean;
  isOptional: boolean;
  dependencies?: string[]; // Step IDs that must be completed first
  completionCriteria: string;
  helpContent?: {
    tips: string[];
    videoUrl?: string;
    articleUrl?: string;
  };
}

interface OnboardingPhase {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  estimatedDuration: number;
  completionMessage: string;
}

interface OnboardingProgressProps {
  user: User;
  onStepComplete: (stepId: string) => void;
  onPhaseComplete: (phaseId: string) => void;
  onClose?: () => void;
  showMinimal?: boolean;
}

export function OnboardingProgressTracker({ 
  user, 
  onStepComplete, 
  onPhaseComplete, 
  onClose,
  showMinimal = false 
}: OnboardingProgressProps) {
  const { animationsEnabled, emotionalDesign } = useUIPreferencesStore();
  const [currentPhase, setCurrentPhase] = useState(0);
  const [expandedHelp, setExpandedHelp] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const onboardingPhases: OnboardingPhase[] = [
    {
      id: 'foundation',
      name: 'Foundation Setup',
      description: 'Get your account configured and understand the basics',
      estimatedDuration: 10,
      completionMessage: 'Great foundation! You\'re ready to dive deeper.',
      steps: [
        {
          id: 'profile_complete',
          title: 'Complete Your Profile',
          description: 'Add your goals, preferences, and lifestyle information',
          category: 'setup',
          estimatedMinutes: 3,
          isCompleted: false,
          isOptional: false,
          completionCriteria: 'Profile has name, goals, and preferred time filled',
          helpContent: {
            tips: [
              'Your goals help us suggest relevant habits',
              'Preferred time affects when we send reminders',
              'Lifestyle info helps tailor difficulty levels'
            ]
          }
        },
        {
          id: 'first_habit',
          title: 'Create Your First Habit',
          description: 'Start with one simple, meaningful habit',
          category: 'action',
          estimatedMinutes: 2,
          isCompleted: false,
          isOptional: false,
          dependencies: ['profile_complete'],
          completionCriteria: 'At least one habit created and configured',
          helpContent: {
            tips: [
              'Start small - 2-5 minutes is perfect',
              'Choose something you already want to do',
              'Link it to an existing routine if possible'
            ]
          }
        },
        {
          id: 'first_completion',
          title: 'Complete Your First Habit',
          description: 'Experience the satisfaction of marking your first completion',
          category: 'action',
          estimatedMinutes: 2,
          isCompleted: false,
          isOptional: false,
          dependencies: ['first_habit'],
          completionCriteria: 'First habit marked as completed at least once',
          helpContent: {
            tips: [
              'Don\'t worry about perfection - just do it!',
              'Notice how good it feels to check it off',
              'This creates positive reinforcement in your brain'
            ]
          }
        },
        {
          id: 'personalization_setup',
          title: 'Set Personalization Preferences',
          description: 'Choose how ScienceHabits adapts to your needs',
          category: 'setup',
          estimatedMinutes: 3,
          isCompleted: false,
          isOptional: true,
          completionCriteria: 'Personalization level selected and configured',
          helpContent: {
            tips: [
              'You can change these settings anytime',
              'Higher personalization = more relevant suggestions',
              'Consider your privacy preferences'
            ]
          }
        }
      ]
    },
    {
      id: 'learning',
      name: 'Learning & Discovery',
      description: 'Understand the science and discover what works for you',
      estimatedDuration: 15,
      completionMessage: 'You\'re becoming a habit formation expert!',
      steps: [
        {
          id: 'research_explore',
          title: 'Explore the Research Library',
          description: 'Learn about the science behind habit formation',
          category: 'learning',
          estimatedMinutes: 5,
          isCompleted: false,
          isOptional: true,
          completionCriteria: 'Read at least one research article',
          helpContent: {
            tips: [
              'Understanding the "why" increases motivation',
              'Research helps you make informed decisions',
              'Knowledge builds confidence in your approach'
            ],
            articleUrl: '/research/habit-formation-basics'
          }
        },
        {
          id: 'smart_scheduling',
          title: 'Try Smart Scheduling',
          description: 'Let AI optimize your habit timing',
          category: 'learning',
          estimatedMinutes: 3,
          isCompleted: false,
          isOptional: true,
          dependencies: ['first_completion'],
          completionCriteria: 'Smart scheduling enabled and recommendations viewed',
          helpContent: {
            tips: [
              'Smart scheduling learns from your patterns',
              'It suggests optimal times based on your success rate',
              'You can always override the suggestions'
            ]
          }
        },
        {
          id: 'progress_review',
          title: 'Review Your Progress',
          description: 'Check your first progress visualizations',
          category: 'learning',
          estimatedMinutes: 2,
          isCompleted: false,
          isOptional: false,
          dependencies: ['first_completion'],
          completionCriteria: 'Viewed progress dashboard at least once',
          helpContent: {
            tips: [
              'Visual progress is motivating',
              'Look for patterns in your completion times',
              'Celebrate small wins!'
            ]
          }
        },
        {
          id: 'category_explore',
          title: 'Explore Habit Categories',
          description: 'Discover habits in different areas of life',
          category: 'learning',
          estimatedMinutes: 5,
          isCompleted: false,
          isOptional: true,
          completionCriteria: 'Browsed at least 3 habit categories',
          helpContent: {
            tips: [
              'Different categories support different goals',
              'Balance is key - don\'t focus on just one area',
              'Start with categories that excite you most'
            ]
          }
        }
      ]
    },
    {
      id: 'expansion',
      name: 'Expanding Your Practice',
      description: 'Build a sustainable habit routine',
      estimatedDuration: 20,
      completionMessage: 'You\'re building a comprehensive habit practice!',
      steps: [
        {
          id: 'multiple_habits',
          title: 'Add 2-3 More Habits',
          description: 'Expand your routine gradually',
          category: 'action',
          estimatedMinutes: 8,
          isCompleted: false,
          isOptional: false,
          dependencies: ['progress_review'],
          completionCriteria: 'At least 3 active habits total',
          helpContent: {
            tips: [
              'Add one habit at a time, not all at once',
              'Wait until your first habit feels automatic',
              'Choose different categories for balance'
            ]
          }
        },
        {
          id: 'habit_stacking',
          title: 'Try Habit Stacking',
          description: 'Connect habits together for better consistency',
          category: 'action',
          estimatedMinutes: 5,
          isCompleted: false,
          isOptional: true,
          dependencies: ['multiple_habits'],
          completionCriteria: 'Created at least one habit stack',
          helpContent: {
            tips: [
              'Link new habits to established routines',
              'Use the formula: "After I [habit], I will [new habit]"',
              'This leverages existing neural pathways'
            ]
          }
        },
        {
          id: 'difficulty_adjustment',
          title: 'Adjust Difficulty Levels',
          description: 'Fine-tune your habits for optimal challenge',
          category: 'action',
          estimatedMinutes: 3,
          isCompleted: false,
          isOptional: true,
          dependencies: ['multiple_habits'],
          completionCriteria: 'Manually adjusted difficulty on at least one habit',
          helpContent: {
            tips: [
              'Too easy = no growth, too hard = giving up',
              'Aim for 70-80% success rate',
              'Adjust based on your recent completion patterns'
            ]
          }
        },
        {
          id: 'recovery_experience',
          title: 'Experience Recovery Support',
          description: 'Learn how the app helps when you struggle',
          category: 'learning',
          estimatedMinutes: 4,
          isCompleted: false,
          isOptional: true,
          completionCriteria: 'Viewed recovery suggestions or compassion message',
          helpContent: {
            tips: [
              'Everyone struggles sometimes - it\'s normal',
              'The app detects patterns and offers support',
              'Recovery is part of the habit formation process'
            ]
          }
        }
      ]
    },
    {
      id: 'mastery',
      name: 'Mastery & Optimization',
      description: 'Become a habit formation expert',
      estimatedDuration: 25,
      completionMessage: 'Congratulations! You\'re now a ScienceHabits expert!',
      steps: [
        {
          id: 'week_consistency',
          title: 'Achieve One Week Consistency',
          description: 'Complete habits consistently for 7 days',
          category: 'mastery',
          estimatedMinutes: 0, // This happens over time
          isCompleted: false,
          isOptional: false,
          dependencies: ['multiple_habits'],
          completionCriteria: '7 consecutive days with 70%+ completion rate',
          helpContent: {
            tips: [
              'Consistency matters more than perfection',
              'Focus on showing up, even if it\'s minimal',
              'This is where real habit formation happens'
            ]
          }
        },
        {
          id: 'analytics_review',
          title: 'Review Detailed Analytics',
          description: 'Understand your patterns and optimize',
          category: 'mastery',
          estimatedMinutes: 10,
          isCompleted: false,
          isOptional: true,
          dependencies: ['week_consistency'],
          completionCriteria: 'Spent time in analytics dashboard',
          helpContent: {
            tips: [
              'Look for patterns in your most/least successful times',
              'Identify which habits support each other',
              'Use data to make informed adjustments'
            ]
          }
        },
        {
          id: 'community_engage',
          title: 'Engage with Community',
          description: 'Share your success or get support',
          category: 'mastery',
          estimatedMinutes: 5,
          isCompleted: false,
          isOptional: true,
          completionCriteria: 'Shared progress or asked for help',
          helpContent: {
            tips: [
              'Community support increases success rates',
              'Your story might inspire others',
              'Don\'t be afraid to ask for help'
            ]
          }
        },
        {
          id: 'advanced_features',
          title: 'Explore Advanced Features',
          description: 'Try experimental and power-user features',
          category: 'mastery',
          estimatedMinutes: 10,
          isCompleted: false,
          isOptional: true,
          dependencies: ['analytics_review'],
          completionCriteria: 'Used at least 2 advanced features',
          helpContent: {
            tips: [
              'Advanced features unlock with experience',
              'These tools help optimize your approach',
              'Experiment to find what works best for you'
            ]
          }
        }
      ]
    }
  ];

  useEffect(() => {
    // Load progress from storage
    const savedProgress = localStorage.getItem(`onboarding_progress_${user.id}`);
    if (savedProgress) {
      try {
        const { completedSteps: saved, currentPhase: savedPhase } = JSON.parse(savedProgress);
        setCompletedSteps(new Set(saved));
        setCurrentPhase(savedPhase);
      } catch (error) {
        console.error('Failed to load onboarding progress:', error);
      }
    }
  }, [user.id]);

  useEffect(() => {
    // Save progress when it changes
    localStorage.setItem(`onboarding_progress_${user.id}`, JSON.stringify({
      completedSteps: Array.from(completedSteps),
      currentPhase
    }));
  }, [completedSteps, currentPhase, user.id]);

  const markStepComplete = (stepId: string) => {
    if (!completedSteps.has(stepId)) {
      const newCompleted = new Set([...completedSteps, stepId]);
      setCompletedSteps(newCompleted);
      onStepComplete(stepId);

      // Check if phase is complete
      const phase = onboardingPhases[currentPhase];
      const requiredSteps = phase.steps.filter(step => !step.isOptional);
      const completedRequired = requiredSteps.filter(step => newCompleted.has(step.id));
      
      if (completedRequired.length === requiredSteps.length) {
        // Phase complete, advance to next
        if (currentPhase < onboardingPhases.length - 1) {
          setCurrentPhase(currentPhase + 1);
          onPhaseComplete(phase.id);
        }
      }
    }
  };

  const getStepStatus = (step: OnboardingStep) => {
    if (completedSteps.has(step.id)) return 'completed';
    
    // Check dependencies
    if (step.dependencies?.some(depId => !completedSteps.has(depId))) {
      return 'locked';
    }
    
    return 'available';
  };

  const calculatePhaseProgress = (phase: OnboardingPhase) => {
    const requiredSteps = phase.steps.filter(step => !step.isOptional);
    const completedRequired = requiredSteps.filter(step => completedSteps.has(step.id));
    return requiredSteps.length > 0 ? completedRequired.length / requiredSteps.length : 0;
  };

  const getOverallProgress = () => {
    const totalRequired = onboardingPhases.reduce((sum, phase) => 
      sum + phase.steps.filter(step => !step.isOptional).length, 0);
    const totalCompleted = onboardingPhases.reduce((sum, phase) =>
      sum + phase.steps.filter(step => !step.isOptional && completedSteps.has(step.id)).length, 0);
    return totalRequired > 0 ? totalCompleted / totalRequired : 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-compassion-500">✓</span>;
      case 'locked':
        return <span className="text-gray-400">🔒</span>;
      case 'available':
        return <span className="text-progress-500">◯</span>;
      default:
        return <span className="text-gray-400">◯</span>;
    }
  };

  const getCategoryColor = (category: OnboardingStep['category']) => {
    switch (category) {
      case 'setup': return 'bg-blue-100 text-blue-800';
      case 'learning': return 'bg-purple-100 text-purple-800';
      case 'action': return 'bg-green-100 text-green-800';
      case 'mastery': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showMinimal) {
    const overallProgress = getOverallProgress();
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">Onboarding Progress</h3>
          <span className="text-sm text-gray-600">
            {Math.round(overallProgress * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-progress-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress * 100}%` }}
          />
        </div>
      </div>
    );
  }

  const currentPhaseData = onboardingPhases[currentPhase];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to ScienceHabits!</h1>
          <p className="text-gray-600 mt-1">
            Let's get you set up for success with science-backed habit building
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Overall Progress */}
      <div className="bg-gradient-to-r from-compassion-50 to-progress-50 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Journey Progress</h2>
          <span className="text-sm text-gray-600">
            {Math.round(getOverallProgress() * 100)}% Complete
          </span>
        </div>
        
        <div className="w-full bg-white/60 rounded-full h-3 mb-4">
          <div
            className="bg-progress-500 h-3 rounded-full transition-all duration-1000"
            style={{ width: `${getOverallProgress() * 100}%` }}
          />
        </div>

        {/* Phase indicators */}
        <div className="flex justify-between">
          {onboardingPhases.map((phase, index) => (
            <div
              key={phase.id}
              className={`flex flex-col items-center ${index <= currentPhase ? 'opacity-100' : 'opacity-50'}`}
            >
              <div
                className={`w-4 h-4 rounded-full mb-2 ${
                  index < currentPhase ? 'bg-compassion-500' :
                  index === currentPhase ? 'bg-progress-500' : 'bg-gray-300'
                }`}
              />
              <span className="text-xs text-gray-600 text-center">{phase.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Phase */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{currentPhaseData.name}</h3>
            <p className="text-gray-600">{currentPhaseData.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Estimated time</div>
            <div className="font-medium text-progress-600">{currentPhaseData.estimatedDuration} min</div>
          </div>
        </div>

        {/* Phase progress */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-progress-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${calculatePhaseProgress(currentPhaseData) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {currentPhaseData.steps.map(step => {
            const status = getStepStatus(step);
            const isExpandedHelp = expandedHelp === step.id;
            
            return (
              <div
                key={step.id}
                className={`
                  border rounded-lg p-4 transition-all duration-200
                  ${status === 'completed' ? 'border-compassion-200 bg-compassion-50' :
                    status === 'available' ? 'border-progress-200 bg-progress-50' :
                    'border-gray-200 bg-gray-50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <div className="mr-3 mt-1">
                      {getStatusIcon(status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className={`font-medium ${status === 'locked' ? 'text-gray-400' : 'text-gray-900'}`}>
                          {step.title}
                        </h4>
                        <span className={`ml-3 px-2 py-1 text-xs rounded-full ${getCategoryColor(step.category)}`}>
                          {step.category}
                        </span>
                        {step.isOptional && (
                          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${status === 'locked' ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                        {step.description}
                      </p>
                      
                      {step.estimatedMinutes > 0 && (
                        <div className="text-xs text-gray-500">
                          ⏱️ ~{step.estimatedMinutes} minutes
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {step.helpContent && (
                      <button
                        onClick={() => setExpandedHelp(isExpandedHelp ? null : step.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Get help"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    
                    {status === 'available' && (
                      <button
                        onClick={() => markStepComplete(step.id)}
                        className="px-3 py-1 text-sm bg-progress-600 text-white rounded-lg hover:bg-progress-700 transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                    
                    {status === 'completed' && (
                      <span className="text-sm text-compassion-600 font-medium">✓ Complete</span>
                    )}
                  </div>
                </div>

                {/* Expanded help content */}
                {isExpandedHelp && step.helpContent && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">💡 Helpful Tips</h5>
                    <ul className="space-y-1">
                      {step.helpContent.tips.map((tip, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-progress-500 mr-2">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                    
                    {step.helpContent.articleUrl && (
                      <div className="mt-3">
                        <a
                          href={step.helpContent.articleUrl}
                          className="text-sm text-progress-600 hover:text-progress-700 underline"
                        >
                          📖 Read more in our guide
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}