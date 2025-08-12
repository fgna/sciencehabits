/**
 * Content Management System Services
 * 
 * Export all CMS-related services for easy importing throughout the application.
 */

export { AdminAuthService } from './AdminAuthService';
export { ContentManager } from './ContentManager';
export { JSONWorkflowService } from './JSONWorkflowService';
export { I18nContentLoader } from './I18nContentLoader';
export { ResearchValidator } from './ResearchValidator';

// Re-export CMS types for convenience
export type {
  AdminUser,
  AuthResult,
  Permission,
  CMSHabit,
  CMSResearchStudy,
  LocalizedContent,
  LocalizedField,
  UntranslatedItem,
  TranslationWarning,
  UploadResult,
  ValidationError,
  ValidationWarning,
  DuplicateReport,
  DuplicateMatch,
  ImportResult,
  ExportResult,
  ValidationResult,
  EnhancedResearchStudy
} from '../../types/cms';