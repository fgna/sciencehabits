/**
 * Research Validator Service
 * 
 * Provides automated validation of research citations, DOI checking,
 * and quality assessment for research studies.
 */

import {
  ValidationResult,
  ValidationEvent,
  EnhancedResearchStudy,
  CMSResearchStudy
} from '../../types/cms';
import { AdminAuthService } from './AdminAuthService';

export class ResearchValidator {
  private dbName = 'sciencehabits-research-validation';
  private version = 1;
  private db: IDBDatabase | null = null;
  private adminAuth: AdminAuthService;
  private validationQueue: string[] = [];
  private isValidating = false;

  // Mock API endpoints (in production these would be real services)
  private readonly mockAPIs = {
    crossref: 'https://api.crossref.org/works/',
    pubmed: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/',
    retraction: 'https://retractionwatch.com/api/',
    journal: 'https://api.journalcitation.com/'
  };

  constructor(adminAuth: AdminAuthService) {
    this.adminAuth = adminAuth;
    this.initializeDB();
    this.startValidationQueue();
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
        
        // Validation events store
        if (!db.objectStoreNames.contains('validation_events')) {
          const eventsStore = db.createObjectStore('validation_events', { keyPath: 'id' });
          eventsStore.createIndex('studyId', 'studyId', { unique: false });
          eventsStore.createIndex('performedAt', 'performedAt', { unique: false });
          eventsStore.createIndex('type', 'type', { unique: false });
        }
        
        // Validation cache
        if (!db.objectStoreNames.contains('validation_cache')) {
          const cacheStore = db.createObjectStore('validation_cache', { keyPath: 'key' });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        // Quality assessments
        if (!db.objectStoreNames.contains('quality_assessments')) {
          const qualityStore = db.createObjectStore('quality_assessments', { keyPath: 'studyId' });
          qualityStore.createIndex('qualityScore', 'qualityScore', { unique: false });
          qualityStore.createIndex('lastAssessed', 'lastAssessed', { unique: false });
        }
      };
    });
  }

  /**
   * Validate DOI and check paper availability
   */
  async validateDOI(doi: string): Promise<ValidationResult> {
    try {
      console.log(`🔍 Validating DOI: ${doi}`);

      // Check cache first
      const cached = await this.getCachedValidation(`doi_${doi}`);
      if (cached && !this.isCacheExpired(cached)) {
        console.log(`📋 Using cached DOI validation for: ${doi}`);
        return cached.result;
      }

      // Normalize DOI
      const normalizedDOI = this.normalizeDOI(doi);
      if (!this.isValidDOIFormat(normalizedDOI)) {
        return {
          isValid: false,
          errors: ['Invalid DOI format'],
          warnings: [],
          metadata: { lastChecked: new Date() }
        };
      }

      // Mock CrossRef API call (in production, this would be a real API call)
      const result = await this.mockCrossRefValidation(normalizedDOI);

      // Cache the result
      await this.cacheValidation(`doi_${doi}`, result, 7 * 24 * 60 * 60 * 1000); // Cache for 7 days

      return result;
    } catch (error) {
      console.error('DOI validation failed:', error);
      return {
        isValid: false,
        errors: [`Validation failed: ${(error as Error).message}`],
        warnings: [],
        metadata: { lastChecked: new Date() }
      };
    }
  }

  /**
   * Check for retracted papers
   */
  async checkRetractedPapers(): Promise<Array<{ studyId: string; retractionInfo: any }>> {
    try {
      console.log('🔍 Checking for retracted papers...');

      // In production, this would query retraction databases
      // For development, we'll simulate the check
      const retractedPapers = await this.mockRetractionCheck();

      console.log(`✅ Retraction check completed: ${retractedPapers.length} issues found`);
      return retractedPapers;
    } catch (error) {
      console.error('Retraction check failed:', error);
      return [];
    }
  }

  /**
   * Validate journal credibility
   */
  async validateJournal(journal: string): Promise<{
    isValid: boolean;
    impactFactor?: number;
    quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    isPredatory?: boolean;
    warnings: string[];
  }> {
    try {
      console.log(`🔍 Validating journal: ${journal}`);

      // Check cache
      const cached = await this.getCachedValidation(`journal_${journal.toLowerCase()}`);
      if (cached && !this.isCacheExpired(cached)) {
        console.log(`📋 Using cached journal validation for: ${journal}`);
        return cached.result;
      }

      // Mock journal validation (in production, use real journal databases)
      const result = await this.mockJournalValidation(journal);

      // Cache the result
      await this.cacheValidation(`journal_${journal.toLowerCase()}`, result, 30 * 24 * 60 * 60 * 1000); // Cache for 30 days

      return result;
    } catch (error) {
      console.error('Journal validation failed:', error);
      return {
        isValid: false,
        warnings: [`Journal validation failed: ${(error as Error).message}`]
      };
    }
  }

  /**
   * Enrich citation with additional metadata
   */
  async enrichCitation(study: CMSResearchStudy): Promise<EnhancedResearchStudy> {
    try {
      console.log(`🔍 Enriching citation for study: ${study.id}`);

      const validationHistory = await this.getValidationHistory(study.id);
      
      // Perform comprehensive validation
      const doiValidation = study.doi ? await this.validateDOI(study.doi) : null;
      const journalValidation = await this.validateJournal(study.journal);
      
      // Calculate quality score
      const qualityScore = await this.calculateQualityScore(study, doiValidation, journalValidation);

      // Record validation event
      await this.recordValidationEvent({
        id: this.generateEventId(),
        studyId: study.id,
        type: 'citation_check',
        status: doiValidation?.isValid !== false && journalValidation.isValid ? 'passed' : 'warning',
        message: 'Citation enrichment completed',
        performedAt: new Date(),
        performedBy: 'system'
      });

      const enrichedStudy: EnhancedResearchStudy = {
        ...study,
        qualityScore,
        lastValidated: new Date(),
        validationHistory,
        validationNotes: this.generateValidationNotes(doiValidation, journalValidation)
      };

      console.log(`✅ Citation enriched for study: ${study.id} (quality score: ${qualityScore})`);
      return enrichedStudy;
    } catch (error) {
      console.error('Citation enrichment failed:', error);
      // Return original study with minimal enhancement
      return {
        ...study,
        qualityScore: 50, // Default neutral score
        lastValidated: new Date(),
        validationHistory: await this.getValidationHistory(study.id)
      };
    }
  }

  /**
   * Calculate research quality score (0-100)
   */
  async calculateQualityScore(
    study: CMSResearchStudy, 
    doiValidation?: ValidationResult | null, 
    journalValidation?: any
  ): Promise<number> {
    let score = 50; // Base score

    // DOI presence and validity (+20 points)
    if (study.doi) {
      score += 10;
      if (doiValidation?.isValid) {
        score += 10;
      }
    }

    // Journal quality (+30 points max)
    if (journalValidation) {
      if (journalValidation.isValid) {
        score += 10;
        
        if (journalValidation.impactFactor) {
          if (journalValidation.impactFactor > 10) score += 10;
          else if (journalValidation.impactFactor > 5) score += 7;
          else if (journalValidation.impactFactor > 2) score += 5;
          else if (journalValidation.impactFactor > 1) score += 3;
        }

        if (journalValidation.quartile) {
          switch (journalValidation.quartile) {
            case 'Q1': score += 10; break;
            case 'Q2': score += 7; break;
            case 'Q3': score += 4; break;
            case 'Q4': score += 2; break;
          }
        }
      }
      
      if (journalValidation.isPredatory) {
        score -= 30; // Heavy penalty for predatory journals
      }
    }

    // Publication recency (+10 points max)
    const currentYear = new Date().getFullYear();
    const yearsOld = currentYear - study.year;
    if (yearsOld <= 5) score += 10;
    else if (yearsOld <= 10) score += 5;
    else if (yearsOld <= 15) score += 2;

    // Evidence level (+10 points max)
    switch (study.evidenceLevel) {
      case 'systematic_review': score += 10; break;
      case 'rct': score += 8; break;
      case 'observational': score += 5; break;
      case 'case_study': score += 2; break;
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Find related studies
   */
  async findRelatedStudies(studyId: string): Promise<CMSResearchStudy[]> {
    try {
      console.log(`🔍 Finding related studies for: ${studyId}`);
      
      // In production, this would use semantic search or keyword matching
      // For development, we'll simulate related study discovery
      const relatedStudies = await this.mockFindRelatedStudies(studyId);

      console.log(`✅ Found ${relatedStudies.length} related studies for: ${studyId}`);
      return relatedStudies;
    } catch (error) {
      console.error('Related studies search failed:', error);
      return [];
    }
  }

  /**
   * Schedule study for revalidation
   */
  async scheduleRevalidation(studyId: string): Promise<void> {
    if (!this.validationQueue.includes(studyId)) {
      this.validationQueue.push(studyId);
      console.log(`📅 Scheduled revalidation for study: ${studyId}`);
    }
  }

  /**
   * Get validation history for a study
   */
  async getValidationHistory(studyId: string): Promise<ValidationEvent[]> {
    if (!this.db) return [];

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['validation_events'], 'readonly');
      const store = transaction.objectStore('validation_events');
      const index = store.index('studyId');
      const request = index.getAll(studyId);

      request.onsuccess = () => {
        const events = (request.result || []).sort((a, b) => 
          new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
        );
        resolve(events);
      };
      request.onerror = () => resolve([]);
    });
  }

  /**
   * Run daily validation checks
   */
  async runDailyValidation(): Promise<{
    validated: number;
    errors: number;
    warnings: number;
    retracted: number;
  }> {
    console.log('🔄 Starting daily validation checks...');

    const stats = {
      validated: 0,
      errors: 0,
      warnings: 0,
      retracted: 0
    };

    try {
      // Check for retracted papers
      const retractedPapers = await this.checkRetractedPapers();
      stats.retracted = retractedPapers.length;

      // Process validation queue
      while (this.validationQueue.length > 0 && !this.isValidating) {
        const studyId = this.validationQueue.shift()!;
        try {
          await this.validateStudyById(studyId);
          stats.validated++;
        } catch (error) {
          console.error(`Validation failed for study ${studyId}:`, error);
          stats.errors++;
        }
      }

      console.log('✅ Daily validation completed:', stats);
      return stats;
    } catch (error) {
      console.error('Daily validation failed:', error);
      return stats;
    }
  }

  // Private helper methods

  private async validateStudyById(studyId: string): Promise<void> {
    // Implementation would validate a specific study
    console.log(`🔍 Validating study: ${studyId}`);
  }

  private startValidationQueue(): void {
    // Process validation queue every hour
    setInterval(() => {
      if (!this.isValidating && this.validationQueue.length > 0) {
        this.processValidationQueue();
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  private async processValidationQueue(): Promise<void> {
    if (this.isValidating) return;
    
    this.isValidating = true;
    console.log(`🔄 Processing validation queue: ${this.validationQueue.length} items`);

    try {
      while (this.validationQueue.length > 0) {
        const studyId = this.validationQueue.shift()!;
        await this.validateStudyById(studyId);
        
        // Small delay to prevent overwhelming external APIs
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Validation queue processing failed:', error);
    } finally {
      this.isValidating = false;
    }
  }

  private normalizeDOI(doi: string): string {
    // Remove common prefixes and normalize format
    return doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, '').trim();
  }

  private isValidDOIFormat(doi: string): boolean {
    // Basic DOI format validation
    const doiPattern = /^10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+$/;
    return doiPattern.test(doi);
  }

  private async mockCrossRefValidation(doi: string): Promise<ValidationResult> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock validation based on DOI pattern
    const isValid = this.isValidDOIFormat(doi);
    const mockCitationCount = Math.floor(Math.random() * 100);

    return {
      isValid,
      errors: isValid ? [] : ['DOI not found in CrossRef database'],
      warnings: mockCitationCount < 5 ? ['Low citation count'] : [],
      metadata: {
        doi,
        citationCount: mockCitationCount,
        lastChecked: new Date(),
        source: 'crossref-mock'
      }
    };
  }

  private async mockRetractionCheck(): Promise<Array<{ studyId: string; retractionInfo: any }>> {
    // Simulate retraction check
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock: rarely find retracted papers
    return Math.random() < 0.05 ? [{
      studyId: 'mock-retracted-study',
      retractionInfo: {
        retractedAt: new Date(),
        reason: 'Data integrity concerns',
        source: 'retraction-watch-mock'
      }
    }] : [];
  }

  private async mockJournalValidation(journal: string): Promise<any> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock journal scoring based on name patterns
    const impactFactor = Math.random() * 20;
    const quartile = impactFactor > 15 ? 'Q1' : 
                     impactFactor > 10 ? 'Q2' : 
                     impactFactor > 5 ? 'Q3' : 'Q4';

    // Check for predatory journal patterns
    const isPredatory = journal.toLowerCase().includes('international') && 
                       journal.toLowerCase().includes('research') && 
                       Math.random() < 0.1;

    return {
      isValid: !isPredatory,
      impactFactor: Math.round(impactFactor * 100) / 100,
      quartile,
      isPredatory,
      warnings: isPredatory ? ['Journal flagged as potentially predatory'] : []
    };
  }

  private async mockFindRelatedStudies(studyId: string): Promise<CMSResearchStudy[]> {
    // Mock related studies discovery
    await new Promise(resolve => setTimeout(resolve, 800));
    return []; // Return empty for mock
  }

  private generateValidationNotes(doiValidation?: ValidationResult | null, journalValidation?: any): string {
    const notes: string[] = [];
    
    if (doiValidation?.isValid) {
      notes.push('✅ DOI validated successfully');
    } else if (doiValidation) {
      notes.push('❌ DOI validation failed');
    }

    if (journalValidation?.isValid) {
      notes.push(`✅ Journal validated (Impact Factor: ${journalValidation.impactFactor || 'N/A'})`);
    } else if (journalValidation) {
      notes.push('⚠️ Journal validation concerns');
    }

    return notes.join('; ');
  }

  private async recordValidationEvent(event: ValidationEvent): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['validation_events'], 'readwrite');
      const store = transaction.objectStore('validation_events');
      const request = store.add(event);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getCachedValidation(key: string): Promise<{ result: any; expiresAt: Date } | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['validation_cache'], 'readonly');
      const store = transaction.objectStore('validation_cache');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  private async cacheValidation(key: string, result: any, ttlMs: number): Promise<void> {
    if (!this.db) return;

    const expiresAt = new Date(Date.now() + ttlMs);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['validation_cache'], 'readwrite');
      const store = transaction.objectStore('validation_cache');
      const request = store.put({ key, result, expiresAt });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private isCacheExpired(cached: { expiresAt: Date }): boolean {
    return new Date() > cached.expiresAt;
  }

  private generateEventId(): string {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }
}