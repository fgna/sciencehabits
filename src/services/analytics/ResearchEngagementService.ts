/**
 * Research Engagement Service
 * 
 * Tracks user interactions with research articles to support badge system
 * and analytics. Records when users view research content and tracks engagement patterns.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ResearchEngagementEvent {
  id: string;
  userId: string;
  researchId: string;
  habitId?: string;
  eventType: 'view' | 'open_article' | 'read_summary' | 'view_methodology' | 'share';
  timestamp: string;
  sessionId: string;
  durationMs?: number; // Time spent viewing content
  source: 'habit_card' | 'research_page' | 'modal' | 'recommendation';
}

interface ResearchEngagementStats {
  userId: string;
  totalViews: number;
  uniqueArticlesViewed: number;
  totalTimeSpentMs: number;
  averageViewDurationMs: number;
  articlesViewedToday: number;
  articlesViewedThisWeek: number;
  articlesViewedThisMonth: number;
  engagementScore: number; // Calculated engagement score
  lastViewedAt?: string;
  favoriteResearchCategories: string[];
  mostViewedResearchIds: string[];
}

interface ResearchEngagementDB extends DBSchema {
  'engagement_events': {
    key: string;
    value: ResearchEngagementEvent;
    indexes: {
      'by_user': string;
      'by_research': string;
      'by_timestamp': string;
      'by_user_research': [string, string];
    };
  };
  'engagement_stats': {
    key: string;
    value: ResearchEngagementStats;
  };
}

export class ResearchEngagementService {
  private dbName = 'sciencehabits-research-engagement';
  private version = 1;
  private db: IDBPDatabase<ResearchEngagementDB> | null = null;
  private currentSessionId: string;

  constructor() {
    this.currentSessionId = this.generateSessionId();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.db = await openDB<ResearchEngagementDB>(this.dbName, this.version, {
        upgrade(db) {
          // Engagement events store
          const eventsStore = db.createObjectStore('engagement_events', { keyPath: 'id' });
          eventsStore.createIndex('by_user', 'userId');
          eventsStore.createIndex('by_research', 'researchId');
          eventsStore.createIndex('by_timestamp', 'timestamp');
          eventsStore.createIndex('by_user_research', ['userId', 'researchId']);

          // Engagement stats store
          db.createObjectStore('engagement_stats', { keyPath: 'userId' });
        },
      });
      console.log('✅ Research engagement service initialized');
    } catch (error) {
      console.error('Failed to initialize research engagement service:', error);
    }
  }

  /**
   * Track a research engagement event
   */
  async trackEngagement(
    userId: string,
    researchId: string,
    eventType: ResearchEngagementEvent['eventType'],
    options: {
      habitId?: string;
      durationMs?: number;
      source?: ResearchEngagementEvent['source'];
    } = {}
  ): Promise<void> {
    if (!this.db) {
      console.warn('Research engagement service not initialized');
      return;
    }

    try {
      const event: ResearchEngagementEvent = {
        id: this.generateEventId(),
        userId,
        researchId,
        habitId: options.habitId,
        eventType,
        timestamp: new Date().toISOString(),
        sessionId: this.currentSessionId,
        durationMs: options.durationMs,
        source: options.source || 'habit_card'
      };

      // Store the event
      await this.db.add('engagement_events', event);

      // Update user stats
      await this.updateUserStats(userId);

      console.log('📊 Research engagement tracked:', {
        eventType,
        researchId: researchId.substring(0, 8) + '...',
        source: options.source
      });
    } catch (error) {
      console.error('Failed to track research engagement:', error);
    }
  }

  /**
   * Get user engagement statistics
   */
  async getUserEngagementStats(userId: string): Promise<ResearchEngagementStats | null> {
    if (!this.db) return null;

    try {
      const stats = await this.db.get('engagement_stats', userId);
      return stats || null;
    } catch (error) {
      console.error('Failed to get user engagement stats:', error);
      return null;
    }
  }

  /**
   * Calculate and update user engagement statistics
   */
  private async updateUserStats(userId: string): Promise<void> {
    if (!this.db) return;

    try {
      // Get all user events
      const events = await this.db.getAllFromIndex('engagement_events', 'by_user', userId);
      
      if (events.length === 0) return;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate statistics
      const uniqueArticles = new Set(events.map(e => e.researchId));
      const totalDuration = events.reduce((sum, e) => sum + (e.durationMs || 0), 0);
      const viewEvents = events.filter(e => e.eventType === 'view' || e.eventType === 'open_article');

      const todayEvents = events.filter(e => new Date(e.timestamp) >= todayStart);
      const weekEvents = events.filter(e => new Date(e.timestamp) >= weekStart);
      const monthEvents = events.filter(e => new Date(e.timestamp) >= monthStart);

      // Calculate engagement score (weighted by different actions)
      const engagementScore = this.calculateEngagementScore(events);

      // Find favorite categories and most viewed articles
      const researchCounts = new Map<string, number>();
      events.forEach(e => {
        researchCounts.set(e.researchId, (researchCounts.get(e.researchId) || 0) + 1);
      });

      const mostViewedResearchIds = Array.from(researchCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

      const stats: ResearchEngagementStats = {
        userId,
        totalViews: events.length,
        uniqueArticlesViewed: uniqueArticles.size,
        totalTimeSpentMs: totalDuration,
        averageViewDurationMs: viewEvents.length > 0 ? totalDuration / viewEvents.length : 0,
        articlesViewedToday: new Set(todayEvents.map(e => e.researchId)).size,
        articlesViewedThisWeek: new Set(weekEvents.map(e => e.researchId)).size,
        articlesViewedThisMonth: new Set(monthEvents.map(e => e.researchId)).size,
        engagementScore,
        lastViewedAt: events[events.length - 1]?.timestamp,
        favoriteResearchCategories: [], // Would need research category mapping
        mostViewedResearchIds
      };

      // Store updated stats
      await this.db.put('engagement_stats', stats);
    } catch (error) {
      console.error('Failed to update user engagement stats:', error);
    }
  }

  /**
   * Calculate engagement score based on user actions
   */
  private calculateEngagementScore(events: ResearchEngagementEvent[]): number {
    const weights = {
      'view': 1,
      'open_article': 3,
      'read_summary': 2,
      'view_methodology': 4,
      'share': 5
    };

    const score = events.reduce((total, event) => {
      const weight = weights[event.eventType] || 1;
      const durationBonus = event.durationMs ? Math.min(event.durationMs / 10000, 3) : 0; // Max 3 points for duration
      return total + weight + durationBonus;
    }, 0);

    return Math.round(score);
  }

  /**
   * Get research engagement data for badge calculations
   */
  async getEngagementForBadges(userId: string): Promise<{
    uniqueArticlesViewed: number;
    totalViews: number;
    engagementScore: number;
    articlesViewedThisWeek: number;
  }> {
    const stats = await this.getUserEngagementStats(userId);
    
    if (!stats) {
      return {
        uniqueArticlesViewed: 0,
        totalViews: 0,
        engagementScore: 0,
        articlesViewedThisWeek: 0
      };
    }

    return {
      uniqueArticlesViewed: stats.uniqueArticlesViewed,
      totalViews: stats.totalViews,
      engagementScore: stats.engagementScore,
      articlesViewedThisWeek: stats.articlesViewedThisWeek
    };
  }

  /**
   * Helper method to track research article opening from habit cards
   */
  async trackResearchView(userId: string, researchId: string, habitId?: string): Promise<void> {
    await this.trackEngagement(userId, researchId, 'view', {
      habitId,
      source: habitId ? 'habit_card' : 'research_page'
    });
  }

  /**
   * Helper method to track full article opening
   */
  async trackArticleOpen(userId: string, researchId: string, habitId?: string): Promise<void> {
    await this.trackEngagement(userId, researchId, 'open_article', {
      habitId,
      source: 'modal'
    });
  }

  /**
   * Helper method to track time spent reading
   */
  async trackReadingTime(userId: string, researchId: string, durationMs: number): Promise<void> {
    await this.trackEngagement(userId, researchId, 'read_summary', {
      durationMs,
      source: 'modal'
    });
  }

  /**
   * Get engagement analytics for admin dashboard
   */
  async getEngagementAnalytics(): Promise<{
    totalUsers: number;
    totalViews: number;
    averageEngagementScore: number;
    mostViewedArticles: Array<{ researchId: string; views: number }>;
  }> {
    if (!this.db) {
      return { totalUsers: 0, totalViews: 0, averageEngagementScore: 0, mostViewedArticles: [] };
    }

    try {
      const allStats = await this.db.getAll('engagement_stats');
      const allEvents = await this.db.getAll('engagement_events');

      const researchCounts = new Map<string, number>();
      allEvents.forEach(event => {
        researchCounts.set(event.researchId, (researchCounts.get(event.researchId) || 0) + 1);
      });

      const mostViewedArticles = Array.from(researchCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([researchId, views]) => ({ researchId, views }));

      return {
        totalUsers: allStats.length,
        totalViews: allEvents.length,
        averageEngagementScore: allStats.length > 0 
          ? allStats.reduce((sum, stat) => sum + stat.engagementScore, 0) / allStats.length 
          : 0,
        mostViewedArticles
      };
    } catch (error) {
      console.error('Failed to get engagement analytics:', error);
      return { totalUsers: 0, totalViews: 0, averageEngagementScore: 0, mostViewedArticles: [] };
    }
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }

  private generateEventId(): string {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }
}

// Export singleton instance
export const researchEngagementService = new ResearchEngagementService();