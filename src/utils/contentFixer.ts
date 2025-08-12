import { Habit, ResearchArticle } from '../types';
import { ValidationError, ValidationWarning } from '../types/content';

export interface ContentFix {
  type: 'habit' | 'research';
  id: string;
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
}

export class ContentFixer {
  private fixes: ContentFix[] = [];

  /**
   * Auto-fix common validation errors and warnings
   */
  async autoFix(
    habits: Habit[],
    research: ResearchArticle[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<{
    habits: Habit[];
    research: ResearchArticle[];
    fixes: ContentFix[];
    unfixableErrors: ValidationError[];
  }> {
    this.fixes = [];
    const fixedHabits = [...habits];
    const fixedResearch = [...research];
    const unfixableErrors: ValidationError[] = [];

    // Process errors
    for (const error of errors) {
      const fixed = this.fixError(error, fixedHabits, fixedResearch);
      if (!fixed) {
        unfixableErrors.push(error);
      }
    }

    // Process warnings
    for (const warning of warnings) {
      this.fixWarning(warning, fixedHabits, fixedResearch);
    }

    return {
      habits: fixedHabits,
      research: fixedResearch,
      fixes: this.fixes,
      unfixableErrors
    };
  }

  private fixError(
    error: ValidationError,
    habits: Habit[],
    research: ResearchArticle[]
  ): boolean {
    // Fix missing required fields
    if (error.message.includes('Missing required field')) {
      return this.fixMissingField(error, habits, research);
    }

    // Fix duplicate IDs
    if (error.message.includes('Duplicate ID')) {
      return this.fixDuplicateId(error, habits, research);
    }

    // Fix invalid difficulty levels
    if (error.message.includes('Invalid difficulty')) {
      return this.fixInvalidDifficulty(error, habits, research);
    }

    // Fix invalid frequencies
    if (error.message.includes('Invalid frequency')) {
      return this.fixInvalidFrequency(error, habits);
    }

    return false;
  }

  private fixWarning(
    warning: ValidationWarning,
    habits: Habit[],
    research: ResearchArticle[]
  ): void {
    // Add missing optional fields with defaults
    if (warning.message.includes('Missing optional field')) {
      this.addOptionalField(warning, habits, research);
    }

    // Fix research article references
    if (warning.message.includes('references non-existent')) {
      this.fixBrokenReference(warning, habits, research);
    }
  }

  private fixMissingField(
    error: ValidationError,
    habits: Habit[],
    research: ResearchArticle[]
  ): boolean {
    const itemId = error.itemId;
    const field = error.field;

    if (!itemId || !field) return false;

    // Find the item
    const habitIndex = habits.findIndex(h => h.id === itemId);
    if (habitIndex !== -1) {
      const habit = habits[habitIndex];
      const defaultValue = this.getDefaultValueForField(field, 'habit');
      
      if (defaultValue !== undefined) {
        (habit as any)[field] = defaultValue;
        this.fixes.push({
          type: 'habit',
          id: itemId,
          field,
          oldValue: undefined,
          newValue: defaultValue,
          reason: `Added missing required field '${field}'`
        });
        return true;
      }
    }

    const researchIndex = research.findIndex(r => r.id === itemId);
    if (researchIndex !== -1) {
      const article = research[researchIndex];
      const defaultValue = this.getDefaultValueForField(field, 'research');
      
      if (defaultValue !== undefined) {
        (article as any)[field] = defaultValue;
        this.fixes.push({
          type: 'research',
          id: itemId,
          field,
          oldValue: undefined,
          newValue: defaultValue,
          reason: `Added missing required field '${field}'`
        });
        return true;
      }
    }

    return false;
  }

  private fixDuplicateId(
    error: ValidationError,
    habits: Habit[],
    research: ResearchArticle[]
  ): boolean {
    const duplicateId = error.details?.duplicateId;
    if (!duplicateId) return false;

    // Find all items with this ID
    const duplicateHabits = habits.filter(h => h.id === duplicateId);
    const duplicateResearch = research.filter(r => r.id === duplicateId);

    // Rename duplicates (keep first, rename others)
    for (let i = 1; i < duplicateHabits.length; i++) {
      const newId = `${duplicateId}_${i}`;
      const oldId = duplicateHabits[i].id;
      duplicateHabits[i].id = newId;
      
      this.fixes.push({
        type: 'habit',
        id: oldId,
        field: 'id',
        oldValue: oldId,
        newValue: newId,
        reason: `Renamed duplicate ID to make it unique`
      });
    }

    for (let i = 1; i < duplicateResearch.length; i++) {
      const newId = `${duplicateId}_${i}`;
      const oldId = duplicateResearch[i].id;
      duplicateResearch[i].id = newId;
      
      this.fixes.push({
        type: 'research',
        id: oldId,
        field: 'id',
        oldValue: oldId,
        newValue: newId,
        reason: `Renamed duplicate ID to make it unique`
      });
    }

    return duplicateHabits.length > 1 || duplicateResearch.length > 1;
  }

  private fixInvalidDifficulty(
    error: ValidationError,
    habits: Habit[],
    research: ResearchArticle[]
  ): boolean {
    const itemId = error.itemId;
    if (!itemId) return false;

    const habitIndex = habits.findIndex(h => h.id === itemId);
    if (habitIndex !== -1) {
      const habit = habits[habitIndex];
      const oldValue = habit.difficulty;
      
      // Map common variations to valid values
      const difficultyMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
        'easy': 'beginner',
        'medium': 'intermediate',
        'hard': 'advanced',
        'simple': 'beginner',
        'moderate': 'intermediate',
        'difficult': 'advanced',
        'expert': 'advanced'
      };

      const newValue = difficultyMap[oldValue?.toLowerCase()] || 'beginner';
      habit.difficulty = newValue;

      this.fixes.push({
        type: 'habit',
        id: itemId,
        field: 'difficulty',
        oldValue,
        newValue,
        reason: `Corrected invalid difficulty level`
      });
      return true;
    }

    return false;
  }

  private fixInvalidFrequency(error: ValidationError, habits: Habit[]): boolean {
    const itemId = error.itemId;
    if (!itemId) return false;

    const habitIndex = habits.findIndex(h => h.id === itemId);
    if (habitIndex !== -1) {
      const habit = habits[habitIndex];
      
      // Set default frequency if missing or invalid
      if (!habit.frequency || typeof habit.frequency !== 'object') {
        habit.frequency = {
          type: 'daily'
        };

        this.fixes.push({
          type: 'habit',
          id: itemId,
          field: 'frequency',
          oldValue: habit.frequency,
          newValue: { type: 'daily' },
          reason: `Added default daily frequency`
        });
        return true;
      }
    }

    return false;
  }

  private addOptionalField(
    warning: ValidationWarning,
    habits: Habit[],
    research: ResearchArticle[]
  ): void {
    const itemId = warning.itemId;
    const field = warning.field;

    if (!itemId || !field) return;

    const habitIndex = habits.findIndex(h => h.id === itemId);
    if (habitIndex !== -1) {
      const habit = habits[habitIndex];
      const defaultValue = this.getOptionalDefaultValue(field, 'habit');
      
      if (defaultValue !== undefined && !(field in habit)) {
        (habit as any)[field] = defaultValue;
        this.fixes.push({
          type: 'habit',
          id: itemId,
          field,
          oldValue: undefined,
          newValue: defaultValue,
          reason: `Added optional field '${field}' with default value`
        });
      }
    }

    const researchIndex = research.findIndex(r => r.id === itemId);
    if (researchIndex !== -1) {
      const article = research[researchIndex];
      const defaultValue = this.getOptionalDefaultValue(field, 'research');
      
      if (defaultValue !== undefined && !(field in article)) {
        (article as any)[field] = defaultValue;
        this.fixes.push({
          type: 'research',
          id: itemId,
          field,
          oldValue: undefined,
          newValue: defaultValue,
          reason: `Added optional field '${field}' with default value`
        });
      }
    }
  }

  private fixBrokenReference(
    warning: ValidationWarning,
    habits: Habit[],
    research: ResearchArticle[]
  ): void {
    // Remove broken references from relatedHabits arrays
    for (const article of research) {
      if (article.relatedHabits) {
        const validHabits = article.relatedHabits.filter(
          habitId => habits.some(h => h.id === habitId)
        );
        
        if (validHabits.length !== article.relatedHabits.length) {
          const removed = article.relatedHabits.filter(
            id => !validHabits.includes(id)
          );
          
          article.relatedHabits = validHabits;
          this.fixes.push({
            type: 'research',
            id: article.id,
            field: 'relatedHabits',
            oldValue: [...article.relatedHabits, ...removed],
            newValue: validHabits,
            reason: `Removed non-existent habit references: ${removed.join(', ')}`
          });
        }
      }
    }
  }

  private getDefaultValueForField(field: string, type: 'habit' | 'research'): any {
    const habitDefaults: Record<string, any> = {
      title: 'Untitled Habit',
      description: 'No description provided',
      category: 'general',
      difficulty: 'beginner',
      timeMinutes: 5,
      frequency: { type: 'daily' }
    };

    const researchDefaults: Record<string, any> = {
      title: 'Untitled Research',
      subtitle: 'No subtitle provided',
      content: 'Content not available',
      readingTime: 5,
      difficulty: 'beginner',
      keyFindings: ['No key findings available'],
      practicalTips: ['No practical tips available']
    };

    return type === 'habit' ? habitDefaults[field] : researchDefaults[field];
  }

  private getOptionalDefaultValue(field: string, type: 'habit' | 'research'): any {
    const optionalDefaults: Record<string, any> = {
      goalTags: [],
      scientificEvidence: 'moderate',
      researchBacked: false,
      icon: '📝',
      benefits: [],
      tips: [],
      relatedHabits: [],
      tags: [],
      studyDetails: {
        year: new Date().getFullYear(),
        sampleSize: 'Unknown',
        methodology: 'Not specified',
        journal: 'Not specified'
      }
    };

    return optionalDefaults[field];
  }

  /**
   * Generate a fix report
   */
  generateReport(): string {
    if (this.fixes.length === 0) {
      return 'No fixes applied.';
    }

    const habitFixes = this.fixes.filter(f => f.type === 'habit');
    const researchFixes = this.fixes.filter(f => f.type === 'research');

    let report = `Applied ${this.fixes.length} fixes:\n\n`;
    
    if (habitFixes.length > 0) {
      report += `Habit Fixes (${habitFixes.length}):\n`;
      habitFixes.forEach(fix => {
        report += `  - ${fix.id}: ${fix.reason}\n`;
        report += `    ${fix.field}: ${JSON.stringify(fix.oldValue)} → ${JSON.stringify(fix.newValue)}\n`;
      });
      report += '\n';
    }

    if (researchFixes.length > 0) {
      report += `Research Article Fixes (${researchFixes.length}):\n`;
      researchFixes.forEach(fix => {
        report += `  - ${fix.id}: ${fix.reason}\n`;
        report += `    ${fix.field}: ${JSON.stringify(fix.oldValue)} → ${JSON.stringify(fix.newValue)}\n`;
      });
    }

    return report;
  }
}