import { useState, useEffect } from 'react';
import { ContentValidator } from '../services/validation/ContentValidator';
import { ValidationResult, HabitWithResearch, ValidationSummary } from '../types/validation';
import { Habit } from '../types';

// Temporary research interface
interface ResearchStudy {
  id: string;
  title: string;
  summary: string;
  year: number;
  authors?: string[];
  journal?: string;
  relatedHabits?: string[];
  category?: string;
  tags?: string[];
}

interface UseContentValidationOptions {
  enableValidation?: boolean;
  enableDevelopmentWarnings?: boolean;
  autoValidateOnMount?: boolean;
}

export function useContentValidation(options: UseContentValidationOptions = {}) {
  const {
    enableValidation = true,
    enableDevelopmentWarnings = process.env.NODE_ENV === 'development',
    autoValidateOnMount = true
  } = options;

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [enrichedHabits, setEnrichedHabits] = useState<HabitWithResearch[]>([]);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create validator instance
  const validator = new ContentValidator({
    enableConsoleOutput: enableDevelopmentWarnings,
    failOnCriticalErrors: false // Allow app to continue with warnings
  });

  const validateContent = async (habits: Habit[], research: ResearchStudy[]) => {
    if (!enableValidation) {
      console.log('⏭️ Content validation disabled');
      return { success: true, enrichedHabits: habits };
    }

    setIsValidating(true);
    setError(null);

    try {
      console.log('🔍 Starting content validation...');
      const result = await validator.validateAllContent(habits, research);
      
      setValidationResult(result);
      
      if (result.enrichedHabits) {
        setEnrichedHabits(result.enrichedHabits);
      }

      // Generate summary for development dashboard
      if (enableDevelopmentWarnings && result.success) {
        const summary = await generateValidationSummary(result);
        setValidationSummary(summary);
      }

      if (result.criticalErrors.length > 0) {
        const errorMessage = `Critical validation errors: ${result.criticalErrors.map(e => e.message).join(', ')}`;
        setError(errorMessage);
        console.error('❌ Critical validation errors:', result.criticalErrors);
      } else if (result.inconsistencies.length > 0) {
        console.warn(`⚠️ Found ${result.inconsistencies.length} data inconsistencies (app will continue)`);
      } else {
        console.log('✅ Content validation passed');
      }

      return {
        success: result.success,
        enrichedHabits: result.enrichedHabits || habits,
        inconsistencies: result.inconsistencies,
        warnings: result.warnings
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown validation error';
      console.error('💥 Content validation failed:', errorMessage);
      setError(errorMessage);
      
      return {
        success: false,
        enrichedHabits: habits, // Fallback to original habits
        error: errorMessage
      };
    } finally {
      setIsValidating(false);
    }
  };

  const validateHabit = (habit: Habit, research: ResearchStudy[]): HabitWithResearch => {
    const researchIds = habit.researchIds || [];
    const availableResearch: ResearchStudy[] = [];
    const missingResearchIds: string[] = [];

    // Create research lookup for performance
    const researchMap = new Map(research.map(r => [r.id, r]));

    for (const researchId of researchIds) {
      const researchArticle = researchMap.get(researchId);
      if (researchArticle) {
        availableResearch.push(researchArticle);
      } else {
        missingResearchIds.push(researchId);
      }
    }

    const hasCompleteResearch = missingResearchIds.length === 0;
    let validationStatus: 'complete' | 'partial' | 'missing_research';
    
    if (availableResearch.length === 0 && researchIds.length > 0) {
      validationStatus = 'missing_research';
    } else if (missingResearchIds.length > 0) {
      validationStatus = 'partial';
    } else {
      validationStatus = 'complete';
    }

    return {
      ...habit,
      availableResearch,
      missingResearchIds,
      hasCompleteResearch,
      validationStatus
    };
  };

  const getHabitValidationStatus = (habitId: string): 'complete' | 'partial' | 'missing_research' | null => {
    const enrichedHabit = enrichedHabits.find(h => h.id === habitId);
    return enrichedHabit?.validationStatus || null;
  };

  const getMissingResearchIds = (habitId: string): string[] => {
    const enrichedHabit = enrichedHabits.find(h => h.id === habitId);
    return enrichedHabit?.missingResearchIds || [];
  };

  const getAvailableResearch = (habitId: string): ResearchStudy[] => {
    const enrichedHabit = enrichedHabits.find(h => h.id === habitId);
    return enrichedHabit?.availableResearch || [];
  };

  // Auto-validate on component mount if enabled
  useEffect(() => {
    if (autoValidateOnMount && enableValidation) {
      // This would typically load data and validate
      // For now, we'll just log that auto-validation is ready
      console.log('🔄 Content validation hook ready for auto-validation');
    }
  }, [autoValidateOnMount, enableValidation]);

  return {
    // Validation state
    isValidating,
    validationResult,
    enrichedHabits,
    validationSummary,
    error,
    
    // Validation methods
    validateContent,
    validateHabit,
    
    // Query methods
    getHabitValidationStatus,
    getMissingResearchIds,
    getAvailableResearch,
    
    // Status flags
    hasValidationErrors: (validationResult?.criticalErrors.length || 0) > 0,
    hasValidationWarnings: (validationResult?.inconsistencies.length || 0) > 0,
    isValidationEnabled: enableValidation,
    
    // Stats
    validationStats: validationResult ? {
      habitsProcessed: validationResult.totals.habitsProcessed,
      researchProcessed: validationResult.totals.researchProcessed,
      criticalErrors: validationResult.totals.criticalErrors,
      inconsistencies: validationResult.totals.inconsistencies,
      warnings: validationResult.totals.warnings
    } : null
  };
}

// Helper function to generate validation summary
async function generateValidationSummary(result: ValidationResult): Promise<ValidationSummary> {
  const inconsistencyBreakdown: Record<string, number> = {};
  
  result.inconsistencies.forEach(inconsistency => {
    inconsistencyBreakdown[inconsistency.type] = (inconsistencyBreakdown[inconsistency.type] || 0) + 1;
  });

  const topIssues = Object.entries(inconsistencyBreakdown)
    .map(([type, count]) => ({
      type,
      count,
      impact: getImpactForType(type)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    timestamp: result.timestamp,
    buildId: result.buildId,
    totals: result.totals,
    inconsistencyBreakdown,
    topIssues,
    recommendations: generateRecommendations(result),
    filesScan: {
      habitsFiles: 1, // Simplified for now
      researchFiles: 1,
      lastModified: result.timestamp
    }
  };
}

function getImpactForType(type: string): string {
  const impactMap: Record<string, string> = {
    'MISSING_RESEARCH': 'Habits display without research evidence',
    'ORPHANED_RESEARCH': 'Research not discoverable through habits',
    'INVALID_GOAL_TAGS': 'Incorrect habit recommendations',
    'DUPLICATE_IDS': 'Data conflicts and unpredictable behavior'
  };
  
  return impactMap[type] || 'Unknown impact';
}

function generateRecommendations(result: ValidationResult): string[] {
  const recommendations: string[] = [];

  if (result.criticalErrors.length > 0) {
    recommendations.push('🚨 Fix critical errors before deployment');
  }

  const missingResearchCount = result.inconsistencies.filter(i => i.type === 'MISSING_RESEARCH').length;
  if (missingResearchCount > 0) {
    recommendations.push(`📚 Add research articles for ${missingResearchCount} habits`);
  }

  const orphanedResearchCount = result.inconsistencies.filter(i => i.type === 'ORPHANED_RESEARCH').length;
  if (orphanedResearchCount > 0) {
    recommendations.push(`🔗 Link ${orphanedResearchCount} orphaned research articles`);
  }

  if (result.warnings.length > 5) {
    recommendations.push('📝 Review content quality warnings');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Content validation passed with no major issues');
  }

  return recommendations;
}