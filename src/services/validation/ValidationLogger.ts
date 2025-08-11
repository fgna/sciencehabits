import { 
  LogEntry, 
  DataInconsistency, 
  CriticalError, 
  ContentWarning, 
  ValidationSummary,
  InconsistencyReport,
  ValidationConfig 
} from '../../types/validation';

export class ValidationLogger {
  private inconsistencies: DataInconsistency[] = [];
  private criticalErrors: CriticalError[] = [];
  private warnings: ContentWarning[] = [];
  private habitsCount = 0;
  private researchCount = 0;

  private config: ValidationConfig = {
    enableFileLogging: true,
    logDirectory: 'logs',
    failOnCriticalErrors: true,
    enableConsoleOutput: process.env.NODE_ENV === 'development',
    archiveLogs: true,
    maxLogFileSize: 10, // 10MB
    validGoalTags: [
      'reduce_stress', 'improve_sleep', 'boost_energy', 'enhance_focus',
      'build_confidence', 'improve_fitness', 'better_relationships',
      'increase_productivity', 'develop_mindfulness', 'learn_faster'
    ],
    requiredHabitFields: ['id', 'title', 'description', 'category'],
    requiredResearchFields: ['id', 'title', 'summary', 'year']
  };

  constructor(config?: Partial<ValidationConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  async logCriticalError(error: CriticalError): Promise<void> {
    this.criticalErrors.push(error);
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      category: error.type,
      message: error.message,
      details: error.details,
      severity: error.severity
    };

    await this.writeLogEntry(entry);
    
    if (this.config.enableConsoleOutput) {
      console.error(`🚨 Critical Error: ${error.type}`, error);
    }
  }

  async logDataInconsistency(inconsistency: DataInconsistency): Promise<void> {
    this.inconsistencies.push(inconsistency);
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARNING',
      category: inconsistency.type,
      habitId: inconsistency.habitId,
      researchId: inconsistency.researchId,
      message: inconsistency.message,
      details: inconsistency.details,
      severity: inconsistency.severity,
      impact: inconsistency.impact,
      suggestions: inconsistency.suggestions
    };

    await this.writeLogEntry(entry);
    await this.updateInconsistencyFile(inconsistency);
    
    if (this.config.enableConsoleOutput) {
      console.warn(`⚠️ Data Inconsistency: ${inconsistency.type}`, inconsistency);
    }
  }

  async logContentWarning(warning: ContentWarning): Promise<void> {
    this.warnings.push(warning);
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARNING',
      category: warning.category,
      message: warning.message,
      details: warning.details,
      severity: warning.severity
    };

    await this.writeLogEntry(entry);
    
    if (this.config.enableConsoleOutput) {
      console.info(`💡 Content Warning: ${warning.category}`, warning);
    }
  }

  async generateValidationSummary(): Promise<ValidationSummary> {
    const summary: ValidationSummary = {
      timestamp: new Date().toISOString(),
      buildId: process.env.BUILD_ID || process.env.NODE_ENV || 'development',
      totals: {
        habitsProcessed: this.habitsCount,
        researchProcessed: this.researchCount,
        criticalErrors: this.criticalErrors.length,
        inconsistencies: this.inconsistencies.length,
        warnings: this.warnings.length
      },
      inconsistencyBreakdown: this.categorizeInconsistencies(),
      topIssues: this.getTopIssues(),
      recommendations: this.generateRecommendations(),
      filesScan: {
        habitsFiles: 0, // TODO: Count actual files scanned
        researchFiles: 0,
        lastModified: new Date().toISOString()
      }
    };

    if (this.config.enableFileLogging) {
      await this.writeToFile('validation-summary.json', summary);
    }
    
    return summary;
  }

  async exportInconsistencyReport(): Promise<InconsistencyReport> {
    const report: InconsistencyReport = {
      generatedAt: new Date().toISOString(),
      missingResearch: this.getMissingResearchReport(),
      orphanedResearch: this.getOrphanedResearchReport(),
      goalTagIssues: this.getGoalTagIssuesReport(),
      duplicateIds: this.getDuplicateIdsReport()
    };

    if (this.config.enableFileLogging) {
      await this.writeToFile('data-inconsistencies.json', report);
    }

    return report;
  }

  setCounters(habitsCount: number, researchCount: number): void {
    this.habitsCount = habitsCount;
    this.researchCount = researchCount;
  }

  getValidationResults() {
    return {
      criticalErrors: this.criticalErrors,
      inconsistencies: this.inconsistencies,
      warnings: this.warnings,
      totals: {
        habitsProcessed: this.habitsCount,
        researchProcessed: this.researchCount,
        criticalErrors: this.criticalErrors.length,
        inconsistencies: this.inconsistencies.length,
        warnings: this.warnings.length
      }
    };
  }

  clearLogs(): void {
    this.inconsistencies = [];
    this.criticalErrors = [];
    this.warnings = [];
  }

  private async writeLogEntry(entry: LogEntry): Promise<void> {
    if (!this.config.enableFileLogging) return;

    const logLine = `${entry.timestamp} [${entry.level}] ${entry.category}: ${JSON.stringify({
      message: entry.message,
      habitId: entry.habitId,
      researchId: entry.researchId,
      severity: entry.severity,
      impact: entry.impact,
      suggestions: entry.suggestions,
      details: entry.details
    })}\n`;

    try {
      // In development/build environment, try to write to file system
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
        // For now, just log to console since we're in browser context
        // In a real implementation, this would write to the file system
        console.log(`[LOG] ${logLine.trim()}`);
      }
    } catch (error) {
      console.warn('Failed to write to log file:', error);
    }
  }

  private async updateInconsistencyFile(inconsistency: DataInconsistency): Promise<void> {
    // In a real implementation, this would update the structured inconsistency file
    // For now, we'll store it in memory and export it when requested
  }

  private async writeToFile(filename: string, data: any): Promise<void> {
    try {
      // In development, log structured data
      if (this.config.enableConsoleOutput) {
        console.log(`[${filename}]`, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.warn(`Failed to write ${filename}:`, error);
    }
  }

  private categorizeInconsistencies(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    this.inconsistencies.forEach(inconsistency => {
      breakdown[inconsistency.type] = (breakdown[inconsistency.type] || 0) + 1;
    });

    return breakdown;
  }

  private getTopIssues(): Array<{ type: string; count: number; impact: string }> {
    const breakdown = this.categorizeInconsistencies();
    
    return Object.entries(breakdown)
      .map(([type, count]) => ({
        type,
        count,
        impact: this.getImpactForType(type)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getImpactForType(type: string): string {
    const impactMap: Record<string, string> = {
      'MISSING_RESEARCH': 'Habits display without research evidence',
      'ORPHANED_RESEARCH': 'Research not discoverable through habits',
      'INVALID_GOAL_TAGS': 'Incorrect habit recommendations',
      'DUPLICATE_IDS': 'Data conflicts and unpredictable behavior',
      'MISSING_REQUIRED_FIELDS': 'Component rendering errors'
    };

    return impactMap[type] || 'Unknown impact';
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.criticalErrors.length > 0) {
      recommendations.push('🚨 Fix critical errors before deployment');
    }

    const missingResearchCount = this.inconsistencies.filter(i => i.type === 'MISSING_RESEARCH').length;
    if (missingResearchCount > 0) {
      recommendations.push(`📚 Add research articles for ${missingResearchCount} habits`);
    }

    const orphanedResearchCount = this.inconsistencies.filter(i => i.type === 'ORPHANED_RESEARCH').length;
    if (orphanedResearchCount > 0) {
      recommendations.push(`🔗 Link ${orphanedResearchCount} orphaned research articles to habits`);
    }

    if (this.warnings.length > 5) {
      recommendations.push('📝 Review content quality warnings');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Content validation passed with no major issues');
    }

    return recommendations;
  }

  private getMissingResearchReport(): InconsistencyReport['missingResearch'] {
    return this.inconsistencies
      .filter(i => i.type === 'MISSING_RESEARCH')
      .map(i => ({
        habitId: i.habitId || '',
        habitTitle: i.details?.habitTitle || 'Unknown',
        missingIds: i.details?.missingResearchIds || [],
        sourceFile: i.sourceFile || 'unknown',
        recommendation: i.suggestions[0] || 'Add missing research articles'
      }));
  }

  private getOrphanedResearchReport(): InconsistencyReport['orphanedResearch'] {
    return this.inconsistencies
      .filter(i => i.type === 'ORPHANED_RESEARCH')
      .map(i => ({
        researchId: i.researchId || '',
        title: i.details?.title || 'Unknown',
        recommendation: i.suggestions[0] || 'Link to relevant habits'
      }));
  }

  private getGoalTagIssuesReport(): InconsistencyReport['goalTagIssues'] {
    return this.inconsistencies
      .filter(i => i.type === 'INVALID_GOAL_TAGS')
      .map(i => ({
        habitId: i.habitId || '',
        invalidTags: i.details?.invalidTags || [],
        recommendation: i.suggestions[0] || 'Use valid goal tags'
      }));
  }

  private getDuplicateIdsReport(): InconsistencyReport['duplicateIds'] {
    return this.inconsistencies
      .filter(i => i.type === 'DUPLICATE_IDS')
      .map(i => ({
        id: i.details?.duplicateId || '',
        files: i.details?.files || [],
        type: i.details?.type || 'unknown'
      }));
  }
}