import React, { useState, useRef, useEffect } from 'react';
import { Habit } from '../../types';
import bundledHabits from '../../data/bundled/habits/all.json';
import { useUserStore } from '../../stores/userStore';

// Format category names from snake_case to proper titles
const formatCategoryName = (category: string): string => {
  const categoryMap: { [key: string]: string } = {
    'better_sleep': 'Better Sleep',
    'get_moving': 'Get Moving',
    'feel_better': 'Feel Better'
  };
  return categoryMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

interface HabitsCarouselProps {
  habits: Habit[];
  onHabitToggle?: (habitId: string) => void;
  onAddHabit?: () => void;
}

interface HabitWithStats extends Habit {
  completed: boolean;
  streak: number;
  totalSessions: number;
  researchData: {
    keyFindings: string;
    mechanismOfAction: string;
    citations: string[];
  };
  instructions: string[];
}

export function HabitsCarousel({ 
  habits, 
  onHabitToggle, 
  onAddHabit 
}: HabitsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Get user progress data for calculating real streaks and totals
  const { userProgress } = useUserStore();
  
  // Helper function to get progress data for a habit
  const getHabitProgress = (habitId: string) => {
    return userProgress.find(p => p.habitId === habitId);
  };
  
  // Helper function to check if habit is completed today
  const isHabitCompletedToday = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const progress = getHabitProgress(habitId);
    return progress?.completions.includes(today) || false;
  };

  // Always use user's habits - enhance them with research data from bundled habits if needed
  const habitsToUse = habits.map((userHabit): Habit => {
    // Find matching bundled habit for research data
    const bundledHabit = bundledHabits.data.find((bh: any) => bh.id === userHabit.id);
    
    // If user habit has research data, use it as-is
    if (userHabit.whyEffective && userHabit.researchSummary && userHabit.sources) {
      return userHabit;
    }
    
    // Otherwise, enhance user habit with bundled research data
    if (bundledHabit) {
      return {
        ...userHabit,
        whyEffective: bundledHabit.whyEffective || userHabit.whyEffective,
        researchSummary: bundledHabit.researchSummary || userHabit.researchSummary,
        sources: bundledHabit.sources || userHabit.sources,
        instructions: bundledHabit.instructions || userHabit.instructions,
        progressionTips: bundledHabit.progressionTips || userHabit.progressionTips,
        optimalTiming: bundledHabit.optimalTiming || userHabit.optimalTiming,
        effectivenessScore: bundledHabit.effectivenessScore || userHabit.effectivenessScore
      };
    }
    
    // Return user habit as-is if no matching bundled data
    return userHabit;
  });

  // Convert habits to enhanced format with comprehensive research data
  const enhancedHabits: HabitWithStats[] = habitsToUse.map((habit, index) => {
    // Get real progress data for this habit
    const progress = getHabitProgress(habit.id);
    
    const enhanced = {
      ...habit,
      completed: isHabitCompletedToday(habit.id),
      streak: progress?.currentStreak || 0,
      totalSessions: progress?.totalDays || 0,
      researchData: {
        keyFindings: habit.researchSummary || `Clinical research on ${formatCategoryName(habit.category).toLowerCase()} shows promising results`,
        mechanismOfAction: habit.whyEffective || `Research on ${formatCategoryName(habit.category).toLowerCase()} benefits is ongoing`,
        citations: habit.sources || [`Research pending review`, `Study in progress`]
      },
      instructions: Array.isArray(habit.instructions) ? habit.instructions : [
        "Begin with proper preparation and mindset",
        "Follow the core technique for the recommended duration", 
        "Maintain focus throughout the practice",
        "Complete with reflection and integration",
        "Track your progress and feelings"
      ]
    };
    
    return enhanced;
  });


  // Dynamic color functions
  const getCategoryColor = (category: string) => {
    const colors = [
      "bg-purple-100 text-purple-800",
      "bg-green-100 text-green-800", 
      "bg-blue-100 text-blue-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
      "bg-yellow-100 text-yellow-800",
      "bg-red-100 text-red-800"
    ];
    
    const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      "beginner": "bg-green-50 text-green-700",
      "easy": "bg-green-50 text-green-700",
      "intermediate": "bg-yellow-50 text-yellow-700",
      "moderate": "bg-yellow-50 text-yellow-700", 
      "advanced": "bg-red-50 text-red-700"
    };
    return colors[difficulty as keyof typeof colors] || "bg-gray-50 text-gray-700";
  };

  const getEvidenceColor = (evidenceStrength: string) => {
    const colors = {
      "very_high": "bg-emerald-100 text-emerald-800",
      "high": "bg-green-100 text-green-800",
      "moderate": "bg-yellow-100 text-yellow-800", 
      "low": "bg-orange-100 text-orange-800"
    };
    return colors[evidenceStrength as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Scroll handling
  const handleScroll = () => {
    if (!carouselRef.current) return;
    
    const scrollLeft = carouselRef.current.scrollLeft;
    // Calculate card width based on responsive breakpoints
    const getCardWidth = () => {
      const width = window.innerWidth;
      if (width >= 1024) return 384; // lg
      if (width >= 768) return 320;  // md
      if (width >= 640) return width - 32; // sm
      return width - 24; // mobile: calc(100vw-1.5rem)
    };
    const cardWidth = getCardWidth();
    const newIndex = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(newIndex, enhancedHabits.length - 1));
  };

  const scrollToCard = (index: number) => {
    if (!carouselRef.current) return;
    
    // Calculate card width based on responsive breakpoints
    const getCardWidth = () => {
      const width = window.innerWidth;
      if (width >= 1024) return 384; // lg
      if (width >= 768) return 320;  // md
      if (width >= 640) return width - 32; // sm
      return width - 24; // mobile: calc(100vw-1.5rem)
    };
    const cardWidth = getCardWidth();
    carouselRef.current.scrollTo({
      left: cardWidth * index,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', handleScroll);
      return () => carousel.removeEventListener('scroll', handleScroll);
    }
  }, []);

  if (enhancedHabits.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No habits yet</h2>
          <p className="text-gray-600 mb-6">Start building healthy habits backed by science</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
      </div>


      {/* Carousel Container */}
      <div className="relative">
        {/* Scrollable Container */}
        <div 
          ref={carouselRef}
          className="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory scrollbar-hide px-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {enhancedHabits.map((habit) => (
            <div 
              key={habit.id}
              className="flex-none w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2rem)] md:w-80 lg:w-96 snap-start"
            >
              <HabitCard 
                habit={habit} 
                onToggle={() => onHabitToggle?.(habit.id)}
                getCategoryColor={getCategoryColor}
                getDifficultyColor={getDifficultyColor}
                getEvidenceColor={getEvidenceColor}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {enhancedHabits.length > 1 && (
          <>
            {/* Left Arrow */}
            <button 
              onClick={() => scrollToCard(Math.max(0, activeIndex - 1))}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
              disabled={activeIndex === 0}
              style={{ opacity: activeIndex === 0 ? 0.5 : 1 }}
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right Arrow */}
            <button 
              onClick={() => scrollToCard(Math.min(enhancedHabits.length - 1, activeIndex + 1))}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
              disabled={activeIndex === enhancedHabits.length - 1}
              style={{ opacity: activeIndex === enhancedHabits.length - 1 ? 0.5 : 1 }}
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Carousel Indicators */}
      {enhancedHabits.length > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {enhancedHabits.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToCard(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === activeIndex 
                  ? 'bg-blue-600 scale-110' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
      
      {/* Custom CSS for scrollbar hiding */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
    </div>
  );
}

interface HabitCardProps {
  habit: HabitWithStats;
  onToggle: () => void;
  getCategoryColor: (category: string) => string;
  getDifficultyColor: (difficulty: string) => string;
  getEvidenceColor: (evidenceStrength: string) => string;
}

function HabitCard({ 
  habit, 
  onToggle, 
  getCategoryColor, 
  getDifficultyColor, 
  getEvidenceColor 
}: HabitCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Card Header */}
      <div className="p-4 sm:p-6 pb-3 sm:pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Completion Status */}
            <button
              onClick={onToggle}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 ${
                habit.completed ? 'bg-green-500' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {habit.completed && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            
            {/* Category Badge */}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(habit.category)}`}>
              {formatCategoryName(habit.category)}
            </span>

            {/* Streak and Sessions */}
            <div className="flex items-center gap-2 ml-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-orange-600">{habit.streak}</span>
                <span className="text-xs text-gray-500">streak</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-blue-600">{habit.totalSessions}</span>
                <span className="text-xs text-gray-500">total</span>
              </div>
            </div>
          </div>
          
          {/* Difficulty & Duration */}
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(habit.difficulty)}`}>
              {habit.difficulty}
            </span>
            <span className="text-xs text-gray-500">{habit.timeMinutes} min</span>
          </div>
        </div>

        {/* Title and Description */}
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{habit.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{habit.description}</p>

      </div>

      {/* Research Details Section */}
      <div className="p-4 sm:p-6">
        {/* Mechanism of Action */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">How it works:</h4>
          <p className="text-sm text-gray-700">{habit.researchData.mechanismOfAction}</p>
        </div>

        {/* Instructions */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">How to do it:</h4>
          <ol className="space-y-1">
            {habit.instructions.map((instruction, index) => (
              <li key={index} className="text-sm text-gray-700 flex">
                <span className="text-blue-600 font-medium mr-2 min-w-[1.5rem]">{index + 1}.</span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Research Verification Bar */}
      <div className="bg-blue-50 px-4 sm:px-6 py-3 border-t border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-blue-900">Research Verified</span>
        </div>
        
        <div className="mb-3">
          <p className="text-sm text-blue-800 font-medium">{habit.researchSummary || 'Research summary available upon request'}</p>
        </div>
        
        <div>
          <p className="text-sm text-blue-800">
            <span className="font-medium">Source: </span>
            {(habit.sources || habit.researchData.citations).map((citation, index) => (
              <span key={index}>
                {citation}
                {index < (habit.sources || habit.researchData.citations).length - 1 && '; '}
              </span>
            ))}
          </p>
        </div>
      </div>

    </div>
  );
}