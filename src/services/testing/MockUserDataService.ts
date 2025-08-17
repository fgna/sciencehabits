/**
 * Mock User Data Service
 * 
 * Service for managing mock user profiles, behavioral tracking,
 * and testing analytics for the User Data Mock Dataset Testing Environment.
 */

import { MockUserProfile, BehaviorEvent, TestingInsight, UserTestingContext } from '../../types/testing';
import { 
  ALL_USER_SCENARIOS, 
  getAllUserScenarios, 
  getUserScenarioById 
} from '../../data/userScenarios';

class MockUserDataService {
  private currentUser: MockUserProfile | null = null;
  private behaviorEvents: BehaviorEvent[] = [];
  private insights: TestingInsight[] = [];
  private isTestingMode: boolean = false;
  private sessionStartTime: number = 0;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Enable testing mode with a specific user
   */
  public enableTestingMode(userId: string): boolean {
    const user = getUserScenarioById(userId);
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return false;
    }

    this.currentUser = user;
    this.isTestingMode = true;
    this.sessionStartTime = Date.now();
    this.behaviorEvents = [];
    this.insights = [];

    this.generateInitialInsights();
    this.saveToStorage();

    console.log(`🧪 Testing mode enabled for user: ${user.name} (${user.scenario})`);
    return true;
  }

  /**
   * Disable testing mode and return to normal app state
   */
  public disableTestingMode(): void {
    if (this.isTestingMode && this.currentUser) {
      this.recordBehaviorEvent('testing_session_end', {
        sessionDuration: Date.now() - this.sessionStartTime,
        totalEvents: this.behaviorEvents.length,
        userScenario: this.currentUser.scenario
      });
    }

    this.isTestingMode = false;
    this.currentUser = null;
    this.saveToStorage();

    console.log('🧪 Testing mode disabled');
  }

  /**
   * Get current testing context
   */
  public getTestingContext(): UserTestingContext {
    return {
      currentUser: this.currentUser,
      isTestingMode: this.isTestingMode,
      behaviorEvents: [...this.behaviorEvents],
      insights: [...this.insights]
    };
  }

  /**
   * Record a behavior event
   */
  public recordBehaviorEvent(action: string, data: any = {}): void {
    if (!this.isTestingMode || !this.currentUser) return;

    const event: BehaviorEvent = {
      userId: this.currentUser.id,
      action,
      data: {
        ...data,
        sessionTime: Date.now() - this.sessionStartTime,
        userScenario: this.currentUser.scenario,
        engagementLevel: this.currentUser.behavior.engagementLevel
      },
      timestamp: Date.now()
    };

    this.behaviorEvents.push(event);
    this.analyzeEventForInsights(event);
    this.saveToStorage();

    console.log('📊 Behavior event recorded:', action, data);
  }

  /**
   * Get all available user scenarios
   */
  public getAllScenarios(): Record<string, MockUserProfile[]> {
    return ALL_USER_SCENARIOS;
  }

  /**
   * Get all users as flat array
   */
  public getAllUsers(): MockUserProfile[] {
    return getAllUserScenarios();
  }

  /**
   * Get user by ID
   */
  public getUserById(id: string): MockUserProfile | undefined {
    return getUserScenarioById(id);
  }

  /**
   * Get behavior analytics for current user
   */
  public getBehaviorAnalytics(): {
    totalEvents: number;
    sessionDuration: number;
    engagementScore: number;
    topActions: Array<{ action: string; count: number }>;
    timeDistribution: Array<{ period: string; events: number }>;
  } {
    if (!this.isTestingMode || this.behaviorEvents.length === 0) {
      return {
        totalEvents: 0,
        sessionDuration: 0,
        engagementScore: 0,
        topActions: [],
        timeDistribution: []
      };
    }

    // Calculate top actions
    const actionCounts: Record<string, number> = {};
    this.behaviorEvents.forEach(event => {
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
    });

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate engagement score (0-100)
    const sessionDuration = Date.now() - this.sessionStartTime;
    const eventsPerMinute = this.behaviorEvents.length / (sessionDuration / (1000 * 60));
    const engagementScore = Math.min(100, Math.round(eventsPerMinute * 10));

    // Time distribution (last hour in 10-minute chunks)
    const timeDistribution = this.calculateTimeDistribution();

    return {
      totalEvents: this.behaviorEvents.length,
      sessionDuration,
      engagementScore,
      topActions,
      timeDistribution
    };
  }

  /**
   * Generate testing insights based on user behavior
   */
  private generateInitialInsights(): void {
    if (!this.currentUser) return;

    const user = this.currentUser;
    
    // Scenario-specific insights
    switch (user.scenario) {
      case 'new_user':
        this.addInsight('neutral', 'New user scenario loaded - expect exploration and learning behavior', 'behavioral');
        if (user.onboarding.skippedSteps.length > 0) {
          this.addInsight('warning', `User skipped onboarding steps: ${user.onboarding.skippedSteps.join(', ')}`, 'engagement');
        }
        break;

      case 'struggling_user':
        this.addInsight('warning', 'Struggling user pattern - watch for inconsistent engagement', 'behavioral');
        if (user.behavior.strugglingAreas.length > 0) {
          this.addInsight('warning', `Known struggling areas: ${user.behavior.strugglingAreas.join(', ')}`, 'behavioral');
        }
        break;

      case 'power_user':
        this.addInsight('positive', 'Power user loaded - expect advanced feature usage and high engagement', 'engagement');
        this.addInsight('neutral', 'Monitor for potential feature requests or optimization opportunities', 'behavioral');
        break;

      case 'returning_user':
        this.addInsight('neutral', 'Returning user scenario - may show re-engagement patterns', 'behavioral');
        break;

      case 'consistent_user':
        this.addInsight('positive', 'Consistent user pattern - stable, predictable behavior expected', 'behavioral');
        break;
    }

    // Engagement level insights
    if (user.behavior.engagementLevel === 'low') {
      this.addInsight('warning', 'Low engagement level - may have shorter sessions and fewer interactions', 'engagement');
    } else if (user.behavior.engagementLevel === 'high') {
      this.addInsight('positive', 'High engagement level - expect longer sessions and frequent interactions', 'engagement');
    }

    // Completion rate insights
    if (user.analytics.completionRate < 50) {
      this.addInsight('warning', `Low completion rate (${user.analytics.completionRate}%) - may indicate motivation issues`, 'completion');
    } else if (user.analytics.completionRate > 80) {
      this.addInsight('positive', `High completion rate (${user.analytics.completionRate}%) - strong habit adherence`, 'completion');
    }
  }

  /**
   * Analyze behavior event and generate insights
   */
  private analyzeEventForInsights(event: BehaviorEvent): void {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const eventsInSession = this.behaviorEvents.length;

    // Session duration insights
    if (sessionDuration > 5 * 60 * 1000 && eventsInSession < 5) {
      this.addInsight('warning', 'Long session with few interactions - possible usability issue', 'engagement');
    }

    // Rapid interaction insights
    if (eventsInSession > 10 && sessionDuration < 2 * 60 * 1000) {
      this.addInsight('positive', 'High interaction rate - strong user engagement', 'engagement');
    }

    // Action-specific insights
    switch (event.action) {
      case 'habit_interaction':
        if (event.data.action === 'complete') {
          this.addInsight('positive', 'Habit completion recorded - positive engagement signal', 'completion');
        } else if (event.data.action === 'skip') {
          this.addInsight('neutral', 'Habit skipped - monitor for patterns', 'completion');
        }
        break;

      case 'view_change':
        if (event.data.to === 'analytics') {
          this.addInsight('positive', 'User viewing analytics - shows interest in progress tracking', 'engagement');
        }
        break;
    }

    // Remove old insights to keep list manageable
    if (this.insights.length > 20) {
      this.insights = this.insights.slice(-15);
    }
  }

  /**
   * Add a testing insight
   */
  private addInsight(type: TestingInsight['type'], message: string, category: TestingInsight['category']): void {
    const insight: TestingInsight = {
      type,
      message,
      timestamp: new Date().toISOString(),
      category
    };

    this.insights.push(insight);
  }

  /**
   * Calculate time distribution of events
   */
  private calculateTimeDistribution(): Array<{ period: string; events: number }> {
    const now = Date.now();
    const distribution: Array<{ period: string; events: number }> = [];

    // Create 10-minute buckets for the last hour
    for (let i = 0; i < 6; i++) {
      const periodStart = now - ((i + 1) * 10 * 60 * 1000);
      const periodEnd = now - (i * 10 * 60 * 1000);
      
      const eventsInPeriod = this.behaviorEvents.filter(event => {
        const eventTime = new Date(event.timestamp).getTime();
        return eventTime >= periodStart && eventTime < periodEnd;
      }).length;

      distribution.unshift({
        period: `${i * 10}min ago`,
        events: eventsInPeriod
      });
    }

    return distribution;
  }

  /**
   * Export behavior data for analysis
   */
  public exportBehaviorData(): {
    user: MockUserProfile | null;
    events: BehaviorEvent[];
    insights: TestingInsight[];
    analytics: ReturnType<MockUserDataService['getBehaviorAnalytics']>;
    exportTime: string;
  } {
    return {
      user: this.currentUser,
      events: [...this.behaviorEvents],
      insights: [...this.insights],
      analytics: this.getBehaviorAnalytics(),
      exportTime: new Date().toISOString()
    };
  }

  /**
   * Clear all testing data
   */
  public clearTestingData(): void {
    this.behaviorEvents = [];
    this.insights = [];
    this.saveToStorage();
    console.log('🧹 Testing data cleared');
  }

  /**
   * Save testing state to localStorage
   */
  private saveToStorage(): void {
    try {
      const state = {
        currentUser: this.currentUser,
        isTestingMode: this.isTestingMode,
        behaviorEvents: this.behaviorEvents,
        insights: this.insights,
        sessionStartTime: this.sessionStartTime
      };
      
      localStorage.setItem('sciencehabits_testing_state', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save testing state to localStorage:', error);
    }
  }

  /**
   * Load testing state from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('sciencehabits_testing_state');
      if (stored) {
        const state = JSON.parse(stored);
        this.currentUser = state.currentUser;
        this.isTestingMode = state.isTestingMode || false;
        this.behaviorEvents = state.behaviorEvents || [];
        this.insights = state.insights || [];
        this.sessionStartTime = state.sessionStartTime || Date.now();
      }
    } catch (error) {
      console.warn('Failed to load testing state from localStorage:', error);
    }
  }
}

// Export singleton instance
export const mockUserDataService = new MockUserDataService();