// Content validation types and interfaces

export interface ValidationError {
  type: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  sourceFile?: string;
  lineNumber?: number;
  details?: Record<string, any>;
}

export interface CriticalError extends ValidationError {
  severity: 'critical';
  blocksBuild: true;
}

export interface DataInconsistency extends ValidationError {
  habitId?: string;
  researchId?: string;
  impact: string;
  suggestions: string[];
}

export interface ContentWarning extends ValidationError {
  severity: 'low';
  category: 'incomplete_data' | 'content_quality' | 'missing_connections';
}

export interface ValidationResult {
  success: boolean;
  timestamp: string;
  buildId?: string;
  totals: {
    habitsProcessed: number;
    researchProcessed: number;
    criticalErrors: number;
    inconsistencies: number;
    warnings: number;
  };
  criticalErrors: CriticalError[];
  inconsistencies: DataInconsistency[];
  warnings: ContentWarning[];
  enrichedHabits?: HabitWithResearch[];
  orphanedResearch?: string[];
}

export interface HabitWithResearch {
  id: string;
  title: string;
  description: string;
  timeMinutes: number;
  category: string;
  goalTags: string[];
  instructions: string | string[];
  researchIds: string[];
  isCustom: boolean;
  difficulty: string;
  availableResearch: any[]; // ResearchStudy[]
  missingResearchIds: string[];
  hasCompleteResearch: boolean;
  validationStatus: 'complete' | 'partial' | 'missing_research';
}

export interface ValidationSummary {
  timestamp: string;
  buildId?: string;
  totals: {
    habitsProcessed: number;
    researchProcessed: number;
    criticalErrors: number;
    inconsistencies: number;
    warnings: number;
  };
  inconsistencyBreakdown: Record<string, number>;
  topIssues: Array<{
    type: string;
    count: number;
    impact: string;
  }>;
  recommendations: string[];
  filesScan: {
    habitsFiles: number;
    researchFiles: number;
    lastModified: string;
  };
}

export interface LogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG';
  category: string;
  habitId?: string;
  researchId?: string;
  message: string;
  details?: Record<string, any>;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  impact?: string;
  suggestions?: string[];
}

export interface InconsistencyReport {
  generatedAt: string;
  missingResearch: Array<{
    habitId: string;
    habitTitle: string;
    missingIds: string[];
    sourceFile: string;
    recommendation: string;
  }>;
  orphanedResearch: Array<{
    researchId: string;
    title: string;
    recommendation: string;
  }>;
  goalTagIssues: Array<{
    habitId: string;
    invalidTags: string[];
    recommendation: string;
  }>;
  duplicateIds: Array<{
    id: string;
    files: string[];
    type: 'habit' | 'research';
  }>;
}

export type ValidationCategory = 
  | 'MISSING_RESEARCH'
  | 'ORPHANED_RESEARCH'
  | 'INVALID_GOAL_TAGS'
  | 'DUPLICATE_IDS'
  | 'MISSING_REQUIRED_FIELDS'
  | 'INVALID_DATA_TYPES'
  | 'CIRCULAR_REFERENCES'
  | 'CONTENT_QUALITY';

export interface ValidationConfig {
  enableFileLogging: boolean;
  logDirectory: string;
  failOnCriticalErrors: boolean;
  enableConsoleOutput: boolean;
  archiveLogs: boolean;
  maxLogFileSize: number; // in MB
  validGoalTags: string[];
  requiredHabitFields: string[];
  requiredResearchFields: string[];
}