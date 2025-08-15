/**
 * Mobile-Optimized Analytics Dashboard
 * 
 * Implements progressive disclosure, thumb-friendly interactions, and 
 * research-backed metrics optimized for mobile UX.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { useUserStore } from '../../stores/userStore';
import { AnalyticsData } from '../../utils/analyticsHelpers';

// Mobile-specific components
import { MobileMetricsGrid } from './mobile/MobileMetricsGrid';
import { MobileFormationCarousel } from './mobile/MobileFormationCarousel';
import { MobileHabitAccordion } from './mobile/MobileHabitAccordion';
import { MobileQuickStats } from './mobile/MobileQuickStats';
import { ScienceEducationModal } from './mobile/ScienceEducationModal';
import { MobilePeriodSelector } from './mobile/MobilePeriodSelector';
import { MobileFloatingActions } from './mobile/MobileFloatingActions';

type TimeRange = 'week' | 'month' | '3months' | 'year';

export function MobileAnalyticsView() {
  const [showScienceModal, setShowScienceModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimeRange>('week');
  
  const {
    analyticsData,
    selectedTimeRange,
    isLoading,
    error,
    loadAnalytics,
    setTimeRange
  } = useAnalyticsStore();
  
  const { userProgress, userHabits } = useUserStore();

  // Sync with analytics store
  useEffect(() => {
    if (selectedPeriod !== selectedTimeRange) {
      setTimeRange(selectedPeriod);
    }
  }, [selectedPeriod, selectedTimeRange, setTimeRange]);

  // Load analytics data
  useEffect(() => {
    if (userProgress.length > 0 && userHabits.length > 0) {
      loadAnalytics(userProgress, userHabits);
    }
  }, [userProgress, userHabits, selectedTimeRange, loadAnalytics]);

  if (isLoading) {
    return <MobileLoadingState />;
  }

  if (error) {
    return <MobileErrorState error={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Period Selector */}
      <MobilePeriodSelector 
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />
      
      {/* Main Content */}
      <div className="pb-20"> {/* Bottom padding for floating actions */}
        
        {/* Key Metrics Grid - 2x2 mobile-optimized */}
        {analyticsData && (
          <MobileMetricsGrid analytics={analyticsData} />
        )}
        
        {/* Formation Progress Carousel */}
        <MobileFormationCarousel 
          habits={userHabits}
          progress={userProgress}
        />
        
        {/* Habit Performance Accordion */}
        {analyticsData && (
          <MobileHabitAccordion 
            habits={userHabits}
            progress={userProgress}
            analytics={analyticsData}
          />
        )}
        
        {/* Quick Stats Grid */}
        {analyticsData && (
          <MobileQuickStats analytics={analyticsData} />
        )}
        
      </div>
      
      {/* Science Education Modal */}
      <ScienceEducationModal 
        visible={showScienceModal}
        onClose={() => setShowScienceModal(false)}
      />
      
      {/* Floating Action Button */}
      <MobileFloatingActions 
        onShowScience={() => setShowScienceModal(true)}
      />
    </div>
  );
}

// Mobile Loading State
const MobileLoadingState = () => (
  <div className="min-h-screen bg-gray-50 p-4">
    <div className="animate-pulse space-y-6">
      {/* Period selector skeleton */}
      <div className="h-12 bg-gray-200 rounded-lg"></div>
      
      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
      
      {/* Carousel skeleton */}
      <div className="h-32 bg-gray-200 rounded-lg"></div>
      
      {/* Accordion skeleton */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
);

// Mobile Error State
const MobileErrorState = ({ error }: { error: string }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <Card className="w-full max-w-sm">
      <CardContent className="p-6 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-semibold mb-2">Analytics Unavailable</h3>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Try Again
        </button>
      </CardContent>
    </Card>
  </div>
);