/**
 * Mobile Formation Milestones Carousel
 * 
 * Horizontal swipeable carousel showing habit formation progress
 * based on research (21-day neural strengthening, 66-day automaticity).
 */

import React, { useRef, useEffect, useState } from 'react';
import { Habit, Progress } from '../../../types';

interface MobileFormationCarouselProps {
  habits: Habit[];
  progress: Progress[];
}

interface Milestone {
  days: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  scienceFact: string;
}

const MILESTONES: Milestone[] = [
  {
    days: 21,
    title: "Neural Strengthening",
    description: "Brain pathway formation",
    icon: "🧠",
    color: "blue",
    scienceFact: "Neural pathways strengthen significantly around 21 days of consistent practice."
  },
  {
    days: 66,
    title: "Automaticity",
    description: "True habit formation",
    icon: "⚡",
    color: "purple",
    scienceFact: "Research average for habit automaticity - when behaviors become truly automatic."
  }
];

export function MobileFormationCarousel({ habits, progress }: MobileFormationCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Calculate progress for each milestone
  const calculateMilestoneProgress = (targetDays: number) => {
    return progress.filter(p => {
      const habit = habits.find(h => h.id === p.habitId);
      if (!habit) return false;
      
      // Calculate days since habit started
      const startDate = new Date(p.dateStarted);
      const today = new Date();
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysSinceStart >= targetDays;
    });
  };

  // Handle scroll to update active indicator
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = carousel.clientWidth * 0.8; // 80% width cards
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(newIndex, MILESTONES.length - 1));
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, []);

  if (habits.length === 0) {
    return (
      <div className="mb-6 px-4">
        <h3 className="text-lg font-semibold mb-3">Formation Progress</h3>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">🌱</div>
          <p className="text-sm text-gray-600">Start tracking habits to see formation milestones!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="px-4 mb-3">
        <h3 className="text-lg font-semibold">Formation Progress</h3>
        <p className="text-sm text-gray-600">Research-based habit milestones</p>
      </div>
      
      {/* Swipeable Milestone Cards */}
      <div 
        ref={carouselRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {MILESTONES.map((milestone) => {
          const milestoneProgress = calculateMilestoneProgress(milestone.days);
          const progressCount = milestoneProgress.length;
          const totalHabits = habits.length;
          const progressPercentage = totalHabits > 0 ? (progressCount / totalHabits) * 100 : 0;
          
          return (
            <MilestoneCard
              key={milestone.days}
              milestone={milestone}
              progressCount={progressCount}
              totalHabits={totalHabits}
              progressPercentage={progressPercentage}
            />
          );
        })}
      </div>
      
      {/* Scroll Indicators */}
      <div className="flex justify-center mt-3 space-x-2">
        {MILESTONES.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index === activeIndex ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

interface MilestoneCardProps {
  milestone: Milestone;
  progressCount: number;
  totalHabits: number;
  progressPercentage: number;
}

function MilestoneCard({ milestone, progressCount, totalHabits, progressPercentage }: MilestoneCardProps) {
  const [showScience, setShowScience] = useState(false);
  
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        gradient: 'from-blue-50 to-blue-100',
        border: 'border-blue-200',
        text: 'text-blue-600',
        progress: 'bg-blue-600'
      },
      purple: {
        gradient: 'from-purple-50 to-purple-100', 
        border: 'border-purple-200',
        text: 'text-purple-600',
        progress: 'bg-purple-600'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const colors = getColorClasses(milestone.color);

  return (
    <div className={`
      min-w-[280px] w-[80vw] max-w-[320px] 
      bg-gradient-to-br ${colors.gradient} 
      rounded-xl p-4 snap-start border-2 ${colors.border}
      touch-pan-x
    `}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{milestone.icon}</span>
          <div>
            <h4 className="font-semibold text-gray-900">
              {milestone.days}-Day
            </h4>
            <p className="text-sm text-gray-700">{milestone.title}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-xl font-bold ${colors.text}`}>
            {progressCount}/{totalHabits}
          </div>
          <div className="text-xs text-gray-600">habits</div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-white bg-opacity-60 rounded-full h-3 mb-3 overflow-hidden">
        <div 
          className={`${colors.progress} h-3 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
        />
      </div>
      
      {/* Description */}
      <p className="text-xs text-gray-700 mb-3">{milestone.description}</p>
      
      {/* Science Fact Toggle */}
      <button
        onClick={() => setShowScience(!showScience)}
        className="w-full bg-white bg-opacity-70 hover:bg-opacity-90 rounded-lg p-2 text-left transition-all duration-200 min-h-[44px]"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-800">
            🧠 Science Fact
          </span>
          <span className="text-xs text-gray-600">
            {showScience ? '↑' : '↓'}
          </span>
        </div>
        
        {showScience && (
          <p className="text-xs text-gray-700 mt-2 leading-relaxed">
            {milestone.scienceFact}
          </p>
        )}
      </button>
    </div>
  );
}