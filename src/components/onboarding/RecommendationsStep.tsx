import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { Habit } from '../../types';
import { dbHelpers } from '../../services/storage/database';
import goalBasedRecommendations, { GoalBasedHabit } from '../../services/goalBasedRecommendations';

interface HabitCardProps {
  habit: Habit & { researchSummary?: string };
  isSelected: boolean;
  onToggle: () => void;
  recommendation?: GoalBasedHabit;
  isTop3Recommended?: boolean;
}

function HabitCard({ habit, isSelected, onToggle, recommendation, isTop3Recommended = false }: HabitCardProps) {
  const getCategoryIcon = (category: string) => {
    const icons = {
      better_sleep: '🛏️',
      get_moving: '🚶‍♀️', 
      feel_better: '😊',
      stress: '🧘‍♀️',
      productivity: '⚡',
      health: '💪',
      energy: '🔋',
      sleep: '😴'
    };
    return icons[category as keyof typeof icons] || '✨';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'text-green-600 bg-green-100',
      beginner: 'text-green-600 bg-green-100',
      moderate: 'text-yellow-600 bg-yellow-100',
      intermediate: 'text-yellow-600 bg-yellow-100',
      advanced: 'text-red-600 bg-red-100'
    };
    return colors[difficulty as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getEffectivenessRating = (effectivenessScore: number) => {
    if (effectivenessScore >= 9.0) return { label: 'Highly Effective', color: 'text-green-600 bg-green-50' };
    if (effectivenessScore >= 8.0) return { label: 'Very Effective', color: 'text-green-500 bg-green-50' };
    if (effectivenessScore >= 6.5) return { label: 'Moderately Effective', color: 'text-yellow-600 bg-yellow-50' };
    if (effectivenessScore >= 5.0) return { label: 'Somewhat Effective', color: 'text-orange-600 bg-orange-50' };
    return { label: 'Emerging Evidence', color: 'text-red-600 bg-red-50' };
  };

  const effectivenessRating = getEffectivenessRating(habit.effectivenessScore || 7.0);
  const isPrimary = isTop3Recommended;

  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary-300
        ${isSelected 
          ? 'border-primary-500 bg-primary-50' 
          : 'border-gray-200 bg-white hover:bg-gray-50'
        }
        ${isPrimary ? 'ring-2 ring-green-200' : ''}
      `}
      onClick={onToggle}
    >
      {/* Header with icon and primary badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center flex-1">
          <span className="text-2xl mr-3">{getCategoryIcon(habit.category)}</span>
          <div className="flex-1">
            {isPrimary && (
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-1">
                🌟 RECOMMENDED FOR YOU
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-1">
              {habit.title}
            </h3>
            
            {/* Effectiveness rating */}
            <div className="mb-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${effectivenessRating.color} border border-current border-opacity-20`}>
                {effectivenessRating.label}
              </span>
            </div>
            
            {/* Time and difficulty */}
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <span className="flex items-center">
                ⏱️ {habit.timeMinutes} min
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(habit.difficulty)}`}>
                {habit.difficulty}
              </span>
            </div>
          </div>
        </div>
        
        {isSelected && (
          <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Habit description - shown for ALL habits */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 leading-relaxed">
          {habit.description}
        </p>
      </div>
      
      {/* Research findings box - shown only when habit is selected */}
      {isSelected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <div className="text-sm text-blue-900">
            <strong>✓ Research Finding:</strong> {habit.researchSummary || 'Research data being loaded...'}
          </div>
          {habit.effectivenessScore && (
            <div className="text-xs text-blue-700 mt-1">
              📊 Effectiveness Score: {habit.effectivenessScore}/10
            </div>
          )}
        </div>
      )}
      
      {/* Bottom action area */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {habit.goalTags.slice(0, 2).join(', ')}
        </div>
        <button
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            isSelected 
              ? 'bg-primary-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-primary-100'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isSelected ? 'Selected' : 'Select'}
        </button>
      </div>
    </div>
  );
}

export function RecommendationsStep() {
  const { selectedGoals, userData, nextStep, previousStep, setError } = useOnboardingStore();
  const [recommendedHabits, setRecommendedHabits] = useState<(Habit & { researchSummary?: string })[]>([]);
  const [recommendations, setRecommendations] = useState<GoalBasedHabit[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [top3RecommendedHabitIds, setTop3RecommendedHabitIds] = useState<string[]>([]);

  const getCategoryIcon = (category: string) => {
    const icons = {
      better_sleep: '🛏️',
      get_moving: '🚶‍♀️', 
      feel_better: '😊'
    };
    return icons[category as keyof typeof icons] || '✨';
  };

  const getCategoryTitle = (goal: string) => {
    const titles = {
      better_sleep: 'Better Sleep',
      get_moving: 'Get Moving',
      feel_better: 'Feel Better',
      reduce_stress: 'Stress Reduction',
      increase_focus: 'Focus Enhancement',
      improve_mood: 'Mood Improvement',
      increase_energy: 'Energy Boost',
      improve_health: 'Health Improvement'
    };
    return titles[goal as keyof typeof titles] || goal.replace('_', ' ');
  };

  const [debugInfo, setDebugInfo] = useState<{
    goalsMapped: Record<string, string[]>;
    unmappedGoals: string[];
    totalMatched: number;
    warnings: string[];
  } | null>(null);

  useEffect(() => {
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[Onboarding] Loading recommendations for goals:', selectedGoals);
      
      // Use the Smart Recommendation Engine with user profile data
      const userProfile = {
        lifestyleTags: userData.lifestyle ? [userData.lifestyle] : ['professional'],
        timeTags: userData.preferredTime ? [userData.preferredTime] : ['flexible'],
        difficulty: 'easy' as const,
        tier: 'free' as const // Onboarding users start with free tier
      };

      const recommendationResult = await goalBasedRecommendations.getRecommendations({
        selectedGoals,
        language: 'en', // For now, testing with English only
        limit: 50, // Show many habit choices during onboarding
        primaryOnly: false // Show all habits, not just primary recommendations
      });

      console.log('[Onboarding] Recommendation result:', recommendationResult);
      
      // Set debug info for development
      setDebugInfo({
        goalsMapped: { /* Simple recommendations don't need complex mapping */ },
        unmappedGoals: [],
        totalMatched: recommendationResult.totalMatched,
        warnings: recommendationResult.warnings
      });

      if (recommendationResult.recommendations.length === 0) {
        console.warn('[Onboarding] No recommendations found, falling back to database habits');
        
        // Fallback to database approach if Smart Recommendations fails
        await dbHelpers.initializeDatabase();
        const allHabits = await dbHelpers.getAllHabits();
        
        if (allHabits.length > 0) {
          // Use simple filtering as fallback
          const fallbackHabits = allHabits.filter(habit => {
            const isDurationOk = habit.timeMinutes <= (userData.dailyMinutes || 20);
            return !habit.isCustom && isDurationOk;
          }).slice(0, 8); // Limit fallback results
          
          console.log('[Onboarding] Fallback habits:', fallbackHabits.length);
          setRecommendedHabits(fallbackHabits);
          setRecommendations([]); // No recommendation metadata for fallback
          
          if (fallbackHabits.length > 0) {
            const topHabits = fallbackHabits.slice(0, Math.min(3, fallbackHabits.length)).map(h => h.id);
            setSelectedHabits(topHabits);
          }
        } else {
          console.error('[Onboarding] No habits found in database');
          setError('No habits found. This usually means the content API server is not running. Please ensure the sciencehabits-content-api server is started and try again.');
        }
      } else {
        // Success! We have recommendations from the Smart Engine
        console.log('[Onboarding] Found', recommendationResult.recommendations.length, 'recommendations');
        
        // The smart recommendations system now returns full habit data from content API
        // Simple recommendations will load habit details directly from the Content API
        
        const recommendedHabitsData: (Habit & { researchSummary?: string })[] = [];
        const recommendationsWithData: GoalBasedHabit[] = [];
        const seenHabitIds = new Set<string>(); // Track processed habit IDs to prevent duplicates
        
        for (const goalHabit of recommendationResult.recommendations) {
          // Skip if we've already processed this habit (prevent duplicates)
          if (seenHabitIds.has(goalHabit.id)) {
            console.log('[Onboarding] Skipping duplicate habit:', goalHabit.id);
            continue;
          }
          seenHabitIds.add(goalHabit.id);
          
          console.log('[Onboarding] Loading habit:', goalHabit.id, 'Title:', goalHabit.title);
          
          // Convert GoalBasedHabit to legacy Habit format for UI compatibility
          const legacyHabit: Habit & { researchSummary?: string } = {
            id: goalHabit.id,
            title: goalHabit.title,
            description: goalHabit.description,
            category: goalHabit.category,
            goalTags: goalHabit.goalTags || [goalHabit.category],
            lifestyleTags: ['general'],
            timeTags: ['flexible'],
            difficulty: goalHabit.difficulty as 'trivial' | 'easy' | 'moderate' | 'beginner' | 'intermediate' | 'advanced',
            timeMinutes: goalHabit.timeMinutes,
            instructions: Array.isArray(goalHabit.instructions) ? goalHabit.instructions.join('\n') : String(goalHabit.instructions),
            researchIds: [], // Research mapping would need separate implementation
            isCustom: false,
            equipment: 'none',
            frequency: {
              type: 'daily'
            },
            reminders: {
              enabled: false,
              periodicReminderDays: 7
            },
            effectivenessScore: goalHabit.effectivenessScore,
            researchSummary: goalHabit.researchSummary
          };
            
          console.log('[Onboarding] Created legacy habit:', {id: legacyHabit.id, title: legacyHabit.title, category: legacyHabit.category});
          recommendedHabitsData.push(legacyHabit);
          recommendationsWithData.push(goalHabit);
        }
        
        console.log('[Onboarding] Successfully converted', recommendedHabitsData.length, 'content API habits to legacy format');
        
        setRecommendedHabits(recommendedHabitsData);
        setRecommendations(recommendationsWithData);
        
        // Determine top 3 habits for "RECOMMENDED FOR YOU" badges (limit to max 3)
        const top3RecommendedHabits = recommendationsWithData
          .filter(h => h.isPrimaryRecommendation)
          .sort((a, b) => a.priority - b.priority)
          .slice(0, 3)
          .map(r => r.id);
        
        // Store top 3 for badge display logic
        setTop3RecommendedHabitIds(top3RecommendedHabits);
        
        // Pre-select only the top 3 recommended habits
        setSelectedHabits(top3RecommendedHabits);
        
        console.log('[Onboarding] Pre-selected top 3 "RECOMMENDED FOR YOU" habits:', top3RecommendedHabits);
      }
      
    } catch (error) {
      console.error('[Onboarding] Failed to load recommendations:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Provide more specific error messages based on the error type
      if (errorMessage.includes('Content API server is unavailable')) {
        setError('Content server is not running. Please start the sciencehabits-content-api server and refresh the page.');
      } else if (errorMessage.includes('invalid data format')) {
        setError('Content server returned invalid data. Please check the API server configuration.');
      } else {
        setError('Failed to load habit recommendations. Please check your internet connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleHabitToggle = (habitId: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitId)
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };

  const handleContinue = () => {
    // Store selected habits in the store for the final step
    const store = useOnboardingStore.getState();
    const selectedHabitObjects = recommendedHabits.filter(h => selectedHabits.includes(h.id));
    
    // Store in userData with any type assertion for now
    store.setUserData({ 
      ...store.userData,
      selectedInitialHabits: selectedHabitObjects 
    } as any);
    
    nextStep();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Finding perfect habits for you...
        </h2>
        <p className="text-gray-600">
          Based on your goals and preferences
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your Personalized Habits
        </h1>
        <p className="text-gray-600 mb-4">
          We found <strong>{recommendedHabits.length} science-backed habits</strong> that match your goals.
          Choose the ones you'd like to start with.
        </p>
        
      </div>

      {recommendedHabits.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🤔</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No habits found
          </h2>
          <p className="text-gray-600 mb-4">
            We couldn't find habits matching your preferences. Let's go back and adjust them.
          </p>
          <Button onClick={previousStep}>
            Adjust Preferences
          </Button>
        </div>
      ) : (
        <>
          {/* Primary Recommendation Display */}
          {recommendations.length > 0 && (
            <div className="mb-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {getCategoryIcon(recommendedHabits[0]?.category || 'better_sleep')} Your {getCategoryTitle(selectedGoals[0] || 'better_sleep')} Plan
                </h2>
                <p className="text-gray-600">
                  Based on scientific evidence and your goals
                </p>
              </div>

              {/* Top recommendation as hero card */}
              {recommendedHabits.length > 0 && (
                <div className="mb-6">
                  <HabitCard
                    key={recommendedHabits[0].id}
                    habit={recommendedHabits[0]}
                    isSelected={selectedHabits.includes(recommendedHabits[0].id)}
                    onToggle={() => handleHabitToggle(recommendedHabits[0].id)}
                    recommendation={recommendations.find(r => r.id === recommendedHabits[0].id)}
                    isTop3Recommended={top3RecommendedHabitIds.includes(recommendedHabits[0].id)}
                  />
                </div>
              )}

              {/* See other options button */}
              {recommendedHabits.length > 1 && (
                <div className="text-center mb-6">
                  <button
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:border-primary-300 transition-colors"
                    onClick={() => setShowAllOptions(true)}
                  >
                    See Other Options ({recommendedHabits.length - 1} more)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* All options view */}
          {showAllOptions && (
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  All {getCategoryTitle(selectedGoals[0] || 'better_sleep')} Habits
                </h3>
                <button
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  onClick={() => setShowAllOptions(false)}
                >
                  ← Back to Recommendation
                </button>
              </div>
              
              {recommendedHabits.map((habit) => {
                const recommendation = recommendations.find(r => r.id === habit.id);
                return (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    isSelected={selectedHabits.includes(habit.id)}
                    onToggle={() => handleHabitToggle(habit.id)}
                    recommendation={recommendation}
                    isTop3Recommended={top3RecommendedHabitIds.includes(habit.id)}
                  />
                );
              })}
            </div>
          )}

          {selectedHabits.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-green-600 mr-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-green-800 font-medium">
                    {selectedHabits.length} habit{selectedHabits.length > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs text-green-700">
                    Perfect! Starting small increases your success rate by 85%.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedHabits.length > 0 && (
            <div className="text-center">
              <Button 
                onClick={handleContinue}
                className="px-8 py-3"
              >
                Start Building Habits
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}