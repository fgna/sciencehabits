/**
 * Content API Client Service
 * 
 * Manages communication with the GitHub Pages Content API for the admin dashboard.
 * Provides CRUD operations for habits, research, and locales with proper authentication
 * and error handling for content management workflows.
 */

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    version: string;
    timestamp: string;
    source: string;
  };
}

export interface ContentAPIHealth {
  status: 'healthy' | 'degraded' | 'offline';
  version: string;
  uptime: number;
  lastUpdate: string;
  endpoints: {
    [key: string]: {
      status: 'active' | 'maintenance' | 'error';
      responseTime?: number;
    };
  };
}

export interface HabitData {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeMinutes: number;
  language: string;
  researchBacked?: boolean;
  sources?: string[];
  goalTags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ResearchData {
  id: string;
  title: string;
  summary: string;
  authors: string;
  year: number;
  journal: string;
  doi?: string;
  category: string;
  evidenceLevel: 'systematic_review' | 'rct' | 'observational' | 'case_study';
  qualityScore: number;
  language: string;
  relatedHabits?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LocaleData {
  [key: string]: string;
}

export interface ContentStats {
  summary: {
    totalHabits: number;
    totalResearch: number;
    totalLocaleKeys: number;
    lastUpdated: string;
  };
  byLanguage: {
    [language: string]: {
      habits: number;
      research: number;
      localeKeys: number;
      completeness: number;
    };
  };
  systemHealth: {
    apiStatus: 'healthy' | 'degraded' | 'offline';
    lastSync: string;
    errorRate: number;
    averageResponseTime: number;
  };
}

export class ContentAPIClient {
  private baseUrl: string;
  private apiKey: string;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;
  private timeout: number = 10000;
  
  // Cache for API health status
  private healthCache: {
    data: ContentAPIHealth | null;
    timestamp: number;
    ttl: number;
  } = {
    data: null,
    timestamp: 0,
    ttl: 30000 // 30 seconds
  };

  constructor(
    baseUrl?: string,
    apiKey?: string
  ) {
    this.baseUrl = baseUrl || process.env.REACT_APP_CONTENT_API_URL || '';
    this.apiKey = apiKey || process.env.REACT_APP_ADMIN_API_KEY || '';
    
    if (!this.baseUrl) {
      console.warn('ContentAPIClient: No API URL configured, using mock mode');
    }
    
    if (!this.apiKey) {
      console.warn('ContentAPIClient: No API key configured, using mock mode');
    }
  }

  /**
   * Check API health and connectivity
   */
  async checkHealth(): Promise<ContentAPIHealth> {
    // Check cache first
    const now = Date.now();
    if (this.healthCache.data && (now - this.healthCache.timestamp) < this.healthCache.ttl) {
      return this.healthCache.data;
    }

    try {
      if (!this.baseUrl || !this.apiKey) {
        return this.getMockHealth();
      }

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/?endpoint=health`,
        { timeout: 5000 } // Shorter timeout for health checks
      );

      const health: ContentAPIHealth = {
        status: response.status === 'healthy' ? 'healthy' : 'degraded',
        version: response.version || '2.0.0',
        uptime: response.uptime || 0,
        lastUpdate: response.lastUpdate || new Date().toISOString(),
        endpoints: response.endpoints || {
          habits: { status: 'active' },
          research: { status: 'active' },
          locales: { status: 'active' },
          admin: { status: 'active' }
        }
      };

      // Cache the result
      this.healthCache = {
        data: health,
        timestamp: now,
        ttl: health.status === 'healthy' ? 30000 : 5000 // Shorter cache for degraded status
      };

      return health;

    } catch (error) {
      console.warn('ContentAPIClient: Health check failed, using fallback', error);
      
      const fallbackHealth: ContentAPIHealth = {
        status: 'offline',
        version: '2.0.0',
        uptime: 0,
        lastUpdate: new Date().toISOString(),
        endpoints: {
          habits: { status: 'error' },
          research: { status: 'error' },
          locales: { status: 'error' },
          admin: { status: 'error' }
        }
      };

      this.healthCache = {
        data: fallbackHealth,
        timestamp: now,
        ttl: 5000 // Short cache for offline status
      };

      return fallbackHealth;
    }
  }

  /**
   * Get all habits for a specific language
   */
  async getHabits(language: string = 'en'): Promise<APIResponse<HabitData[]>> {
    try {
      if (!this.baseUrl || !this.apiKey) {
        return this.getMockHabits(language);
      }

      const data = await this.fetchWithRetry(
        `${this.baseUrl}/?endpoint=habits&lang=${language}&key=${this.apiKey}`
      );

      return {
        success: true,
        data: data.data || [],
        metadata: {
          version: data.version || '2.0.0',
          timestamp: new Date().toISOString(),
          source: 'github-pages-api'
        }
      };

    } catch (error) {
      console.error('ContentAPIClient: Failed to fetch habits', error);
      return {
        success: false,
        error: `Failed to fetch habits: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: []
      };
    }
  }

  /**
   * Get all research articles for a specific language
   */
  async getResearch(language: string = 'en'): Promise<APIResponse<ResearchData[]>> {
    try {
      if (!this.baseUrl || !this.apiKey) {
        return this.getMockResearch(language);
      }

      const data = await this.fetchWithRetry(
        `${this.baseUrl}/?endpoint=research&lang=${language}&key=${this.apiKey}`
      );

      return {
        success: true,
        data: data.data || [],
        metadata: {
          version: data.version || '2.0.0',
          timestamp: new Date().toISOString(),
          source: 'github-pages-api'
        }
      };

    } catch (error) {
      console.error('ContentAPIClient: Failed to fetch research', error);
      return {
        success: false,
        error: `Failed to fetch research: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: []
      };
    }
  }

  /**
   * Get all locale translations for a specific language
   */
  async getLocales(language: string = 'en'): Promise<APIResponse<LocaleData>> {
    try {
      if (!this.baseUrl || !this.apiKey) {
        return this.getMockLocales(language);
      }

      const data = await this.fetchWithRetry(
        `${this.baseUrl}/?endpoint=locales&lang=${language}&key=${this.apiKey}`
      );

      return {
        success: true,
        data: data.data || {},
        metadata: {
          version: data.version || '2.0.0',
          timestamp: new Date().toISOString(),
          source: 'github-pages-api'
        }
      };

    } catch (error) {
      console.error('ContentAPIClient: Failed to fetch locales', error);
      return {
        success: false,
        error: `Failed to fetch locales: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: {}
      };
    }
  }

  /**
   * Get all content for a specific language (habits + research + locales)
   */
  async getAllContent(language: string = 'en'): Promise<APIResponse<{
    habits: HabitData[];
    research: ResearchData[];
    locales: LocaleData;
  }>> {
    try {
      if (!this.baseUrl || !this.apiKey) {
        return this.getMockAllContent(language);
      }

      const data = await this.fetchWithRetry(
        `${this.baseUrl}/?endpoint=all&lang=${language}&key=${this.apiKey}`
      );

      return {
        success: true,
        data: {
          habits: data.data?.habits || [],
          research: data.data?.research || [],
          locales: data.data?.locales || {}
        },
        metadata: {
          version: data.version || '2.0.0',
          timestamp: new Date().toISOString(),
          source: 'github-pages-api'
        }
      };

    } catch (error) {
      console.error('ContentAPIClient: Failed to fetch all content', error);
      return {
        success: false,
        error: `Failed to fetch all content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: {
          habits: [],
          research: [],
          locales: {}
        }
      };
    }
  }

  /**
   * Get content statistics and metrics
   */
  async getContentStats(): Promise<APIResponse<ContentStats>> {
    try {
      if (!this.baseUrl || !this.apiKey) {
        return this.getMockContentStats();
      }

      const data = await this.fetchWithRetry(
        `${this.baseUrl}/?endpoint=admin-stats&key=${this.apiKey}`
      );

      return {
        success: true,
        data: data.data,
        metadata: {
          version: data.version || '2.0.0',
          timestamp: new Date().toISOString(),
          source: 'github-pages-api'
        }
      };

    } catch (error) {
      console.error('ContentAPIClient: Failed to fetch content stats', error);
      
      // Generate stats from individual endpoints as fallback
      return this.generateFallbackStats();
    }
  }

  /**
   * Validate content structure and quality
   */
  async validateContent(language?: string): Promise<APIResponse<{
    valid: boolean;
    errors: Array<{ type: string; message: string; item?: string }>;
    warnings: Array<{ type: string; message: string; item?: string }>;
    stats: {
      totalHabits: number;
      totalResearch: number;
      totalLocaleKeys: number;
      crossReferences: number;
      qualityScore: number;
    };
  }>> {
    try {
      if (!this.baseUrl || !this.apiKey) {
        return this.getMockValidation();
      }

      const url = language 
        ? `${this.baseUrl}/?endpoint=validate&lang=${language}&key=${this.apiKey}`
        : `${this.baseUrl}/?endpoint=validate&key=${this.apiKey}`;

      const data = await this.fetchWithRetry(url);

      return {
        success: true,
        data: data.data,
        metadata: {
          version: data.version || '2.0.0',
          timestamp: new Date().toISOString(),
          source: 'github-pages-api'
        }
      };

    } catch (error) {
      console.error('ContentAPIClient: Failed to validate content', error);
      return {
        success: false,
        error: `Content validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: {
          valid: false,
          errors: [{ type: 'api_error', message: 'Unable to connect to validation service' }],
          warnings: [],
          stats: {
            totalHabits: 0,
            totalResearch: 0,
            totalLocaleKeys: 0,
            crossReferences: 0,
            qualityScore: 0
          }
        }
      };
    }
  }

  /**
   * Test API connectivity with retry logic
   */
  async testConnection(): Promise<{ connected: boolean; responseTime: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const health = await this.checkHealth();
      const responseTime = Date.now() - startTime;
      
      return {
        connected: health.status !== 'offline',
        responseTime,
        error: health.status === 'offline' ? 'API is offline' : undefined
      };

    } catch (error) {
      return {
        connected: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  // Private helper methods

  private async fetchWithRetry(url: string): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.fetchWithTimeout(url);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
          console.warn(`ContentAPIClient: Retry ${attempt}/${this.retryAttempts} for ${url}`);
        }
      }
    }

    throw lastError;
  }

  private async fetchWithTimeout(url: string, options: { timeout?: number } = {}): Promise<any> {
    const timeout = options.timeout || this.timeout;
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      // Use fetch for browser environments
      if (typeof fetch !== 'undefined') {
        fetch(url)
          .then(response => {
            clearTimeout(timer);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.text();
          })
          .then(html => {
            // Parse GitHub Pages API response (JSON in <pre> tags)
            const jsonMatch = html.match(/<pre>(.*?)<\/pre>/s);
            if (jsonMatch) {
              const content = JSON.parse(jsonMatch[1]);
              if (content.error) {
                throw new Error(content.message || 'API returned error');
              }
              resolve(content);
            } else {
              throw new Error('Invalid API response format');
            }
          })
          .catch(error => {
            clearTimeout(timer);
            reject(error);
          });
      } else {
        // Fallback for Node.js environments (testing)
        reject(new Error('Fetch not available in this environment'));
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock data methods for development/testing

  private getMockHealth(): ContentAPIHealth {
    return {
      status: 'healthy',
      version: '2.0.0-mock',
      uptime: 86400,
      lastUpdate: new Date().toISOString(),
      endpoints: {
        habits: { status: 'active', responseTime: 120 },
        research: { status: 'active', responseTime: 150 },
        locales: { status: 'active', responseTime: 80 },
        admin: { status: 'active', responseTime: 200 }
      }
    };
  }

  private getMockHabits(language: string): APIResponse<HabitData[]> {
    const mockHabits: HabitData[] = [
      {
        id: `mock-habit-1-${language}`,
        title: language === 'de' ? 'Morgendliche Meditation' : 'Morning Meditation',
        description: language === 'de' 
          ? 'Eine tägliche 10-minütige Meditationspraxis am Morgen für mehr Klarheit und Ruhe.'
          : 'A daily 10-minute morning meditation practice for clarity and calm.',
        category: 'mindfulness',
        difficulty: 'beginner',
        timeMinutes: 10,
        language,
        researchBacked: true,
        sources: ['meditation-benefits-2023'],
        goalTags: ['reduce_stress', 'improve_focus']
      },
      {
        id: `mock-habit-2-${language}`,
        title: language === 'de' ? 'Morgenspaziergang' : 'Morning Walk',
        description: language === 'de'
          ? 'Ein 20-minütiger Spaziergang im Freien für körperliche und geistige Gesundheit.'
          : 'A 20-minute outdoor walk for physical and mental health.',
        category: 'exercise',
        difficulty: 'beginner',
        timeMinutes: 20,
        language,
        researchBacked: true,
        sources: ['walking-benefits-2023'],
        goalTags: ['improve_fitness', 'boost_energy']
      }
    ];

    return {
      success: true,
      data: mockHabits,
      metadata: {
        version: '2.0.0-mock',
        timestamp: new Date().toISOString(),
        source: 'mock-data'
      }
    };
  }

  private getMockResearch(language: string): APIResponse<ResearchData[]> {
    const mockResearch: ResearchData[] = [
      {
        id: 'meditation-benefits-2023',
        title: language === 'de' 
          ? 'Auswirkungen der Meditation auf Stress und kognitive Leistung'
          : 'Effects of Meditation on Stress and Cognitive Performance',
        summary: language === 'de'
          ? 'Eine systematische Übersicht über 45 Studien zeigt signifikante Verbesserungen bei Stress und Aufmerksamkeit durch regelmäßige Meditation.'
          : 'A systematic review of 45 studies showing significant improvements in stress and attention through regular meditation practice.',
        authors: 'Johnson, M.K., Smith, R.A., Chen, L.',
        year: 2023,
        journal: 'Psychological Science',
        doi: '10.1177/meditation2023',
        category: 'mindfulness',
        evidenceLevel: 'systematic_review',
        qualityScore: 92,
        language,
        relatedHabits: [`mock-habit-1-${language}`]
      },
      {
        id: 'walking-benefits-2023',
        title: language === 'de'
          ? 'Gesundheitliche Vorteile des täglichen Gehens'
          : 'Health Benefits of Daily Walking',
        summary: language === 'de'
          ? 'Forschung zeigt, dass bereits 20 Minuten tägliches Gehen das Risiko für Herz-Kreislauf-Erkrankungen um 30% reduziert.'
          : 'Research demonstrates that just 20 minutes of daily walking reduces cardiovascular disease risk by 30%.',
        authors: 'Williams, A.B., Rodriguez, C.M.',
        year: 2023,
        journal: 'Exercise Medicine',
        doi: '10.1016/walking2023',
        category: 'exercise',
        evidenceLevel: 'rct',
        qualityScore: 88,
        language,
        relatedHabits: [`mock-habit-2-${language}`]
      }
    ];

    return {
      success: true,
      data: mockResearch,
      metadata: {
        version: '2.0.0-mock',
        timestamp: new Date().toISOString(),
        source: 'mock-data'
      }
    };
  }

  private getMockLocales(language: string): APIResponse<LocaleData> {
    const mockLocales: LocaleData = {
      'navigation.dashboard': language === 'de' ? 'Übersicht' : 'Dashboard',
      'navigation.habits': language === 'de' ? 'Meine Gewohnheiten' : 'My Habits',
      'navigation.research': language === 'de' ? 'Forschung' : 'Research',
      'common.loading': language === 'de' ? 'Laden...' : 'Loading...',
      'common.error': language === 'de' ? 'Fehler' : 'Error',
      'common.save': language === 'de' ? 'Speichern' : 'Save',
      'common.cancel': language === 'de' ? 'Abbrechen' : 'Cancel'
    };

    return {
      success: true,
      data: mockLocales,
      metadata: {
        version: '2.0.0-mock',
        timestamp: new Date().toISOString(),
        source: 'mock-data'
      }
    };
  }

  private getMockAllContent(language: string): APIResponse<{
    habits: HabitData[];
    research: ResearchData[];
    locales: LocaleData;
  }> {
    const habits = this.getMockHabits(language).data || [];
    const research = this.getMockResearch(language).data || [];
    const locales = this.getMockLocales(language).data || {};

    return {
      success: true,
      data: {
        habits,
        research,
        locales
      },
      metadata: {
        version: '2.0.0-mock',
        timestamp: new Date().toISOString(),
        source: 'mock-data'
      }
    };
  }

  private getMockContentStats(): APIResponse<ContentStats> {
    const mockStats: ContentStats = {
      summary: {
        totalHabits: 47,
        totalResearch: 23,
        totalLocaleKeys: 156,
        lastUpdated: new Date().toISOString()
      },
      byLanguage: {
        en: { habits: 47, research: 23, localeKeys: 156, completeness: 100 },
        de: { habits: 42, research: 18, localeKeys: 134, completeness: 87 },
        fr: { habits: 38, research: 15, localeKeys: 120, completeness: 78 },
        es: { habits: 35, research: 12, localeKeys: 108, completeness: 72 }
      },
      systemHealth: {
        apiStatus: 'healthy',
        lastSync: new Date().toISOString(),
        errorRate: 0.02,
        averageResponseTime: 145
      }
    };

    return {
      success: true,
      data: mockStats,
      metadata: {
        version: '2.0.0-mock',
        timestamp: new Date().toISOString(),
        source: 'mock-data'
      }
    };
  }

  private getMockValidation(): APIResponse<any> {
    return {
      success: true,
      data: {
        valid: true,
        errors: [],
        warnings: [
          { type: 'translation', message: 'Missing German translation for habit: advanced-habit-3', item: 'advanced-habit-3' },
          { type: 'reference', message: 'Research reference not found: old-study-2019', item: 'habit-with-old-ref' }
        ],
        stats: {
          totalHabits: 47,
          totalResearch: 23,
          totalLocaleKeys: 156,
          crossReferences: 89,
          qualityScore: 94
        }
      },
      metadata: {
        version: '2.0.0-mock',
        timestamp: new Date().toISOString(),
        source: 'mock-data'
      }
    };
  }

  private async generateFallbackStats(): Promise<APIResponse<ContentStats>> {
    try {
      // Attempt to fetch individual language data to build stats
      const languages = ['en', 'de', 'fr', 'es'];
      const stats: ContentStats = {
        summary: {
          totalHabits: 0,
          totalResearch: 0,
          totalLocaleKeys: 0,
          lastUpdated: new Date().toISOString()
        },
        byLanguage: {},
        systemHealth: {
          apiStatus: 'degraded',
          lastSync: new Date().toISOString(),
          errorRate: 0.1,
          averageResponseTime: 300
        }
      };

      for (const language of languages) {
        try {
          const [habitsResult, researchResult, localesResult] = await Promise.all([
            this.getHabits(language),
            this.getResearch(language),
            this.getLocales(language)
          ]);

          const habitCount = habitsResult.data?.length || 0;
          const researchCount = researchResult.data?.length || 0;
          const localeCount = localesResult.data ? Object.keys(localesResult.data).length : 0;

          stats.byLanguage[language] = {
            habits: habitCount,
            research: researchCount,
            localeKeys: localeCount,
            completeness: language === 'en' ? 100 : Math.round((habitCount / Math.max(stats.summary.totalHabits, 1)) * 100)
          };

          if (language === 'en') {
            stats.summary.totalHabits = habitCount;
            stats.summary.totalResearch = researchCount;
            stats.summary.totalLocaleKeys = localeCount;
          }

        } catch (error) {
          console.warn(`Failed to fetch stats for ${language}:`, error);
          stats.byLanguage[language] = {
            habits: 0,
            research: 0,
            localeKeys: 0,
            completeness: 0
          };
        }
      }

      return {
        success: true,
        data: stats,
        metadata: {
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          source: 'fallback-aggregation'
        }
      };

    } catch (error) {
      console.error('Failed to generate fallback stats:', error);
      return this.getMockContentStats();
    }
  }
}