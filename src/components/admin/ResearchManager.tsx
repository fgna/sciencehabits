/**
 * Research Manager Component
 * 
 * Comprehensive content management interface for research articles with editing,
 * preview, validation, and multi-language support. Integrates with the ContentAPIClient
 * for real-time research content operations.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, CardContent } from '../ui';
import { ContentAPIClient, ResearchData } from '../../services/admin';

interface ResearchManagerProps {
  contentAPI: ContentAPIClient;
  onClose?: () => void;
  className?: string;
}

interface ResearchFormData {
  id: string;
  title: string;
  summary: string;
  authors: string;
  year: number;
  journal: string;
  doi?: string;
  category: string;
  evidenceLevel: 'systematic_review' | 'rct' | 'observational' | 'case_study';
  qualityScore: number;
  language: string;
  relatedHabits: string[];
}

interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

const CATEGORIES = ['sleep', 'productivity', 'health', 'mindfulness', 'nutrition', 'exercise'];
const EVIDENCE_LEVELS = [
  { value: 'systematic_review', label: 'Systematic Review', minQuality: 80 },
  { value: 'rct', label: 'Randomized Controlled Trial', minQuality: 70 },
  { value: 'observational', label: 'Observational Study', minQuality: 60 },
  { value: 'case_study', label: 'Case Study', minQuality: 40 }
];
const LANGUAGES = ['en', 'de', 'fr', 'es'];

export const ResearchManager: React.FC<ResearchManagerProps> = ({
  contentAPI,
  onClose,
  className = ''
}) => {
  // State management
  const [research, setResearch] = useState<ResearchData[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit mode state
  const [editingResearch, setEditingResearch] = useState<ResearchData | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formData, setFormData] = useState<ResearchFormData>({
    id: '',
    title: '',
    summary: '',
    authors: '',
    year: new Date().getFullYear(),
    journal: '',
    doi: '',
    category: 'health',
    evidenceLevel: 'rct',
    qualityScore: 70,
    language: 'en',
    relatedHabits: []
  });

  // Validation and preview
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Filter and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterEvidenceLevel, setFilterEvidenceLevel] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  // Statistics
  const [stats, setStats] = useState({
    totalArticles: 0,
    averageQuality: 0,
    recentArticles: 0,
    topJournals: [] as string[]
  });

  // Load research data on component mount and language change
  useEffect(() => {
    loadResearch();
  }, [selectedLanguage]);

  // Calculate statistics when research data changes
  useEffect(() => {
    calculateStats();
  }, [research]);

  // Auto-save form data every 30 seconds when editing
  useEffect(() => {
    if (!editingResearch && !isCreateMode) return;

    const autoSaveInterval = setInterval(() => {
      if (formData.title.trim() && formData.summary.trim()) {
        localStorage.setItem('researchManager_autosave', JSON.stringify({
          formData,
          timestamp: Date.now(),
          language: selectedLanguage
        }));
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [formData, editingResearch, isCreateMode, selectedLanguage]);

  const loadResearch = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await contentAPI.getResearch(selectedLanguage);
      if (result.success && result.data) {
        setResearch(result.data);
        console.log(`✅ Loaded ${result.data.length} research articles for ${selectedLanguage.toUpperCase()}`);
      } else {
        setError(result.error || 'Failed to load research articles');
      }
    } catch (error) {
      console.error('Failed to load research:', error);
      setError('Failed to load research data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    if (research.length === 0) {
      setStats({ totalArticles: 0, averageQuality: 0, recentArticles: 0, topJournals: [] });
      return;
    }

    const currentYear = new Date().getFullYear();
    const recentArticles = research.filter(r => r.year >= currentYear - 2).length;
    const averageQuality = Math.round(research.reduce((sum, r) => sum + r.qualityScore, 0) / research.length);
    
    const journalCounts = research.reduce((acc, r) => {
      acc[r.journal] = (acc[r.journal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topJournals = Object.entries(journalCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([journal]) => journal);

    setStats({
      totalArticles: research.length,
      averageQuality,
      recentArticles,
      topJournals
    });
  };

  const validateResearch = (data: ResearchFormData): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required field validation
    if (!data.title.trim()) {
      errors.push({ field: 'title', message: 'Title is required', type: 'error' });
    } else if (data.title.length < 10) {
      errors.push({ field: 'title', message: 'Title must be at least 10 characters', type: 'error' });
    } else if (data.title.length > 200) {
      errors.push({ field: 'title', message: 'Title must be less than 200 characters', type: 'error' });
    }

    if (!data.summary.trim()) {
      errors.push({ field: 'summary', message: 'Summary is required', type: 'error' });
    } else if (data.summary.length < 50) {
      errors.push({ field: 'summary', message: 'Summary must be at least 50 characters', type: 'error' });
    } else if (data.summary.length > 1000) {
      errors.push({ field: 'summary', message: 'Summary must be less than 1000 characters', type: 'error' });
    }

    if (!data.id.trim()) {
      errors.push({ field: 'id', message: 'ID is required', type: 'error' });
    } else if (!/^[a-z0-9-]+$/.test(data.id)) {
      errors.push({ field: 'id', message: 'ID must contain only lowercase letters, numbers, and hyphens', type: 'error' });
    } else if (!isCreateMode && research.find(r => r.id === data.id && r.id !== editingResearch?.id)) {
      errors.push({ field: 'id', message: 'A research article with this ID already exists', type: 'error' });
    }

    if (!data.authors.trim()) {
      errors.push({ field: 'authors', message: 'Authors are required', type: 'error' });
    } else if (data.authors.length < 5) {
      errors.push({ field: 'authors', message: 'Authors must be at least 5 characters', type: 'error' });
    }

    if (!data.journal.trim()) {
      errors.push({ field: 'journal', message: 'Journal is required', type: 'error' });
    } else if (data.journal.length < 5) {
      errors.push({ field: 'journal', message: 'Journal must be at least 5 characters', type: 'error' });
    }

    // Year validation
    const currentYear = new Date().getFullYear();
    if (data.year < 1990) {
      errors.push({ field: 'year', message: 'Year must be 1990 or later', type: 'error' });
    } else if (data.year > currentYear + 1) {
      errors.push({ field: 'year', message: 'Year cannot be more than 1 year in the future', type: 'error' });
    }

    // Quality score validation
    if (data.qualityScore < 0 || data.qualityScore > 100) {
      errors.push({ field: 'qualityScore', message: 'Quality score must be between 0 and 100', type: 'error' });
    }

    // DOI validation
    if (data.doi && !data.doi.match(/^10\.\d{4,}\//)) {
      errors.push({ field: 'doi', message: 'DOI format appears invalid (should start with 10.XXXX/)', type: 'warning' });
    }

    // Business logic warnings
    const evidenceLevel = EVIDENCE_LEVELS.find(el => el.value === data.evidenceLevel);
    if (evidenceLevel && data.qualityScore < evidenceLevel.minQuality) {
      errors.push({ 
        field: 'qualityScore', 
        message: `Quality score seems low for ${evidenceLevel.label} (recommended: ${evidenceLevel.minQuality}+)`, 
        type: 'warning' 
      });
    }

    if (data.year < currentYear - 10) {
      errors.push({ field: 'year', message: 'Research is over 10 years old - consider relevance', type: 'warning' });
    }

    if (data.relatedHabits.length === 0) {
      errors.push({ field: 'relatedHabits', message: 'Consider linking to related habits for better integration', type: 'warning' });
    }

    return errors;
  };

  const startEdit = (researchItem: ResearchData) => {
    setEditingResearch(researchItem);
    setIsCreateMode(false);
    setFormData({
      id: researchItem.id,
      title: researchItem.title,
      summary: researchItem.summary,
      authors: researchItem.authors,
      year: researchItem.year,
      journal: researchItem.journal,
      doi: researchItem.doi || '',
      category: researchItem.category,
      evidenceLevel: researchItem.evidenceLevel,
      qualityScore: researchItem.qualityScore,
      language: researchItem.language,
      relatedHabits: researchItem.relatedHabits || []
    });
    setValidationErrors([]);
    setShowPreview(false);
  };

  const startCreate = () => {
    setIsCreateMode(true);
    setEditingResearch(null);
    setFormData({
      id: '',
      title: '',
      summary: '',
      authors: '',
      year: new Date().getFullYear(),
      journal: '',
      doi: '',
      category: 'health',
      evidenceLevel: 'rct',
      qualityScore: 70,
      language: selectedLanguage,
      relatedHabits: []
    });
    setValidationErrors([]);
    setShowPreview(false);

    // Check for autosaved data
    const autosaved = localStorage.getItem('researchManager_autosave');
    if (autosaved) {
      try {
        const { formData: savedData, timestamp, language } = JSON.parse(autosaved);
        const ageMinutes = (Date.now() - timestamp) / (1000 * 60);
        
        if (ageMinutes < 60 && language === selectedLanguage) {
          if (window.confirm('Found autosaved data from ' + Math.round(ageMinutes) + ' minutes ago. Restore it?')) {
            setFormData(savedData);
          }
        }
      } catch (error) {
        console.warn('Failed to restore autosaved data:', error);
      }
    }
  };

  const cancelEdit = () => {
    setEditingResearch(null);
    setIsCreateMode(false);
    setFormData({
      id: '',
      title: '',
      summary: '',
      authors: '',
      year: new Date().getFullYear(),
      journal: '',
      doi: '',
      category: 'health',
      evidenceLevel: 'rct',
      qualityScore: 70,
      language: selectedLanguage,
      relatedHabits: []
    });
    setValidationErrors([]);
    setShowPreview(false);
    localStorage.removeItem('researchManager_autosave');
  };

  const saveResearch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Validate form data
      const errors = validateResearch(formData);
      setValidationErrors(errors);

      const hasErrors = errors.some(e => e.type === 'error');
      if (hasErrors) {
        setError('Please fix validation errors before saving');
        return;
      }

      // For now, simulate save success since we don't have write API endpoints
      // In a real implementation, this would call contentAPI.saveResearch(formData)
      
      const updatedResearch: ResearchData = {
        ...formData,
        createdAt: editingResearch?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isCreateMode) {
        setResearch(prev => [...prev, updatedResearch]);
        setSuccess('✅ Research article created successfully!');
      } else {
        setResearch(prev => prev.map(r => r.id === formData.id ? updatedResearch : r));
        setSuccess('✅ Research article updated successfully!');
      }

      localStorage.removeItem('researchManager_autosave');
      cancelEdit();

      // Auto-clear success message
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      console.error('Failed to save research:', error);
      setError('Failed to save research article');
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateResearch = (researchItem: ResearchData) => {
    const newId = `${researchItem.id}-copy-${Date.now()}`;
    const duplicatedResearch: ResearchData = {
      ...researchItem,
      id: newId,
      title: `${researchItem.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setFormData({
      id: duplicatedResearch.id,
      title: duplicatedResearch.title,
      summary: duplicatedResearch.summary,
      authors: duplicatedResearch.authors,
      year: duplicatedResearch.year,
      journal: duplicatedResearch.journal,
      doi: duplicatedResearch.doi || '',
      category: duplicatedResearch.category,
      evidenceLevel: duplicatedResearch.evidenceLevel,
      qualityScore: duplicatedResearch.qualityScore,
      language: duplicatedResearch.language,
      relatedHabits: duplicatedResearch.relatedHabits || []
    });

    setIsCreateMode(true);
    setEditingResearch(null);
    setValidationErrors([]);
  };

  const deleteResearch = async (researchId: string) => {
    if (!window.confirm('Are you sure you want to delete this research article? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // For now, simulate delete success
      // In a real implementation, this would call contentAPI.deleteResearch(researchId)
      
      setResearch(prev => prev.filter(r => r.id !== researchId));
      setSuccess('✅ Research article deleted successfully!');

      // Auto-clear success message
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      console.error('Failed to delete research:', error);
      setError('Failed to delete research article');
    } finally {
      setIsLoading(false);
    }
  };

  const generateId = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
      .replace(/-+$/, '');
  };

  const updateFormField = (field: keyof ResearchFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate ID from title
    if (field === 'title' && (isCreateMode || !formData.id)) {
      const generatedId = generateId(value);
      setFormData(prev => ({
        ...prev,
        id: generatedId
      }));
    }

    // Clear validation errors for the updated field
    setValidationErrors(prev => prev.filter(e => e.field !== field));
  };

  // Filtered and searched research
  const filteredResearch = useMemo(() => {
    return research.filter(researchItem => {
      const matchesSearch = researchItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           researchItem.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           researchItem.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           researchItem.journal.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || researchItem.category === filterCategory;
      const matchesEvidenceLevel = filterEvidenceLevel === 'all' || researchItem.evidenceLevel === filterEvidenceLevel;
      const matchesYear = filterYear === 'all' || 
                         (filterYear === 'recent' && researchItem.year >= new Date().getFullYear() - 2) ||
                         (filterYear === 'classic' && researchItem.year < new Date().getFullYear() - 5);
      
      return matchesSearch && matchesCategory && matchesEvidenceLevel && matchesYear;
    });
  }, [research, searchTerm, filterCategory, filterEvidenceLevel, filterYear]);

  const renderStatistics = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Research Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalArticles}</div>
            <div className="text-gray-600">Total Articles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.averageQuality}</div>
            <div className="text-gray-600">Avg Quality</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.recentArticles}</div>
            <div className="text-gray-600">Recent (2+ yrs)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.topJournals.length}</div>
            <div className="text-gray-600">Unique Journals</div>
          </div>
        </div>
        
        {stats.topJournals.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Top Journals:</div>
            <div className="flex flex-wrap gap-2">
              {stats.topJournals.slice(0, 3).map(journal => (
                <span key={journal} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {journal}
                </span>
              ))}
              {stats.topJournals.length > 3 && (
                <span className="text-xs text-gray-500">+{stats.topJournals.length - 3} more</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderResearchList = () => (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Research Manager ({filteredResearch.length} of {research.length})
          </h3>
          <p className="text-sm text-gray-600">
            Manage research articles for {selectedLanguage.toUpperCase()} language
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </select>
          
          <Button onClick={startCreate} variant="primary">
            ➕ Add Research
          </Button>
          
          <Button onClick={loadResearch} variant="secondary" disabled={isLoading}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {research.length > 0 && renderStatistics()}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search research..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
        
        <select
          value={filterEvidenceLevel}
          onChange={(e) => setFilterEvidenceLevel(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Evidence Levels</option>
          {EVIDENCE_LEVELS.map(level => (
            <option key={level.value} value={level.value}>{level.label}</option>
          ))}
        </select>
        
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Years</option>
          <option value="recent">Recent (2+ years)</option>
          <option value="classic">Classic (5+ years)</option>
        </select>
      </div>

      {/* Research Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⏳</div>
          <p>Loading research articles...</p>
        </div>
      ) : filteredResearch.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-600">
            {research.length === 0 ? 'No research articles found' : 'No research matches your search criteria'}
          </p>
          {research.length === 0 && (
            <Button onClick={startCreate} variant="primary" className="mt-4">
              Add Your First Research Article
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredResearch.map(researchItem => (
            <Card key={researchItem.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{researchItem.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      by {researchItem.authors} • {researchItem.journal} ({researchItem.year})
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">{researchItem.summary}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <Button onClick={() => startEdit(researchItem)} variant="ghost" size="sm">
                      ✏️
                    </Button>
                    <Button onClick={() => duplicateResearch(researchItem)} variant="ghost" size="sm">
                      📋
                    </Button>
                    <Button onClick={() => deleteResearch(researchItem.id)} variant="ghost" size="sm">
                      🗑️
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {researchItem.category}
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    {EVIDENCE_LEVELS.find(el => el.value === researchItem.evidenceLevel)?.label || researchItem.evidenceLevel}
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Q: {researchItem.qualityScore}
                  </span>
                  {researchItem.doi && <span>🔗 DOI</span>}
                </div>
                
                {researchItem.relatedHabits && researchItem.relatedHabits.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs text-gray-500">Linked habits:</span>
                    {researchItem.relatedHabits.slice(0, 2).map(habitId => (
                      <span key={habitId} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {habitId.replace(/-/g, ' ')}
                      </span>
                    ))}
                    {researchItem.relatedHabits.length > 2 && (
                      <span className="text-xs text-gray-500">+{researchItem.relatedHabits.length - 2} more</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderEditForm = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isCreateMode ? 'Add New Research Article' : 'Edit Research Article'}
          </h3>
          <p className="text-sm text-gray-600">
            {isCreateMode ? 'Add a new research article to the collection' : `Editing: ${editingResearch?.title}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowPreview(!showPreview)} variant="secondary">
            {showPreview ? '📝 Edit' : '👁️ Preview'}
          </Button>
          <Button onClick={cancelEdit} variant="ghost">
            ❌ Cancel
          </Button>
        </div>
      </div>

      {/* Form or Preview */}
      {showPreview ? (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">{formData.title || 'Untitled Research'}</h4>
              <p className="text-sm text-gray-600 mb-3">
                by {formData.authors || 'Unknown Authors'} • {formData.journal || 'Unknown Journal'} ({formData.year})
              </p>
              {formData.doi && (
                <p className="text-sm text-blue-600 mb-3">DOI: {formData.doi}</p>
              )}
            </div>
            
            <p className="text-gray-700 mb-4">{formData.summary || 'No summary provided.'}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <span className="font-medium text-gray-600">Category:</span>
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded">{formData.category}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Evidence:</span>
                <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded">
                  {EVIDENCE_LEVELS.find(el => el.value === formData.evidenceLevel)?.label}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Quality:</span>
                <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded">{formData.qualityScore}/100</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Language:</span>
                <span className="ml-2">{formData.language.toUpperCase()}</span>
              </div>
            </div>
            
            {formData.relatedHabits.length > 0 && (
              <div>
                <span className="font-medium text-gray-600">Related Habits:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.relatedHabits.map(habitId => (
                    <span key={habitId} className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm">
                      {habitId.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); saveResearch(); }} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Basic Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormField('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Effects of Meditation on Stress and Cognitive Performance"
                    required
                  />
                  {validationErrors.find(e => e.field === 'title') && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.find(e => e.field === 'title')?.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID *
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => updateFormField('id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., meditation-stress-2023"
                    required
                  />
                  {validationErrors.find(e => e.field === 'id') && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.find(e => e.field === 'id')?.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DOI (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.doi}
                    onChange={(e) => updateFormField('doi', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., 10.1177/2023123456"
                  />
                  {validationErrors.find(e => e.field === 'doi') && (
                    <p className="text-sm text-yellow-600 mt-1">
                      {validationErrors.find(e => e.field === 'doi')?.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary *
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => updateFormField('summary', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Provide a comprehensive summary of the research findings, methodology, and implications..."
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-500">
                    {formData.summary.length}/1000 characters
                  </span>
                  {validationErrors.find(e => e.field === 'summary') && (
                    <p className="text-sm text-red-600">
                      {validationErrors.find(e => e.field === 'summary')?.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Publication Details */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Publication Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Authors *
                  </label>
                  <input
                    type="text"
                    value={formData.authors}
                    onChange={(e) => updateFormField('authors', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Johnson, M.K., Smith, R.A., Chen, L."
                    required
                  />
                  {validationErrors.find(e => e.field === 'authors') && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.find(e => e.field === 'authors')?.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year *
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => updateFormField('year', parseInt(e.target.value) || new Date().getFullYear())}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  {validationErrors.find(e => e.field === 'year') && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.find(e => e.field === 'year')?.message}
                    </p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Journal *
                  </label>
                  <input
                    type="text"
                    value={formData.journal}
                    onChange={(e) => updateFormField('journal', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Journal of Behavioral Medicine"
                    required
                  />
                  {validationErrors.find(e => e.field === 'journal') && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.find(e => e.field === 'journal')?.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Research Classification */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Research Classification</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateFormField('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evidence Level *
                  </label>
                  <select
                    value={formData.evidenceLevel}
                    onChange={(e) => updateFormField('evidenceLevel', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    {EVIDENCE_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Score (0-100) *
                  </label>
                  <input
                    type="number"
                    value={formData.qualityScore}
                    onChange={(e) => updateFormField('qualityScore', parseInt(e.target.value) || 0)}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  {validationErrors.find(e => e.field === 'qualityScore') && (
                    <p className="text-sm text-yellow-600 mt-1">
                      {validationErrors.find(e => e.field === 'qualityScore')?.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Habits (one per line)
                </label>
                <textarea
                  value={formData.relatedHabits.join('\n')}
                  onChange={(e) => updateFormField('relatedHabits', e.target.value.split('\n').filter(s => s.trim()))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="habit-id-1&#10;habit-id-2&#10;habit-id-3"
                />
                {validationErrors.find(e => e.field === 'relatedHabits') && (
                  <p className="text-sm text-yellow-600 mt-1">
                    {validationErrors.find(e => e.field === 'relatedHabits')?.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              * Required fields
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" onClick={cancelEdit} variant="ghost">
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? '⏳ Saving...' : isCreateMode ? '✅ Add Research' : '✅ Update Research'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Validation Errors Summary */}
      {validationErrors.length > 0 && !showPreview && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-2">Validation Issues</h4>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <p key={index} className={`text-sm ${error.type === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>
                  {error.type === 'error' ? '❌' : '⚠️'} {error.message}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {editingResearch || isCreateMode ? renderEditForm() : renderResearchList()}

      {/* Close Button */}
      {onClose && (
        <div className="mt-6 text-center">
          <Button onClick={onClose} variant="ghost">
            Close Research Manager
          </Button>
        </div>
      )}
    </div>
  );
};