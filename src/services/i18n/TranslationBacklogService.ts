/**
 * Translation Backlog Service
 * 
 * Manages the queue of content items that need translation to German.
 * Analyzes existing content and tracks translation status.
 */

import { ResearchArticle } from '../../types';
// import { NodeAutoContentLoader } from '../../../scripts/auto-content-loader';

export interface BacklogItem {
  id: string;
  type: 'habit' | 'research' | 'article';
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedWords: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  hasGermanVersion: boolean;
  englishContent?: {
    title: string;
    summary?: string;
    content?: string;
    lastModified: string;
  };
  germanContent?: {
    title: string;
    summary?: string;
    content?: string;
    lastModified: string;
    translator?: string;
    reviewStatus: 'pending' | 'reviewed' | 'approved';
  };
  tags: string[];
  researchQuality?: 'high' | 'medium' | 'low';
  addedToBacklog: string; // ISO date
  targetCompletionDate?: string;
  notes?: string;
}

export interface BacklogFilters {
  type?: BacklogItem['type'];
  priority?: BacklogItem['priority'];
  complexity?: BacklogItem['complexity'];
  hasGermanVersion?: boolean;
  category?: string;
  sortBy?: 'priority' | 'dateAdded' | 'complexity' | 'estimatedWords' | 'title';
  sortDirection?: 'asc' | 'desc';
}

export interface BacklogStats {
  total: number;
  byType: Record<BacklogItem['type'], number>;
  byPriority: Record<BacklogItem['priority'], number>;
  byComplexity: Record<BacklogItem['complexity'], number>;
  totalEstimatedWords: number;
  averageComplexity: string;
  completedTranslations: number;
  pendingTranslations: number;
}

export class TranslationBacklogService {
  private backlogItems: BacklogItem[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await this.loadBacklogFromContent();
    this.initialized = true;
  }

  /**
   * Load and analyze existing content to build backlog
   */
  private async loadBacklogFromContent(): Promise<void> {
    try {
      // In browser environment, we'll load from the existing data
      const response = await fetch('/data/research.json');
      const researchData = await response.json();
      const research: ResearchArticle[] = Array.isArray(researchData) ? researchData : [];

      // Load research articles from individual files
      const articlePromises = [
        'bedroom_environment_article.json',
        'breathing_stress_2023_article_json.json',
        'breathwork_meta_article.json',
        'commitment_devices_rct_2019_article.json',
        'cyclic_sighing_2023_article.json',
        'exercise_depression_article.json',
        'exercise_snacks_review_2024_article.json',
        'exercise_stress_2022_article.json',
        'expressive_writing_article.json',
        'financial_incentives_meta_2013_article.json',
        'habit_stacking_article.json',
        'habit_stacking_exercise_article.json',
        'implementation_intentions_exercise_article.json',
        'magnesium_sleep_article.json',
        'mbsr_stress_article.json',
        'micro_workouts_fitness_2023_article.json',
        'morning_exercise_article.json',
        'nature_dose_response_2019_article.json',
        'omega3_brain_2019_article_json.json',
        'omega3_depression_2020_article_json.json',
        'omega3_inflammation_2021_article_json.json',
        'progressive_muscle_relaxation_article.json',
        'tart_cherry_article.json',
        'temporal_consistency_2019_article.json',
        'two_minute_rule_article.json',
        'two_minute_rule_exercise_article.json',
        'vitamin_d_immune_2021_article_json.json',
        'vitamin_d_meta_2019_article_json.json',
        'warm_bath_sleep_article.json',
        'winddown_routine_article.json',
        'workout_variety_study_2020_article.json'
      ].map(async (filename) => {
        try {
          const response = await fetch(`/data/research-articles/${filename}`);
          const data = await response.json();
          return Array.isArray(data) ? data : [data];
        } catch (error) {
          console.warn(`Failed to load ${filename}:`, error);
          return [];
        }
      });

      const articleResults = await Promise.all(articlePromises);
      const allArticles = articleResults.flat().filter(Boolean);

      // Combine research studies and articles
      const allContent = [...research, ...allArticles];

      // Convert to backlog items
      this.backlogItems = allContent.map(item => this.createBacklogItem(item));

      console.log(`📋 Translation backlog initialized with ${this.backlogItems.length} items`);
    } catch (error) {
      console.error('Failed to load translation backlog:', error);
      this.backlogItems = [];
    }
  }

  /**
   * Convert content item to backlog item
   */
  private createBacklogItem(item: any): BacklogItem {
    const wordCount = this.estimateWordCount(item);
    const complexity = this.determineComplexity(item, wordCount);
    const priority = this.determinePriority(item, complexity);

    return {
      id: item.id || `unknown-${Date.now()}`,
      type: item.content ? 'article' : 'research',
      title: item.title || 'Untitled',
      category: item.category || 'general',
      priority,
      estimatedWords: wordCount,
      complexity,
      hasGermanVersion: false, // TODO: Check for existing German translations
      englishContent: {
        title: item.title || '',
        summary: item.summary || '',
        content: item.content || '',
        lastModified: new Date().toISOString()
      },
      tags: this.extractTags(item),
      researchQuality: this.determineResearchQuality(item),
      addedToBacklog: new Date().toISOString(),
      targetCompletionDate: this.calculateTargetDate(priority, complexity),
    };
  }

  /**
   * Estimate word count from content
   */
  private estimateWordCount(item: any): number {
    let totalWords = 0;
    
    if (item.title) totalWords += item.title.split(' ').length;
    if (item.summary) totalWords += item.summary.split(' ').length;
    if (item.content) totalWords += item.content.split(' ').length;
    if (item.finding) totalWords += item.finding.split(' ').length;
    if (item.keyTakeaways) totalWords += item.keyTakeaways.join(' ').split(' ').length;

    return totalWords;
  }

  /**
   * Determine translation complexity
   */
  private determineComplexity(item: any, wordCount: number): BacklogItem['complexity'] {
    // Check for technical terms
    const technicalTerms = [
      'meta-analysis', 'randomized', 'placebo', 'statistical', 'correlation',
      'neuroscience', 'psychology', 'methodology', 'intervention', 'efficacy',
      'biomarker', 'dopamine', 'serotonin', 'cortisol', 'inflammation'
    ];

    const content = `${item.title} ${item.summary} ${item.content || ''}`.toLowerCase();
    const technicalTermCount = technicalTerms.filter(term => content.includes(term)).length;

    // Complexity based on word count and technical terms
    if (wordCount > 2000 || technicalTermCount > 5) return 'expert';
    if (wordCount > 1000 || technicalTermCount > 3) return 'complex';
    if (wordCount > 500 || technicalTermCount > 1) return 'moderate';
    return 'simple';
  }

  /**
   * Determine translation priority
   */
  private determinePriority(item: any, complexity: BacklogItem['complexity']): BacklogItem['priority'] {
    // High-priority categories
    const highPriorityCategories = ['sleep', 'exercise', 'stress', 'nutrition'];
    const isHighPriorityCategory = highPriorityCategories.some(cat => 
      item.category?.toLowerCase().includes(cat) || item.title?.toLowerCase().includes(cat)
    );

    // Research quality indicators
    const hasHighQuality = item.year && item.year >= 2020;
    const hasLargeSampleSize = item.sampleSize && item.sampleSize > 100;

    if (isHighPriorityCategory && hasHighQuality) return 'critical';
    if (isHighPriorityCategory || hasHighQuality) return 'high';
    if (hasLargeSampleSize || complexity === 'simple') return 'medium';
    return 'low';
  }

  /**
   * Extract tags from content
   */
  private extractTags(item: any): string[] {
    const tags: string[] = [];
    
    if (item.category) tags.push(item.category);
    if (item.habitCategories) tags.push(...item.habitCategories);
    if (item.tags) tags.push(...item.tags);
    if (item.studyType) tags.push(item.studyType);
    
    // Add year tag if available
    if (item.year) tags.push(`${item.year}`);
    
    return [...new Set(tags)].slice(0, 5); // Limit to 5 unique tags
  }

  /**
   * Determine research quality
   */
  private determineResearchQuality(item: any): BacklogItem['researchQuality'] {
    if (!item.year || !item.sampleSize) return 'low';
    
    const isRecent = item.year >= 2020;
    const hasLargeSample = item.sampleSize > 200;
    const isMetaAnalysis = item.studyType?.toLowerCase().includes('meta');
    
    if (isRecent && (hasLargeSample || isMetaAnalysis)) return 'high';
    if (isRecent || hasLargeSample) return 'medium';
    return 'low';
  }

  /**
   * Calculate target completion date based on priority and complexity
   */
  private calculateTargetDate(priority: BacklogItem['priority'], complexity: BacklogItem['complexity']): string {
    const now = new Date();
    let daysToAdd = 30; // Default 30 days

    // Adjust based on priority
    switch (priority) {
      case 'critical': daysToAdd = 7; break;
      case 'high': daysToAdd = 14; break;
      case 'medium': daysToAdd = 30; break;
      case 'low': daysToAdd = 60; break;
    }

    // Adjust based on complexity
    switch (complexity) {
      case 'expert': daysToAdd *= 2; break;
      case 'complex': daysToAdd *= 1.5; break;
      case 'moderate': daysToAdd *= 1.2; break;
      // 'simple' keeps the base duration
    }

    const targetDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return targetDate.toISOString();
  }

  /**
   * Get filtered and sorted backlog items
   */
  async getBacklog(filters: BacklogFilters = {}): Promise<BacklogItem[]> {
    await this.initialize();
    
    let filteredItems = [...this.backlogItems];

    // Apply filters
    if (filters.type) {
      filteredItems = filteredItems.filter(item => item.type === filters.type);
    }
    if (filters.priority) {
      filteredItems = filteredItems.filter(item => item.priority === filters.priority);
    }
    if (filters.complexity) {
      filteredItems = filteredItems.filter(item => item.complexity === filters.complexity);
    }
    if (filters.hasGermanVersion !== undefined) {
      filteredItems = filteredItems.filter(item => item.hasGermanVersion === filters.hasGermanVersion);
    }
    if (filters.category) {
      filteredItems = filteredItems.filter(item => 
        item.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'priority';
    const direction = filters.sortDirection || 'desc';
    
    filteredItems.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'dateAdded':
          comparison = new Date(a.addedToBacklog).getTime() - new Date(b.addedToBacklog).getTime();
          break;
        case 'complexity':
          const complexityOrder = { expert: 4, complex: 3, moderate: 2, simple: 1 };
          comparison = complexityOrder[a.complexity] - complexityOrder[b.complexity];
          break;
        case 'estimatedWords':
          comparison = a.estimatedWords - b.estimatedWords;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });

    return filteredItems;
  }

  /**
   * Get backlog statistics
   */
  async getBacklogStats(): Promise<BacklogStats> {
    await this.initialize();
    
    const stats: BacklogStats = {
      total: this.backlogItems.length,
      byType: { habit: 0, research: 0, article: 0 },
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
      byComplexity: { simple: 0, moderate: 0, complex: 0, expert: 0 },
      totalEstimatedWords: 0,
      averageComplexity: 'moderate',
      completedTranslations: 0,
      pendingTranslations: 0,
    };

    this.backlogItems.forEach(item => {
      stats.byType[item.type]++;
      stats.byPriority[item.priority]++;
      stats.byComplexity[item.complexity]++;
      stats.totalEstimatedWords += item.estimatedWords;
      
      if (item.hasGermanVersion) {
        stats.completedTranslations++;
      } else {
        stats.pendingTranslations++;
      }
    });

    // Calculate average complexity
    const complexityWeights = { simple: 1, moderate: 2, complex: 3, expert: 4 };
    const totalComplexityWeight = this.backlogItems.reduce((sum, item) => 
      sum + complexityWeights[item.complexity], 0
    );
    const averageComplexityWeight = totalComplexityWeight / this.backlogItems.length;
    
    if (averageComplexityWeight <= 1.5) stats.averageComplexity = 'simple';
    else if (averageComplexityWeight <= 2.5) stats.averageComplexity = 'moderate';
    else if (averageComplexityWeight <= 3.5) stats.averageComplexity = 'complex';
    else stats.averageComplexity = 'expert';

    return stats;
  }

  /**
   * Mark item as translated
   */
  async markAsTranslated(itemId: string, germanContent: BacklogItem['germanContent']): Promise<void> {
    const item = this.backlogItems.find(item => item.id === itemId);
    if (item) {
      item.hasGermanVersion = true;
      item.germanContent = germanContent;
    }
  }

  /**
   * Update backlog item
   */
  async updateBacklogItem(itemId: string, updates: Partial<BacklogItem>): Promise<void> {
    const index = this.backlogItems.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.backlogItems[index] = { ...this.backlogItems[index], ...updates };
    }
  }

  /**
   * Add custom item to backlog
   */
  async addToBacklog(item: Omit<BacklogItem, 'addedToBacklog'>): Promise<void> {
    const backlogItem: BacklogItem = {
      ...item,
      addedToBacklog: new Date().toISOString(),
    };
    this.backlogItems.push(backlogItem);
  }

  /**
   * Remove item from backlog
   */
  async removeFromBacklog(itemId: string): Promise<void> {
    this.backlogItems = this.backlogItems.filter(item => item.id !== itemId);
  }

  /**
   * Get priority items (critical and high priority)
   */
  async getPriorityItems(): Promise<BacklogItem[]> {
    return this.getBacklog({ 
      priority: 'critical',
      sortBy: 'priority',
      sortDirection: 'desc'
    }).then(critical => 
      this.getBacklog({ 
        priority: 'high',
        sortBy: 'priority', 
        sortDirection: 'desc'
      }).then(high => [...critical, ...high])
    );
  }
}

export const translationBacklogService = new TranslationBacklogService();