import { Habit, ResearchArticle, ResearchStudy } from './index';

export interface ContentFile {
  path: string;
  category: string;
  type: 'habit' | 'research';
  data: any;
  loadedAt: string;
}

export interface ValidationError {
  type: 'error';
  severity: 'critical' | 'high' | 'medium';
  message: string;
  file: string;
  itemId?: string;
  field?: string;
  details?: Record<string, any>;
}

export interface ValidationWarning {
  type: 'warning';
  message: string;
  file: string;
  itemId?: string;
  field?: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    totalHabits: number;
    totalResearch: number;
    filesLoaded: string[];
    duplicatesFound: number;
    processingTime: number;
  };
}

export interface ContentLoadResult {
  habits: Habit[];
  research: ResearchArticle[];
  validation: ValidationResult;
  loadedFiles: ContentFile[];
}

export interface ContentLoaderConfig {
  validateContent: boolean;
  hotReload: boolean;
  debugLogging: boolean;
  failOnValidationError: boolean;
  maxFileSize: number; // bytes
}

// Content discovery interfaces
export interface DiscoveredContent {
  coreFiles: {
    habits: string[];
    research: string[];
    goals: string;
  };
  modularFiles: {
    habits: string[];
    research: string[];
  };
  customFiles: {
    habits: string[];
    research: string[];
  };
}

// Validation schema interfaces
export interface HabitValidationSchema {
  requiredFields: (keyof Habit)[];
  allowedCategories: string[];
  allowedTimeMinutes: number[];
  allowedDifficulties: string[];
}

export interface ResearchValidationSchema {
  requiredFields: (keyof ResearchArticle)[];
  allowedCategories: string[];
  allowedDifficulties: string[];
  allowedEvidenceLevels: string[];
}