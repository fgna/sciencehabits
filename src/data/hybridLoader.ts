/**
 * Hybrid Content Loader
 * 
 * Enhanced data loader that supports both traditional static file loading
 * and dynamic hybrid API content delivery with automatic fallback.
 */

import { db } from '../services/storage/database';
import { Habit, ResearchStudy } from '../types';
import { hybridContentService, ContentRequest } from '../services/migration/HybridContentService';
import { migrationConfig } from '../services/migration/MigrationConfig';
import { loadInitialData as loadStaticData } from './loader';

export interface LoadOptions {
  language?: string;
  forceRefresh?: boolean;
  useHybridAPI?: boolean;
  timeout?: number;
}

export interface LoadResult {
  success: boolean;
  source: 'hybrid_api' | 'static_files' | 'database_cache' | 'fallback';
  habitsCount: number;
  researchCount: number;
  language: string;
  timestamp: string;
  errors?: string[];
}

/**
 * Enhanced data loader with hybrid API support
 */
export async function loadInitialDataHybrid(options: LoadOptions = {}): Promise<LoadResult> {
  const startTime = Date.now();
  const language = options.language || 'en';
  const errors: string[] = [];
  
  console.log(`🔄 Loading initial data with hybrid support (language: ${language})`);
  
  try {
    // Check if hybrid API is enabled and should be used
    const useHybrid = options.useHybridAPI ?? migrationConfig.isFeatureEnabled('hybrid_content_api');
    
    if (useHybrid) {
      console.log('📡 Attempting to load data via hybrid API...');
      
      try {
        const result = await loadFromHybridAPI(language, options);
        if (result.success) {
          console.log(`✅ Successfully loaded data via hybrid API in ${Date.now() - startTime}ms`);
          return result;
        } else {
          errors.push(`Hybrid API failed: ${result.errors?.join(', ') || 'Unknown error'}`);
          console.warn('⚠️ Hybrid API failed, falling back to static files');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown hybrid API error';
        errors.push(`Hybrid API error: ${errorMessage}`);
        console.warn('⚠️ Hybrid API error, falling back to static files:', error);
      }
    }
    
    // Fallback to static file loading
    console.log('📁 Loading from static files...');
    try {
      await loadStaticData();
      
      // Count loaded data
      const habitsCount = await db.habits.count();
      const researchCount = await db.research.count();
      
      return {
        success: true,
        source: 'static_files',
        habitsCount,
        researchCount,
        language,
        timestamp: new Date().toISOString(),
        errors: errors.length > 0 ? errors : undefined
      };
      
    } catch (staticError) {
      const errorMessage = staticError instanceof Error ? staticError.message : 'Unknown static loading error';
      errors.push(`Static loading failed: ${errorMessage}`);
      console.error('❌ Static file loading failed:', staticError);
      
      return {
        success: false,
        source: 'fallback',
        habitsCount: 0,
        researchCount: 0,
        language,
        timestamp: new Date().toISOString(),
        errors
      };
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Loader error: ${errorMessage}`);
    console.error('❌ Data loading failed completely:', error);
    
    return {
      success: false,
      source: 'fallback',
      habitsCount: 0,
      researchCount: 0,
      language,
      timestamp: new Date().toISOString(),
      errors
    };
  }
}

/**
 * Load data from hybrid API service
 */
async function loadFromHybridAPI(language: string, options: LoadOptions): Promise<LoadResult> {
  const errors: string[] = [];
  let habitsCount = 0;
  let researchCount = 0;
  
  try {
    // Load habits
    console.log('📋 Loading habits via hybrid API...');
    const habitsRequest: ContentRequest = {
      type: 'habits',
      language,
      cacheStrategy: options.forceRefresh ? 'network_first' : 'cache_first',
      timeout: options.timeout || 10000
    };
    
    const habitsResponse = await hybridContentService.request(habitsRequest);
    
    if (habitsResponse.success && habitsResponse.data) {
      // Handle both old format (array) and new format (object with habits property)
      const habits = Array.isArray(habitsResponse.data) 
        ? habitsResponse.data 
        : habitsResponse.data.habits;
      
      if (habits && Array.isArray(habits)) {
        // Clear existing habits if force refresh
        if (options.forceRefresh) {
          await db.habits.clear();
        }
        
        // Validate and process habits
        const validHabits = habits.filter(isValidHabit);
        await db.habits.bulkPut(validHabits);
        habitsCount = validHabits.length;
        
        console.log(`✅ Loaded ${habitsCount} habits from ${habitsResponse.source}`);
      } else {
        errors.push('Invalid habits data structure from API');
      }
    } else {
      errors.push(`Habits API error: ${habitsResponse.error || 'Unknown error'}`);
    }
    
    // Load research studies
    console.log('🔬 Loading research via hybrid API...');
    const researchRequest: ContentRequest = {
      type: 'research',
      language,
      cacheStrategy: options.forceRefresh ? 'network_first' : 'cache_first',
      timeout: options.timeout || 10000
    };
    
    const researchResponse = await hybridContentService.request(researchRequest);
    
    if (researchResponse.success && researchResponse.data) {
      // Handle both old format (array) and new format (object with studies property)
      const studies = Array.isArray(researchResponse.data)
        ? researchResponse.data
        : researchResponse.data.studies;
      
      if (studies && Array.isArray(studies)) {
        // Clear existing research if force refresh
        if (options.forceRefresh) {
          await db.research.clear();
        }
        
        // Validate and process research
        const validStudies = studies.filter(isValidResearchStudy);
        await db.research.bulkPut(validStudies);
        researchCount = validStudies.length;
        
        console.log(`✅ Loaded ${researchCount} research studies from ${researchResponse.source}`);
      } else {
        errors.push('Invalid research data structure from API');
      }
    } else {
      errors.push(`Research API error: ${researchResponse.error || 'Unknown error'}`);
    }
    
    // Consider successful if we loaded any data
    const success = habitsCount > 0 || researchCount > 0;
    
    return {
      success,
      source: 'hybrid_api',
      habitsCount,
      researchCount,
      language,
      timestamp: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown hybrid API error';
    errors.push(`Hybrid API exception: ${errorMessage}`);
    
    return {
      success: false,
      source: 'hybrid_api',
      habitsCount,
      researchCount,
      language,
      timestamp: new Date().toISOString(),
      errors
    };
  }
}

/**
 * Validate habit data structure
 */
function isValidHabit(habit: any): habit is Habit {
  return (
    habit &&
    typeof habit === 'object' &&
    typeof habit.id === 'string' &&
    typeof habit.title === 'string' &&
    typeof habit.description === 'string' &&
    typeof habit.category === 'string' &&
    Array.isArray(habit.goalTags) &&
    typeof habit.isCustom === 'boolean'
  );
}

/**
 * Validate research study data structure
 */
function isValidResearchStudy(study: any): study is ResearchStudy {
  return (
    study &&
    typeof study === 'object' &&
    typeof study.id === 'string' &&
    typeof study.title === 'string' &&
    typeof study.authors === 'string' &&
    typeof study.year === 'number' &&
    typeof study.summary === 'string' &&
    typeof study.credibilityTier === 'string'
  );
}

/**
 * Refresh content from hybrid API
 */
export async function refreshContentFromAPI(options: LoadOptions = {}): Promise<LoadResult> {
  return loadInitialDataHybrid({
    ...options,
    forceRefresh: true,
    useHybridAPI: true
  });
}

/**
 * Get content loading health status
 */
export async function getContentLoadingHealth(): Promise<{
  hybridAPIHealth: any;
  databaseHealth: {
    habitsCount: number;
    researchCount: number;
    lastUpdated: string | null;
  };
  configurationHealth: {
    hybridEnabled: boolean;
    supportedLanguages: string[];
    currentLanguage: string;
  };
}> {
  const [habitsCount, researchCount] = await Promise.all([
    db.habits.count(),
    db.research.count()
  ]);
  
  // Get last modification time from database (if available)
  const lastHabit = await db.habits.orderBy('title').last();
  const lastResearch = await db.research.orderBy('title').last();
  const lastUpdated = lastHabit || lastResearch ? new Date().toISOString() : null;
  
  return {
    hybridAPIHealth: hybridContentService.getHealthStatus(),
    databaseHealth: {
      habitsCount,
      researchCount,
      lastUpdated
    },
    configurationHealth: {
      hybridEnabled: migrationConfig.isFeatureEnabled('hybrid_content_api'),
      supportedLanguages: ['en', 'de', 'fr', 'es'],
      currentLanguage: 'en' // This could be dynamic based on user settings
    }
  };
}

/**
 * Force reload all data with specific language
 */
export async function reloadDataWithLanguage(language: string): Promise<LoadResult> {
  console.log(`🌍 Reloading all data for language: ${language}`);
  
  return loadInitialDataHybrid({
    language,
    forceRefresh: true,
    useHybridAPI: true,
    timeout: 15000
  });
}

/**
 * Clear all cached data and reload
 */
export async function clearCacheAndReload(options: LoadOptions = {}): Promise<LoadResult> {
  console.log('🗑️ Clearing cache and reloading...');
  
  // Clear hybrid service cache
  hybridContentService.clearCache();
  
  // Clear database
  await db.habits.clear();
  await db.research.clear();
  
  return loadInitialDataHybrid({
    ...options,
    forceRefresh: true
  });
}