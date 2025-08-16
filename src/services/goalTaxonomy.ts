/**
 * Goal Taxonomy Service
 * 
 * Central source of truth for all goal-related mappings, handling synonyms,
 * aliases, and semantic relationships to ensure robust goal-to-habit matching.
 */

// Import the taxonomy data
import goalTaxonomyData from '../data/goalTaxonomy.json';

export interface GoalMapping {
  officialId: string;           // Onboarding goal ID (e.g., "reduce_stress")
  aliases: string[];            // Alternative terms used in content
  semanticTerms: string[];      // Related concepts and terms
  category: string;             // Goal category
  priority: number;             // Matching priority (1 = highest)
  description: string;          // Human-readable description
}

export interface GoalCategory {
  id: string;
  name: string;
  description: string;
  priority: number;
}

export interface DeprecatedMapping {
  deprecatedTag: string;
  officialId: string;
  migrationNote: string;
}

export interface ValidationResult {
  isValid: boolean;
  mappedGoalId: string | null;
  matchType: 'exact' | 'alias' | 'semantic' | 'deprecated' | 'none';
  confidence: number;           // 0-1 score
  suggestions?: string[];       // Alternative suggestions
}

export interface GoalTaxonomyData {
  version: string;
  lastUpdated: string;
  description: string;
  mappings: GoalMapping[];
  categories: GoalCategory[];
  deprecatedMappings: DeprecatedMapping[];
}

class GoalTaxonomyService {
  private taxonomy: GoalTaxonomyData;
  private aliasToGoalMap: Map<string, string> = new Map();
  private semanticToGoalMap: Map<string, string[]> = new Map();
  private deprecatedToGoalMap: Map<string, string> = new Map();

  constructor() {
    this.taxonomy = goalTaxonomyData as GoalTaxonomyData;
    this.buildIndices();
  }

  /**
   * Build search indices for fast lookups
   */
  private buildIndices(): void {
    // Build alias mapping
    this.taxonomy.mappings.forEach(mapping => {
      // Map official ID to itself
      this.aliasToGoalMap.set(mapping.officialId.toLowerCase(), mapping.officialId);
      
      // Map aliases to official ID
      mapping.aliases.forEach(alias => {
        this.aliasToGoalMap.set(alias.toLowerCase(), mapping.officialId);
      });
      
      // Map semantic terms to official ID
      mapping.semanticTerms.forEach(term => {
        const existing = this.semanticToGoalMap.get(term.toLowerCase()) || [];
        existing.push(mapping.officialId);
        this.semanticToGoalMap.set(term.toLowerCase(), existing);
      });
    });

    // Build deprecated mappings
    this.taxonomy.deprecatedMappings.forEach(deprecated => {
      this.deprecatedToGoalMap.set(deprecated.deprecatedTag.toLowerCase(), deprecated.officialId);
    });

    console.log(`[GoalTaxonomy] Initialized with ${this.taxonomy.mappings.length} goal mappings`);
  }

  /**
   * Get the official goal ID for any tag (exact match or alias)
   */
  getOfficialGoalId(tag: string): string | null {
    const normalizedTag = tag.toLowerCase().trim();
    
    // Check direct mapping (official ID or alias)
    const directMatch = this.aliasToGoalMap.get(normalizedTag);
    if (directMatch) {
      return directMatch;
    }

    // Check deprecated mappings
    const deprecatedMatch = this.deprecatedToGoalMap.get(normalizedTag);
    if (deprecatedMatch) {
      return deprecatedMatch;
    }

    return null;
  }

  /**
   * Get all related tags for a given official goal ID
   */
  getAllRelatedTags(goalId: string): string[] {
    const mapping = this.getGoalMapping(goalId);
    if (!mapping) {
      return [];
    }

    return [
      mapping.officialId,
      ...mapping.aliases,
      ...mapping.semanticTerms
    ];
  }

  /**
   * Validate a goal tag and provide detailed information
   */
  validateGoalTag(tag: string): ValidationResult {
    const normalizedTag = tag.toLowerCase().trim();
    
    // Check exact match with official ID
    const officialMapping = this.taxonomy.mappings.find(m => 
      m.officialId.toLowerCase() === normalizedTag
    );
    if (officialMapping) {
      return {
        isValid: true,
        mappedGoalId: officialMapping.officialId,
        matchType: 'exact',
        confidence: 1.0
      };
    }

    // Check alias match
    const aliasMatch = this.aliasToGoalMap.get(normalizedTag);
    if (aliasMatch) {
      return {
        isValid: true,
        mappedGoalId: aliasMatch,
        matchType: 'alias',
        confidence: 0.9
      };
    }

    // Check deprecated mapping
    const deprecatedMatch = this.deprecatedToGoalMap.get(normalizedTag);
    if (deprecatedMatch) {
      return {
        isValid: true,
        mappedGoalId: deprecatedMatch,
        matchType: 'deprecated',
        confidence: 0.8,
        suggestions: [`Consider updating to: ${deprecatedMatch}`]
      };
    }

    // Check semantic match
    const semanticMatches = this.semanticToGoalMap.get(normalizedTag);
    if (semanticMatches && semanticMatches.length > 0) {
      return {
        isValid: true,
        mappedGoalId: semanticMatches[0], // Return first match
        matchType: 'semantic',
        confidence: 0.7,
        suggestions: semanticMatches.length > 1 ? semanticMatches.slice(1) : undefined
      };
    }

    // No match found - provide suggestions based on similarity
    const suggestions = this.findSimilarTags(tag);
    
    return {
      isValid: false,
      mappedGoalId: null,
      matchType: 'none',
      confidence: 0.0,
      suggestions
    };
  }

  /**
   * Map a habit's goalTags to official goal IDs
   */
  mapHabitToGoals(habitGoalTags: string[]): string[] {
    const mappedGoals = new Set<string>();
    
    habitGoalTags.forEach(tag => {
      const validation = this.validateGoalTag(tag);
      if (validation.isValid && validation.mappedGoalId) {
        mappedGoals.add(validation.mappedGoalId);
      }
    });

    return Array.from(mappedGoals);
  }

  /**
   * Get goal mapping by official ID
   */
  getGoalMapping(goalId: string): GoalMapping | null {
    return this.taxonomy.mappings.find(m => m.officialId === goalId) || null;
  }

  /**
   * Get all goal mappings for a category
   */
  getGoalsByCategory(categoryId: string): GoalMapping[] {
    return this.taxonomy.mappings.filter(m => m.category === categoryId);
  }

  /**
   * Get goal category information
   */
  getCategory(categoryId: string): GoalCategory | null {
    return this.taxonomy.categories.find(c => c.id === categoryId) || null;
  }

  /**
   * Get all available categories
   */
  getAllCategories(): GoalCategory[] {
    return [...this.taxonomy.categories].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Search for goals that match user criteria
   */
  searchGoals(query: string): GoalMapping[] {
    const normalizedQuery = query.toLowerCase().trim();
    const results: { mapping: GoalMapping; score: number }[] = [];

    this.taxonomy.mappings.forEach(mapping => {
      let score = 0;

      // Check official ID match
      if (mapping.officialId.toLowerCase().includes(normalizedQuery)) {
        score += 10;
      }

      // Check alias matches
      mapping.aliases.forEach(alias => {
        if (alias.toLowerCase().includes(normalizedQuery)) {
          score += 8;
        }
      });

      // Check semantic matches
      mapping.semanticTerms.forEach(term => {
        if (term.toLowerCase().includes(normalizedQuery)) {
          score += 6;
        }
      });

      // Check description match
      if (mapping.description.toLowerCase().includes(normalizedQuery)) {
        score += 4;
      }

      if (score > 0) {
        results.push({ mapping, score });
      }
    });

    return results
      .sort((a, b) => b.score - a.score)
      .map(r => r.mapping);
  }

  /**
   * Find similar tags using simple string similarity
   */
  private findSimilarTags(tag: string): string[] {
    const normalizedTag = tag.toLowerCase();
    const suggestions: { tag: string; similarity: number }[] = [];

    // Check against all known tags
    this.aliasToGoalMap.forEach((goalId, knownTag) => {
      const similarity = this.calculateStringSimilarity(normalizedTag, knownTag);
      if (similarity > 0.5) {
        suggestions.push({ tag: goalId, similarity });
      }
    });

    return suggestions
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(s => s.tag);
  }

  /**
   * Calculate simple string similarity (Jaccard index on character bigrams)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const getBigrams = (str: string): Set<string> => {
      const bigrams = new Set<string>();
      for (let i = 0; i < str.length - 1; i++) {
        bigrams.add(str.substring(i, i + 2));
      }
      return bigrams;
    };

    const bigrams1 = getBigrams(str1);
    const bigrams2 = getBigrams(str2);
    
    const intersection = new Set([...bigrams1].filter(x => bigrams2.has(x)));
    const union = new Set([...bigrams1, ...bigrams2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Get taxonomy statistics
   */
  getStats(): {
    totalMappings: number;
    totalCategories: number;
    totalAliases: number;
    totalSemanticTerms: number;
    totalDeprecatedMappings: number;
  } {
    const totalAliases = this.taxonomy.mappings.reduce((sum, m) => sum + m.aliases.length, 0);
    const totalSemanticTerms = this.taxonomy.mappings.reduce((sum, m) => sum + m.semanticTerms.length, 0);

    return {
      totalMappings: this.taxonomy.mappings.length,
      totalCategories: this.taxonomy.categories.length,
      totalAliases,
      totalSemanticTerms,
      totalDeprecatedMappings: this.taxonomy.deprecatedMappings.length
    };
  }

  /**
   * Validate the entire taxonomy for consistency
   */
  validateTaxonomy(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate official IDs
    const officialIds = this.taxonomy.mappings.map(m => m.officialId);
    const duplicateIds = officialIds.filter((id, index) => officialIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate official IDs found: ${duplicateIds.join(', ')}`);
    }

    // Check for overlapping aliases
    const allAliases = new Map<string, string[]>();
    this.taxonomy.mappings.forEach(mapping => {
      mapping.aliases.forEach(alias => {
        const existing = allAliases.get(alias) || [];
        existing.push(mapping.officialId);
        allAliases.set(alias, existing);
      });
    });

    allAliases.forEach((goalIds, alias) => {
      if (goalIds.length > 1) {
        warnings.push(`Alias "${alias}" maps to multiple goals: ${goalIds.join(', ')}`);
      }
    });

    // Check category references
    const categoryIds = new Set(this.taxonomy.categories.map(c => c.id));
    this.taxonomy.mappings.forEach(mapping => {
      if (!categoryIds.has(mapping.category)) {
        errors.push(`Goal "${mapping.officialId}" references unknown category: ${mapping.category}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Create singleton instance
export const goalTaxonomy = new GoalTaxonomyService();

// Export types and main service
export { GoalTaxonomyService };
export default goalTaxonomy;