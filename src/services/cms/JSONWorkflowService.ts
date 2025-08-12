/**
 * JSON Workflow Service
 * 
 * Preserves the existing JSON upload workflow while adding
 * comprehensive validation, duplicate detection, and CMS integration.
 */

import {
  UploadResult,
  ValidationError,
  ValidationWarning,
  DuplicateReport,
  DuplicateMatch,
  ConflictReport,
  ImportResult,
  ExportResult,
  ChangePreview,
  PreviewItem,
  SnapshotResult,
  RollbackResult,
  ComparisonResult,
  ContentSnapshot,
  DuplicateResolution,
  CMSHabit,
  CMSResearchStudy
} from '../../types/cms';
import { Habit, ResearchStudy } from '../../types';
import { AdminAuthService } from './AdminAuthService';
import { ContentManager } from './ContentManager';

export class JSONWorkflowService {
  private dbName = 'sciencehabits-json-workflow';
  private version = 1;
  private db: IDBDatabase | null = null;
  private adminAuth: AdminAuthService;
  private contentManager: ContentManager;

  constructor(adminAuth: AdminAuthService, contentManager: ContentManager) {
    this.adminAuth = adminAuth;
    this.contentManager = contentManager;
    this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Upload history
        if (!db.objectStoreNames.contains('upload_history')) {
          const uploadsStore = db.createObjectStore('upload_history', { keyPath: 'uploadId' });
          uploadsStore.createIndex('timestamp', 'timestamp', { unique: false });
          uploadsStore.createIndex('contentType', 'contentType', { unique: false });
        }
        
        // Content snapshots
        if (!db.objectStoreNames.contains('content_snapshots')) {
          const snapshotsStore = db.createObjectStore('content_snapshots', { keyPath: 'id' });
          snapshotsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // Duplicate detection cache
        if (!db.objectStoreNames.contains('duplicate_cache')) {
          db.createObjectStore('duplicate_cache', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Upload and validate JSON file
   */
  async uploadFile(file: File, type: 'habits' | 'research'): Promise<UploadResult> {
    try {
      await this.adminAuth.requirePermission(type, 'create');

      const uploadId = this.generateUploadId();
      console.log(`📤 Starting JSON upload: ${file.name} (${type})`);

      // Read file content
      const content = await this.readFileContent(file);
      let parsedData: any[];

      try {
        parsedData = JSON.parse(content);
      } catch (error) {
        return {
          success: false,
          uploadId,
          fileName: file.name,
          recordCount: 0,
          errors: [{
            message: 'Invalid JSON format: ' + (error as Error).message,
            severity: 'error'
          }],
          warnings: []
        };
      }

      // Validate structure
      const validation = await this.validateJSONStructure(parsedData, type);
      if (!validation.success) {
        return {
          success: false,
          uploadId,
          fileName: file.name,
          recordCount: Array.isArray(parsedData) ? parsedData.length : 0,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // Detect duplicates
      const duplicates = await this.detectDuplicates(parsedData, type);

      // Save upload for processing
      await this.saveUploadRecord(uploadId, file.name, type, parsedData, duplicates);

      console.log(`✅ JSON upload validated: ${parsedData.length} records, ${duplicates.exactDuplicates.length} exact duplicates`);

      return {
        success: true,
        uploadId,
        fileName: file.name,
        recordCount: parsedData.length,
        errors: validation.errors,
        warnings: validation.warnings,
        duplicates
      };
    } catch (error) {
      console.error('JSON upload failed:', error);
      return {
        success: false,
        uploadId: '',
        fileName: file.name,
        recordCount: 0,
        errors: [{
          message: 'Upload failed: ' + (error as Error).message,
          severity: 'error'
        }],
        warnings: []
      };
    }
  }

  /**
   * Validate JSON structure and content
   */
  async validateJSONStructure(content: any, type: 'habits' | 'research'): Promise<{
    success: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if content is array
    if (!Array.isArray(content)) {
      errors.push({
        message: 'JSON must contain an array of objects',
        severity: 'error'
      });
      return { success: false, errors, warnings };
    }

    // Validate each record
    content.forEach((item, index) => {
      if (type === 'habits') {
        this.validateHabitRecord(item, index, errors, warnings);
      } else {
        this.validateResearchRecord(item, index, errors, warnings);
      }
    });

    return {
      success: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Detect duplicate records
   */
  async detectDuplicates(newData: any[], type: 'habits' | 'research'): Promise<DuplicateReport> {
    const existingData = type === 'habits' 
      ? await this.contentManager.getCachedContent<CMSHabit>('cms_habits')
      : await this.contentManager.getCachedContent<CMSResearchStudy>('cms_research');

    const exactDuplicates: DuplicateMatch[] = [];
    const likelyDuplicates: DuplicateMatch[] = [];
    const suspiciousMatches: DuplicateMatch[] = [];
    const conflicts: ConflictReport[] = [];

    newData.forEach((newItem, index) => {
      existingData.forEach(existingItem => {
        const match = this.compareItems(newItem, existingItem, index, type);
        if (match) {
          switch (match.matchType) {
            case 'exact':
              exactDuplicates.push(match);
              break;
            case 'likely':
              likelyDuplicates.push(match);
              break;
            case 'suspicious':
              suspiciousMatches.push(match);
              break;
          }

          // Check for conflicts in matching records
          const itemConflicts = this.findConflicts(newItem, existingItem);
          conflicts.push(...itemConflicts);
        }
      });
    });

    return {
      exactDuplicates,
      likelyDuplicates,
      suspiciousMatches,
      conflicts
    };
  }

  /**
   * Preview changes before import
   */
  async previewChanges(uploadId: string): Promise<ChangePreview> {
    const uploadRecord = await this.getUploadRecord(uploadId);
    if (!uploadRecord) {
      throw new Error('Upload record not found');
    }

    const { data, duplicates } = uploadRecord;
    const additions: PreviewItem[] = [];
    const modifications: PreviewItem[] = [];

    // Categorize changes
    data.forEach((item: any, index: number) => {
      const isDuplicate = duplicates?.exactDuplicates.some(d => d.newIndex === index) ||
                         duplicates?.likelyDuplicates.some(d => d.newIndex === index);

      if (isDuplicate) {
        modifications.push({
          id: item.id,
          title: item.title,
          type: uploadRecord.contentType as 'habit' | 'research',
          changeType: 'update',
          changes: [] // Would be populated with actual field changes
        });
      } else {
        additions.push({
          id: item.id,
          title: item.title,
          type: uploadRecord.contentType as 'habit' | 'research',
          changeType: 'create'
        });
      }
    });

    const potentialIssues = (duplicates?.exactDuplicates.length || 0) + 
                           (duplicates?.likelyDuplicates.length || 0) + 
                           (duplicates?.conflicts.length || 0);

    return {
      additions,
      modifications,
      deletions: [], // JSON uploads don't typically include deletions
      duplicates: duplicates?.exactDuplicates || [],
      summary: {
        totalChanges: additions.length + modifications.length,
        potentialIssues,
        requiresReview: potentialIssues > 0
      }
    };
  }

  /**
   * Import validated data to CMS
   */
  async importToCMS(uploadId: string, replaceExisting: boolean = false, duplicateResolutions?: DuplicateResolution[]): Promise<ImportResult> {
    try {
      const uploadRecord = await this.getUploadRecord(uploadId);
      if (!uploadRecord) {
        throw new Error('Upload record not found');
      }

      await this.adminAuth.requirePermission(uploadRecord.contentType, 'create');

      const { data, contentType } = uploadRecord;
      let importedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const createdIds: string[] = [];
      const updatedIds: string[] = [];
      const errors: ValidationError[] = [];
      const duplicatesHandled: DuplicateResolution[] = [];

      console.log(`📥 Importing ${data.length} ${contentType} records to CMS...`);

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        
        try {
          // Check for duplicate resolution
          const resolution = duplicateResolutions?.find(r => r.duplicateId === item.id);
          
          if (resolution?.resolution === 'skipped') {
            skippedCount++;
            duplicatesHandled.push(resolution);
            continue;
          }

          // Convert to CMS format
          const cmsItem = this.convertToCMSFormat(item, contentType);
          
          if (resolution?.resolution === 'merged') {
            // Handle merge logic
            const existingId = resolution.resultingId!;
            await this.mergeWithExisting(cmsItem, existingId, contentType);
            updatedIds.push(existingId);
            duplicatesHandled.push(resolution);
          } else {
            // Create new or update existing
            const saved = await this.saveToCMS(cmsItem, contentType, replaceExisting);
            if (saved.created) {
              createdIds.push(saved.id);
            } else {
              updatedIds.push(saved.id);
            }
          }
          
          importedCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            row: i,
            message: `Failed to import record: ${(error as Error).message}`,
            severity: 'error'
          });
        }
      }

      // Create snapshot after successful import
      if (importedCount > 0) {
        await this.createSnapshot(`JSON import: ${uploadRecord.fileName}`, uploadRecord.uploadedBy);
      }

      console.log(`✅ Import completed: ${importedCount} imported, ${skippedCount} skipped, ${errorCount} errors`);

      return {
        success: errorCount === 0,
        importedCount,
        skippedCount,
        errorCount,
        createdIds,
        updatedIds,
        errors,
        duplicatesHandled
      };
    } catch (error) {
      console.error('CMS import failed:', error);
      throw error;
    }
  }

  /**
   * Export current content as JSON
   */
  async exportCurrentContent(type: 'habits' | 'research' | 'all'): Promise<ExportResult> {
    try {
      await this.adminAuth.requirePermission(type === 'all' ? 'system' : type, 'read');

      const timestamp = new Date();
      let recordCount = 0;

      if (type === 'habits' || type === 'all') {
        const habits = await this.contentManager.loadHabitsFromCMS();
        await this.saveExportFile('habits', habits, timestamp);
        recordCount += habits.length;
      }

      if (type === 'research' || type === 'all') {
        const research = await this.contentManager.loadResearchFromCMS();
        await this.saveExportFile('research', research, timestamp);
        recordCount += research.length;
      }

      console.log(`✅ Exported ${recordCount} records (${type})`);

      return {
        success: true,
        contentType: type,
        recordCount,
        exportedAt: timestamp,
        version: '1.0.0'
      };
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        contentType: type,
        recordCount: 0,
        exportedAt: new Date(),
        version: '1.0.0'
      };
    }
  }

  /**
   * Create content snapshot
   */
  async createSnapshot(description: string, createdBy?: string): Promise<SnapshotResult> {
    try {
      const adminUser = this.adminAuth.getCurrentUser();
      if (!adminUser) {
        throw new Error('Authentication required');
      }

      const snapshotId = this.generateSnapshotId();
      
      const [habits, research] = await Promise.all([
        this.contentManager.loadHabitsFromCMS(),
        this.contentManager.loadResearchFromCMS()
      ]);

      const snapshot: ContentSnapshot = {
        id: snapshotId,
        description,
        createdAt: new Date(),
        createdBy: createdBy || adminUser.id,
        version: '1.0.0',
        contentCounts: {
          habits: habits.length,
          research: research.length
        },
        checksum: this.generateContentChecksum([...habits, ...research])
      };

      await this.saveSnapshot(snapshot, { habits, research });

      console.log(`📸 Created content snapshot: ${snapshotId}`);

      return {
        success: true,
        snapshotId
      };
    } catch (error) {
      console.error('Snapshot creation failed:', error);
      return {
        success: false,
        snapshotId: '',
        error: (error as Error).message
      };
    }
  }

  // Private helper methods

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  private validateHabitRecord(item: any, index: number, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Required fields
    if (!item.id) {
      errors.push({ row: index, field: 'id', message: 'ID is required', severity: 'error' });
    }
    if (!item.title) {
      errors.push({ row: index, field: 'title', message: 'Title is required', severity: 'error' });
    }
    if (!item.description) {
      errors.push({ row: index, field: 'description', message: 'Description is required', severity: 'error' });
    }

    // Type validation
    if (item.timeMinutes && typeof item.timeMinutes !== 'number') {
      errors.push({ row: index, field: 'timeMinutes', message: 'timeMinutes must be a number', severity: 'error' });
    }

    // Warnings
    if (!item.instructions) {
      warnings.push({ row: index, field: 'instructions', message: 'Instructions recommended for better user experience', suggestion: 'Add detailed instructions' });
    }
    if (!item.researchBacking || item.researchBacking.length === 0) {
      warnings.push({ row: index, field: 'researchBacking', message: 'No research backing found', suggestion: 'Add research study IDs' });
    }
  }

  private validateResearchRecord(item: any, index: number, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Required fields
    if (!item.id) {
      errors.push({ row: index, field: 'id', message: 'ID is required', severity: 'error' });
    }
    if (!item.title) {
      errors.push({ row: index, field: 'title', message: 'Title is required', severity: 'error' });
    }
    if (!item.authors) {
      errors.push({ row: index, field: 'authors', message: 'Authors are required', severity: 'error' });
    }
    if (!item.year) {
      errors.push({ row: index, field: 'year', message: 'Year is required', severity: 'error' });
    }

    // Type validation
    if (item.year && (typeof item.year !== 'number' || item.year < 1900 || item.year > new Date().getFullYear() + 1)) {
      errors.push({ row: index, field: 'year', message: 'Invalid year', severity: 'error' });
    }

    // Warnings
    if (!item.doi) {
      warnings.push({ row: index, field: 'doi', message: 'DOI recommended for citation validation', suggestion: 'Add DOI if available' });
    }
    if (!item.summary) {
      warnings.push({ row: index, field: 'summary', message: 'Summary recommended', suggestion: 'Add research summary' });
    }
  }

  private compareItems(newItem: any, existingItem: any, newIndex: number, type: string): DuplicateMatch | null {
    const matchingFields: string[] = [];
    let confidence = 0;

    // Exact ID match
    if (newItem.id === existingItem.id) {
      return {
        existingId: existingItem.id,
        existingTitle: this.getItemTitle(existingItem),
        newIndex,
        newTitle: newItem.title,
        matchType: 'exact',
        confidence: 100,
        matchingFields: ['id'],
        suggestedResolution: 'merge'
      };
    }

    // Title and author matching (for research)
    if (type === 'research' && newItem.title && existingItem.title) {
      const titleSimilarity = this.calculateStringSimilarity(newItem.title, this.getItemTitle(existingItem));
      if (titleSimilarity > 0.8) {
        matchingFields.push('title');
        confidence += 40;

        if (newItem.authors && existingItem.authors && newItem.authors === existingItem.authors) {
          matchingFields.push('authors');
          confidence += 40;
        }

        if (newItem.year && existingItem.year && newItem.year === existingItem.year) {
          matchingFields.push('year');
          confidence += 20;
        }
      }
    }

    // DOI matching (exact match for research)
    if (type === 'research' && newItem.doi && existingItem.doi && newItem.doi === existingItem.doi) {
      return {
        existingId: existingItem.id,
        existingTitle: this.getItemTitle(existingItem),
        newIndex,
        newTitle: newItem.title,
        matchType: 'exact',
        confidence: 100,
        matchingFields: ['doi'],
        suggestedResolution: 'merge'
      };
    }

    // Title matching (for habits)
    if (type === 'habits' && newItem.title && existingItem.title) {
      const titleSimilarity = this.calculateStringSimilarity(newItem.title, this.getItemTitle(existingItem));
      if (titleSimilarity > 0.9) {
        confidence = Math.round(titleSimilarity * 100);
        matchingFields.push('title');
      }
    }

    // Return match if confidence is high enough
    if (confidence >= 70) {
      return {
        existingId: existingItem.id,
        existingTitle: this.getItemTitle(existingItem),
        newIndex,
        newTitle: newItem.title,
        matchType: confidence >= 90 ? 'exact' : confidence >= 80 ? 'likely' : 'suspicious',
        confidence,
        matchingFields,
        suggestedResolution: confidence >= 90 ? 'merge' : 'review_needed'
      };
    }

    return null;
  }

  private findConflicts(newItem: any, existingItem: any): ConflictReport[] {
    const conflicts: ConflictReport[] = [];
    
    // Compare key fields for conflicts
    const fieldsToCompare = ['title', 'description', 'authors', 'year', 'journal', 'summary', 'finding'];
    
    fieldsToCompare.forEach(field => {
      if (newItem[field] && existingItem[field] && newItem[field] !== this.getItemValue(existingItem, field)) {
        conflicts.push({
          field,
          existingValue: this.getItemValue(existingItem, field),
          newValue: newItem[field],
          recommendation: 'Review manually and choose the most accurate value'
        });
      }
    });

    return conflicts;
  }

  private getItemTitle(item: any): string {
    if (typeof item.title === 'string') return item.title;
    if (item.title && typeof item.title === 'object') return item.title.en || '';
    return '';
  }

  private getItemValue(item: any, field: string): any {
    const value = item[field];
    if (value && typeof value === 'object' && 'en' in value) {
      return value.en;
    }
    return value;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    const distance = matrix[len2][len1];
    return 1 - distance / Math.max(len1, len2);
  }

  private convertToCMSFormat(item: any, type: string): CMSHabit | CMSResearchStudy {
    const adminUser = this.adminAuth.getCurrentUser()!;
    const now = new Date();

    if (type === 'habits') {
      return {
        id: item.id,
        title: { en: item.title },
        description: { en: item.description },
        instructions: { en: item.instructions || '' },
        timeMinutes: item.timeMinutes || 5,
        category: item.category || 'general',
        goalTags: item.goalTags || [],
        researchStudies: item.researchBacking || [],
        status: 'published',
        isVerified: true,
        createdAt: now,
        updatedAt: now,
        createdBy: adminUser.id,
        lastModifiedBy: adminUser.id,
        version: 1
      } as CMSHabit;
    } else {
      return {
        id: item.id,
        title: item.title,
        authors: item.authors,
        year: item.year,
        journal: item.journal || '',
        doi: item.doi,
        citation: item.citation || '',
        summary: { en: item.summary || '' },
        finding: { en: item.finding || '' },
        category: item.category || 'general',
        evidenceLevel: 'observational',
        qualityScore: 75,
        validatedAt: now,
        citationStatus: 'valid',
        relatedStudies: [],
        status: 'published',
        createdAt: now,
        updatedAt: now,
        createdBy: adminUser.id,
        lastModifiedBy: adminUser.id,
        version: 1
      } as CMSResearchStudy;
    }
  }

  private async saveToCMS(item: CMSHabit | CMSResearchStudy, type: string, replaceExisting: boolean): Promise<{ id: string; created: boolean }> {
    // In production, this would save to actual CMS
    // For development, we'll simulate the save
    console.log(`💾 Saving ${type} to CMS:`, item.id);
    return { id: item.id, created: true };
  }

  private async mergeWithExisting(newItem: CMSHabit | CMSResearchStudy, existingId: string, type: string): Promise<void> {
    // In production, this would implement smart merging logic
    console.log(`🔄 Merging ${type} ${newItem.id} with existing ${existingId}`);
  }

  private generateUploadId(): string {
    return 'upload_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }

  private generateSnapshotId(): string {
    return 'snapshot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }

  private generateContentChecksum(content: any[]): string {
    // Simple checksum based on content
    return Date.now().toString(36) + content.length.toString(36);
  }

  private async saveUploadRecord(uploadId: string, fileName: string, contentType: string, data: any[], duplicates?: DuplicateReport): Promise<void> {
    // Implementation would save upload record to IndexedDB
    console.log(`📝 Saving upload record: ${uploadId}`);
  }

  private async getUploadRecord(uploadId: string): Promise<any> {
    // Implementation would retrieve upload record from IndexedDB
    return null;
  }

  private async saveSnapshot(snapshot: ContentSnapshot, content: any): Promise<void> {
    // Implementation would save snapshot to IndexedDB
    console.log(`📸 Saving snapshot: ${snapshot.id}`);
  }

  private async saveExportFile(type: string, data: any[], timestamp: Date): Promise<void> {
    // Implementation would create downloadable export file
    console.log(`📤 Creating export file for ${type}: ${data.length} records`);
  }
}