/**
 * Testing Components Export
 * 
 * Central export file for all User Data Mock Dataset Testing Environment components
 */

export { UserTestingDashboard } from './UserTestingDashboard';
export { UserScenarioSelector } from './UserScenarioSelector';
export { UserJourneyVisualization } from './UserJourneyVisualization';
export { AppPreviewWithContext } from './AppPreviewWithContext';

// Re-export services and hooks for convenience
export { mockUserDataService } from '../../services/testing/MockUserDataService';
export { useUserTesting, useTestingTracker } from '../../hooks/useUserTesting';

// Re-export types
export type {
  MockUserProfile,
  UserHabit,
  HabitCompletion,
  BehaviorEvent,
  TestingInsight,
  UserTestingContext,
  UserScenarioComparison
} from '../../types/testing';