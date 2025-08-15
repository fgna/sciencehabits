import { 
  SupportedLanguage, 
  QualityWarning, 
  TranslationMetadata 
} from '../../types/i18n';
import { translationMetadataService } from './TranslationMetadataService';

interface QualityAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  fileId: string;
  language: SupportedLanguage;
  contentType: 'habit' | 'research' | 'ui';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  actions: Array<{
    label: string;
    action: string;
    params?: Record<string, any>;
  }>;
}

interface QualityRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high';
  languages: SupportedLanguage[];
  contentTypes: ('habit' | 'research' | 'ui')[];
  check: (content: any, metadata: TranslationMetadata) => QualityWarning[];
}

interface QualityReport {
  generatedAt: string;
  totalTranslations: number;
  totalWarnings: number;
  warningsByLanguage: Record<SupportedLanguage, number>;
  warningsBySeverity: Record<string, number>;
  warningsByType: Record<string, number>;
  topIssues: Array<{
    type: string;
    count: number;
    severity: string;
    examples: string[];
  }>;
  recommendations: string[];
}

/**
 * QualityWarningService provides admin oversight and quality control
 * for the immediate publishing translation strategy
 */
export class QualityWarningService {
  private alerts: Map<string, QualityAlert> = new Map();
  private rules: Map<string, QualityRule> = new Map();
  private readonly storageKey = 'sciencehabits_quality_alerts';

  constructor() {
    this.initializeDefaultRules();
    this.loadAlertsFromStorage();
  }

  /**
   * Process translation and generate quality alerts
   */
  async processTranslation(
    content: any,
    metadata: TranslationMetadata
  ): Promise<QualityAlert[]> {
    console.log(`🔍 Quality checking ${metadata.fileId}`);

    const alerts: QualityAlert[] = [];
    const contentType = this.getContentTypeFromMetadata(metadata);
    const language = this.getLanguageFromMetadata(metadata);

    // Run all applicable quality rules
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      if (!rule.languages.includes(language)) continue;
      if (!rule.contentTypes.includes(contentType)) continue;

      try {
        const warnings = rule.check(content, metadata);
        
        for (const warning of warnings) {
          const alert = this.createAlertFromWarning(warning, metadata, rule);
          alerts.push(alert);
          this.alerts.set(alert.id, alert);
        }
      } catch (error) {
        console.error(`Quality rule ${rule.id} failed:`, error);
      }
    }

    // Generate alerts from existing metadata warnings
    if (metadata.qualityWarnings) {
      for (const warning of metadata.qualityWarnings) {
        const alert = this.createAlertFromWarning(warning, metadata);
        alerts.push(alert);
        this.alerts.set(alert.id, alert);
      }
    }

    await this.saveAlertsToStorage();
    
    if (alerts.length > 0) {
      console.log(`⚠️ Generated ${alerts.length} quality alerts for ${metadata.fileId}`);
    }

    return alerts;
  }

  /**
   * Get all active quality alerts
   */
  getActiveAlerts(): QualityAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolvedAt);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): QualityAlert[] {
    return this.getActiveAlerts().filter(alert => alert.severity === severity);
  }

  /**
   * Get alerts by language
   */
  getAlertsByLanguage(language: SupportedLanguage): QualityAlert[] {
    return this.getActiveAlerts().filter(alert => alert.language === language);
  }

  /**
   * Get critical alerts that need immediate attention
   */
  getCriticalAlerts(): QualityAlert[] {
    return this.getAlertsBySeverity('critical');
  }

  /**
   * Get high priority alerts
   */
  getHighPriorityAlerts(): QualityAlert[] {
    return this.getActiveAlerts().filter(alert => 
      alert.severity === 'critical' || alert.severity === 'high'
    );
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy: string, notes?: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    const resolvedAlert: QualityAlert = {
      ...alert,
      resolvedAt: new Date().toISOString(),
      resolvedBy,
      message: notes ? `${alert.message}\n\nResolution: ${notes}` : alert.message
    };

    this.alerts.set(alertId, resolvedAlert);
    await this.saveAlertsToStorage();
    
    console.log(`✅ Resolved alert ${alertId} by ${resolvedBy}`);
  }

  /**
   * Bulk resolve alerts by criteria
   */
  async bulkResolveAlerts(
    criteria: {
      language?: SupportedLanguage;
      severity?: string;
      type?: string;
      fileIds?: string[];
    },
    resolvedBy: string
  ): Promise<number> {
    let resolvedCount = 0;
    
    for (const alert of this.getActiveAlerts()) {
      let shouldResolve = true;
      
      if (criteria.language && alert.language !== criteria.language) {
        shouldResolve = false;
      }
      
      if (criteria.severity && alert.severity !== criteria.severity) {
        shouldResolve = false;
      }
      
      if (criteria.type && alert.type !== criteria.type) {
        shouldResolve = false;
      }
      
      if (criteria.fileIds && !criteria.fileIds.includes(alert.fileId)) {
        shouldResolve = false;
      }
      
      if (shouldResolve) {
        await this.resolveAlert(alert.id, resolvedBy);
        resolvedCount++;
      }
    }
    
    console.log(`✅ Bulk resolved ${resolvedCount} alerts`);
    return resolvedCount;
  }

  /**
   * Generate quality report
   */
  generateQualityReport(): QualityReport {
    const allMetadata = translationMetadataService.getAllMetadata();
    const activeAlerts = this.getActiveAlerts();
    
    const report: QualityReport = {
      generatedAt: new Date().toISOString(),
      totalTranslations: allMetadata.length,
      totalWarnings: activeAlerts.length,
      warningsByLanguage: this.countAlertsByLanguage(activeAlerts),
      warningsBySeverity: this.countAlertsBySeverity(activeAlerts),
      warningsByType: this.countAlertsByType(activeAlerts),
      topIssues: this.getTopIssues(activeAlerts),
      recommendations: this.generateRecommendations(activeAlerts, allMetadata)
    };
    
    return report;
  }

  /**
   * Add custom quality rule
   */
  addQualityRule(rule: QualityRule): void {
    this.rules.set(rule.id, rule);
    console.log(`➕ Added quality rule: ${rule.name}`);
  }

  /**
   * Remove quality rule
   */
  removeQualityRule(ruleId: string): void {
    this.rules.delete(ruleId);
    console.log(`➖ Removed quality rule: ${ruleId}`);
  }

  /**
   * Enable/disable quality rule
   */
  toggleQualityRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      console.log(`${enabled ? '✅' : '❌'} ${enabled ? 'Enabled' : 'Disabled'} quality rule: ${rule.name}`);
    }
  }

  /**
   * Get all quality rules
   */
  getQualityRules(): QualityRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Export quality data for analysis
   */
  exportQualityData(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      alerts: Array.from(this.alerts.entries()),
      rules: Array.from(this.rules.entries()),
      report: this.generateQualityReport()
    };
    
    return JSON.stringify(data, null, 2);
  }

  // Private helper methods

  private initializeDefaultRules(): void {
    // Low confidence rule
    this.addQualityRule({
      id: 'low_confidence',
      name: 'Low Translation Confidence',
      description: 'Flags translations with confidence below 70%',
      enabled: true,
      severity: 'medium',
      languages: ['en', 'de', 'fr', 'es'],
      contentTypes: ['habit', 'research', 'ui'],
      check: (content: any, metadata: TranslationMetadata) => {
        const warnings: QualityWarning[] = [];
        if (metadata.confidence !== undefined && metadata.confidence < 70) {
          warnings.push({
            type: 'low_confidence',
            severity: metadata.confidence < 50 ? 'high' : 'medium',
            message: `Translation confidence is ${metadata.confidence}%`,
            suggestion: 'Consider manual review or retranslation'
          });
        }
        return warnings;
      }
    });

    // Medical terminology rule
    this.addQualityRule({
      id: 'medical_terminology',
      name: 'Medical Terminology Check',
      description: 'Flags content with medical terms that may need expert review',
      enabled: true,
      severity: 'high',
      languages: ['de', 'fr', 'es'],
      contentTypes: ['habit', 'research'],
      check: (content: any, metadata: TranslationMetadata) => {
        const warnings: QualityWarning[] = [];
        const medicalTerms = ['dosage', 'supplement', 'vitamin', 'mineral', 'therapy', 'treatment'];
        const contentText = JSON.stringify(content).toLowerCase();
        
        const foundTerms = medicalTerms.filter(term => contentText.includes(term));
        if (foundTerms.length > 0) {
          warnings.push({
            type: 'medical_terminology',
            severity: 'high',
            message: `Medical terms detected: ${foundTerms.join(', ')}`,
            suggestion: 'Verify medical terminology accuracy with subject matter expert'
          });
        }
        return warnings;
      }
    });

    // Cultural context rule
    this.addQualityRule({
      id: 'cultural_context',
      name: 'Cultural Context Check',
      description: 'Flags content that may need cultural adaptation',
      enabled: true,
      severity: 'medium',
      languages: ['de', 'fr', 'es'],
      contentTypes: ['habit', 'research'],
      check: (content: any, metadata: TranslationMetadata) => {
        const warnings: QualityWarning[] = [];
        const culturalFlags = ['american', 'us-specific', 'fda', 'dollar', '$'];
        const contentText = JSON.stringify(content).toLowerCase();
        
        const foundFlags = culturalFlags.filter(flag => contentText.includes(flag));
        if (foundFlags.length > 0) {
          warnings.push({
            type: 'cultural_context',
            severity: 'medium',
            message: `Cultural adaptation may be needed for: ${foundFlags.join(', ')}`,
            suggestion: 'Review for local cultural context and regulations'
          });
        }
        return warnings;
      }
    });

    // Missing translation rule
    this.addQualityRule({
      id: 'missing_translation',
      name: 'Missing Translation Check',
      description: 'Flags content that appears to be untranslated',
      enabled: true,
      severity: 'high',
      languages: ['de', 'fr', 'es'],
      contentTypes: ['habit', 'research', 'ui'],
      check: (content: any, metadata: TranslationMetadata) => {
        const warnings: QualityWarning[] = [];
        const contentText = JSON.stringify(content);
        
        // Simple check for English text in non-English translations
        // This is a basic heuristic - real implementation would be more sophisticated
        const englishPatterns = [
          /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi,
          /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi,
          /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi
        ];
        
        const targetLanguage = this.getLanguageFromMetadata(metadata);
        if (targetLanguage !== 'en') {
          const englishWordCount = englishPatterns.reduce((count, pattern) => {
            const matches = contentText.match(pattern);
            return count + (matches ? matches.length : 0);
          }, 0);
          
          if (englishWordCount > 5) {
            warnings.push({
              type: 'missing_translation',
              severity: 'high',
              message: `Possible untranslated English text detected`,
              suggestion: 'Review translation completeness'
            });
          }
        }
        
        return warnings;
      }
    });
  }

  private createAlertFromWarning(
    warning: QualityWarning,
    metadata: TranslationMetadata,
    rule?: QualityRule
  ): QualityAlert {
    const alertId = `${metadata.fileId}_${warning.type}_${Date.now()}`;
    const language = this.getLanguageFromMetadata(metadata);
    const contentType = this.getContentTypeFromMetadata(metadata);

    return {
      id: alertId,
      type: warning.severity === 'high' ? 'error' : 'warning',
      severity: warning.severity,
      title: rule ? rule.name : `${warning.type} Warning`,
      message: warning.message,
      fileId: metadata.fileId,
      language,
      contentType,
      createdAt: new Date().toISOString(),
      actions: this.generateActions(warning, metadata)
    };
  }

  private generateActions(
    warning: QualityWarning,
    metadata: TranslationMetadata
  ): Array<{ label: string; action: string; params?: Record<string, any> }> {
    const actions = [
      {
        label: 'Mark as Reviewed',
        action: 'mark_reviewed',
        params: { fileId: metadata.fileId }
      },
      {
        label: 'Flag for Expert Review',
        action: 'flag_translation',
        params: { fileId: metadata.fileId, reason: warning.message }
      }
    ];

    if (warning.type === 'low_confidence') {
      actions.push({
        label: 'Retranslate',
        action: 'retranslate',
        params: { fileId: metadata.fileId }
      });
    }

    if (warning.type === 'medical_terminology') {
      actions.push({
        label: 'Request Medical Review',
        action: 'request_medical_review',
        params: { fileId: metadata.fileId }
      });
    }

    return actions;
  }

  private getLanguageFromMetadata(metadata: TranslationMetadata): SupportedLanguage {
    const match = metadata.targetFile.match(/\/([a-z]{2})\.json$/);
    return (match ? match[1] : 'en') as SupportedLanguage;
  }

  private getContentTypeFromMetadata(metadata: TranslationMetadata): 'habit' | 'research' | 'ui' {
    if (metadata.sourceFile.includes('habits/')) return 'habit';
    if (metadata.sourceFile.includes('research/')) return 'research';
    return 'ui';
  }

  private countAlertsByLanguage(alerts: QualityAlert[]): Record<SupportedLanguage, number> {
    const counts: Record<SupportedLanguage, number> = { en: 0, de: 0, fr: 0, es: 0 };
    alerts.forEach(alert => counts[alert.language]++);
    return counts;
  }

  private countAlertsBySeverity(alerts: QualityAlert[]): Record<string, number> {
    const counts: Record<string, number> = {};
    alerts.forEach(alert => {
      counts[alert.severity] = (counts[alert.severity] || 0) + 1;
    });
    return counts;
  }

  private countAlertsByType(alerts: QualityAlert[]): Record<string, number> {
    const counts: Record<string, number> = {};
    alerts.forEach(alert => {
      counts[alert.type] = (counts[alert.type] || 0) + 1;
    });
    return counts;
  }

  private getTopIssues(alerts: QualityAlert[]): Array<{
    type: string;
    count: number;
    severity: string;
    examples: string[];
  }> {
    const issueMap = new Map<string, {
      count: number;
      severity: string;
      examples: string[];
    }>();

    alerts.forEach(alert => {
      const key = alert.type;
      if (!issueMap.has(key)) {
        issueMap.set(key, {
          count: 0,
          severity: alert.severity,
          examples: []
        });
      }
      
      const issue = issueMap.get(key)!;
      issue.count++;
      if (issue.examples.length < 3) {
        issue.examples.push(alert.fileId);
      }
    });

    return Array.from(issueMap.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private generateRecommendations(
    alerts: QualityAlert[],
    allMetadata: TranslationMetadata[]
  ): string[] {
    const recommendations: string[] = [];
    
    const highPriorityCount = alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length;
    if (highPriorityCount > 0) {
      recommendations.push(`Address ${highPriorityCount} high priority quality issues immediately`);
    }

    const medicalAlerts = alerts.filter(a => a.title.includes('Medical Terminology')).length;
    if (medicalAlerts > 5) {
      recommendations.push('Consider establishing medical expert review process');
    }

    const lowConfidenceCount = alerts.filter(a => a.title.includes('Low Translation Confidence')).length;
    if (lowConfidenceCount > allMetadata.length * 0.2) {
      recommendations.push('Translation confidence is low - consider improving translation prompts');
    }

    const unreviewed = allMetadata.filter(m => m.reviewStatus === 'unreviewed').length;
    if (unreviewed > 50) {
      recommendations.push('Large backlog of unreviewed translations - consider adding reviewers');
    }

    return recommendations;
  }

  private async loadAlertsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        if (Array.isArray(data)) {
          this.alerts.clear();
          data.forEach(([alertId, alert]: [string, QualityAlert]) => {
            this.alerts.set(alertId, alert);
          });
          console.log(`📚 Loaded ${this.alerts.size} quality alerts`);
        }
      }
    } catch (error) {
      console.warn('Failed to load quality alerts from storage:', error);
    }
  }

  private async saveAlertsToStorage(): Promise<void> {
    try {
      const data = Array.from(this.alerts.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save quality alerts to storage:', error);
    }
  }
}

// Create singleton instance
export const qualityWarningService = new QualityWarningService();