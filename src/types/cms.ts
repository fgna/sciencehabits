/**
 * Content Management System Types
 * 
 * Type definitions for the dynamic CMS architecture supporting
 * multi-language content, research validation, and admin management.
 */

// Admin Authentication Types
export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'content_moderator' | 'research_validator';
  permissions: Permission[];
  lastLogin: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  resource: 'habits' | 'research' | 'translations' | 'users' | 'system';
  actions: ('create' | 'read' | 'update' | 'delete' | 'publish')[];
}

export interface AuthResult {
  success: boolean;
  user?: AdminUser;
  token?: string;
  error?: string;
  expiresAt?: Date;
}

// Localized Content Types
export interface LocalizedField<T> {
  en: T;
  de?: T;
  fallbackUsed?: boolean;
}

export interface CMSHabit {
  id: string;
  title: LocalizedField<string>;
  description: LocalizedField<string>;
  instructions: LocalizedField<string | string[]>;
  timeMinutes: number;
  category: string;
  goalTags: string[];
  researchStudies: string[]; // IDs of related research
  status: 'published' | 'draft' | 'review' | 'archived';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin user ID
  lastModifiedBy: string; // Admin user ID
  version: number;
}

export interface CMSResearchStudy {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi?: string;
  summary: LocalizedField<string>;
  finding: LocalizedField<string>;
  citation: string;
  category: string;
  evidenceLevel: 'systematic_review' | 'rct' | 'observational' | 'case_study';
  qualityScore: number; // 0-100
  validatedAt: Date;
  citationStatus: 'valid' | 'outdated' | 'retracted' | 'pending';
  relatedStudies: string[]; // IDs of related research
  status: 'published' | 'draft' | 'review' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  version: number;
}

// Enhanced Research Validation Types
export interface EnhancedResearchStudy extends CMSResearchStudy {
  validationHistory: ValidationEvent[];
  lastValidated: Date;
  validationNotes?: string;
}

export interface ValidationEvent {
  id: string;
  studyId: string;
  type: 'citation_check' | 'doi_validation' | 'retraction_check' | 'quality_assessment';
  status: 'passed' | 'failed' | 'warning';
  message: string;
  performedAt: Date;
  performedBy: string; // 'system' or admin user ID
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    doi?: string;
    citationCount?: number;
    journalImpactFactor?: number;
    isRetracted?: boolean;
    lastChecked?: Date;
  };
}

// Multi-language Support Types
export interface LocalizedContent {
  habits: CMSHabit[];
  research: CMSResearchStudy[];
  untranslatedContent: UntranslatedItem[];
  metadata: {
    language: string;
    version: string;
    lastUpdated: Date;
    translationCompleteness: number; // 0-100%
  };
}

export interface UntranslatedItem {
  contentType: 'habit' | 'research';
  contentId: string;
  title: string;
  missingFields: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface TranslationWarning {
  contentType: 'habit' | 'research';
  contentId: string;
  missingFields: string[];
  fallbackUsed: boolean;
  originalLanguage: string;
}

// JSON Workflow Types
export interface UploadResult {
  success: boolean;
  uploadId: string;
  fileName: string;
  recordCount: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  duplicates?: DuplicateReport;
}

export interface ValidationError {
  row?: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  row?: number;
  field?: string;
  message: string;
  suggestion?: string;
}

export interface DuplicateReport {
  exactDuplicates: DuplicateMatch[];
  likelyDuplicates: DuplicateMatch[];
  suspiciousMatches: DuplicateMatch[];
  conflicts: ConflictReport[];
}

export interface DuplicateMatch {
  existingId: string;
  existingTitle: string;
  newIndex: number;
  newTitle: string;
  matchType: 'exact' | 'likely' | 'suspicious';
  confidence: number; // 0-100%
  matchingFields: string[];
  suggestedResolution: 'merge' | 'skip' | 'keep_both' | 'review_needed';
}

export interface ConflictReport {
  field: string;
  existingValue: any;
  newValue: any;
  recommendation: string;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  createdIds: string[];
  updatedIds: string[];
  errors: ValidationError[];
  duplicatesHandled: DuplicateResolution[];
}

export interface DuplicateResolution {
  duplicateId: string;
  resolution: 'merged' | 'skipped' | 'kept_both';
  resultingId?: string;
}

export interface ExportResult {
  success: boolean;
  contentType: 'habits' | 'research' | 'all';
  recordCount: number;
  exportedAt: Date;
  version: string;
  downloadUrl?: string;
}

export interface ChangePreview {
  additions: PreviewItem[];
  modifications: PreviewItem[];
  deletions: PreviewItem[];
  duplicates: DuplicateMatch[];
  summary: {
    totalChanges: number;
    potentialIssues: number;
    requiresReview: boolean;
  };
}

export interface PreviewItem {
  id: string;
  title: string;
  type: 'habit' | 'research';
  changeType: 'create' | 'update' | 'delete';
  changes?: { field: string; oldValue: any; newValue: any }[];
}

// Content Version Management
export interface ContentSnapshot {
  id: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  version: string;
  contentCounts: {
    habits: number;
    research: number;
  };
  checksum: string;
}

export interface SnapshotResult {
  success: boolean;
  snapshotId: string;
  error?: string;
}

export interface RollbackResult {
  success: boolean;
  restoredVersion: string;
  affectedRecords: number;
  error?: string;
}

export interface ComparisonResult {
  differences: ContentDifference[];
  summary: {
    added: number;
    modified: number;
    deleted: number;
  };
}

export interface ContentDifference {
  type: 'added' | 'modified' | 'deleted';
  contentType: 'habit' | 'research';
  id: string;
  title: string;
  changes?: { field: string; oldValue: any; newValue: any }[];
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Search and Filter Types
export interface ContentFilter {
  status?: ('published' | 'draft' | 'review' | 'archived')[];
  category?: string[];
  language?: string;
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  facets: {
    categories: { name: string; count: number }[];
    statuses: { name: string; count: number }[];
    authors: { name: string; count: number }[];
  };
}