/**
 * User Testing Hook
 * 
 * React hook for integrating the User Data Mock Dataset Testing Environment
 * with the main application components.
 */

import { useState, useEffect, useCallback } from 'react';
import { UserTestingContext, MockUserProfile, BehaviorEvent } from '../types/testing';
import { mockUserDataService } from '../services/testing/MockUserDataService';

export function useUserTesting() {
  const [testingContext, setTestingContext] = useState<UserTestingContext>(
    mockUserDataService.getTestingContext()
  );
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  // Refresh testing context
  const refreshContext = useCallback(() => {
    setTestingContext(mockUserDataService.getTestingContext());
  }, []);

  // Auto-refresh when testing mode is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (testingContext.isTestingMode) {
      interval = setInterval(refreshContext, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testingContext.isTestingMode, refreshContext]);

  // Record behavior event
  const recordEvent = useCallback((action: string, data: any = {}) => {
    mockUserDataService.recordBehaviorEvent(action, data);
    refreshContext();
  }, [refreshContext]);

  // Enable testing mode with a specific user
  const enableTestingMode = useCallback((userId: string) => {
    const success = mockUserDataService.enableTestingMode(userId);
    if (success) {
      refreshContext();
    }
    return success;
  }, [refreshContext]);

  // Disable testing mode
  const disableTestingMode = useCallback(() => {
    mockUserDataService.disableTestingMode();
    refreshContext();
  }, [refreshContext]);

  // Open testing dashboard
  const openTestingDashboard = useCallback(() => {
    setIsDashboardOpen(true);
  }, []);

  // Close testing dashboard
  const closeTestingDashboard = useCallback(() => {
    setIsDashboardOpen(false);
  }, []);

  // Get all available user scenarios
  const getAllScenarios = useCallback(() => {
    return mockUserDataService.getAllScenarios();
  }, []);

  // Get behavior analytics
  const getBehaviorAnalytics = useCallback(() => {
    return mockUserDataService.getBehaviorAnalytics();
  }, []);

  // Export testing data
  const exportTestingData = useCallback(() => {
    return mockUserDataService.exportBehaviorData();
  }, []);

  // Clear testing data
  const clearTestingData = useCallback(() => {
    mockUserDataService.clearTestingData();
    refreshContext();
  }, [refreshContext]);

  return {
    // State
    testingContext,
    isDashboardOpen,
    isTestingMode: testingContext.isTestingMode,
    currentUser: testingContext.currentUser,
    behaviorEvents: testingContext.behaviorEvents,
    insights: testingContext.insights,

    // Actions
    recordEvent,
    enableTestingMode,
    disableTestingMode,
    openTestingDashboard,
    closeTestingDashboard,
    refreshContext,

    // Data access
    getAllScenarios,
    getBehaviorAnalytics,
    exportTestingData,
    clearTestingData
  };
}

/**
 * Hook for tracking component interactions in testing mode
 */
export function useTestingTracker(componentName: string) {
  const { recordEvent, isTestingMode } = useUserTesting();

  const trackInteraction = useCallback((action: string, data: any = {}) => {
    if (isTestingMode) {
      recordEvent(`${componentName}_${action}`, {
        component: componentName,
        ...data
      });
    }
  }, [recordEvent, isTestingMode, componentName]);

  const trackView = useCallback((data: any = {}) => {
    if (isTestingMode) {
      recordEvent(`${componentName}_viewed`, {
        component: componentName,
        ...data
      });
    }
  }, [recordEvent, isTestingMode, componentName]);

  const trackClick = useCallback((element: string, data: any = {}) => {
    if (isTestingMode) {
      recordEvent(`${componentName}_click`, {
        component: componentName,
        element,
        ...data
      });
    }
  }, [recordEvent, isTestingMode, componentName]);

  return {
    trackInteraction,
    trackView,
    trackClick,
    isTestingMode
  };
}