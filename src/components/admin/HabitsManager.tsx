/**
 * Habits Manager Component
 * 
 * Comprehensive content management interface for habits with editing,
 * preview, validation, and multi-language support. Integrates with
 * the ContentAPIClient for real-time content operations.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, CardContent } from '../ui';
import { ContentAPIClient, HabitData } from '../../services/admin';

interface HabitsManagerProps {
  contentAPI: ContentAPIClient;
  onClose?: () => void;
  className?: string;
}

interface HabitFormData {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeMinutes: number;
  language: string;
  researchBacked: boolean;
  sources: string[];
  goalTags: string[];
}

interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

const CATEGORIES = ['sleep', 'productivity', 'health', 'mindfulness', 'nutrition', 'exercise'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const LANGUAGES = ['en', 'de', 'fr', 'es'];
const GOAL_TAGS = [
  'improve_sleep', 'boost_energy', 'reduce_stress', 'improve_focus',
  'increase_productivity', 'enhance_creativity', 'build_confidence',
  'improve_fitness', 'better_nutrition', 'social_connection'
];

export const HabitsManager: React.FC<HabitsManagerProps> = ({
  contentAPI,
  onClose,
  className = ''
}) => {
  // State management
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit mode state
  const [editingHabit, setEditingHabit] = useState<HabitData | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formData, setFormData] = useState<HabitFormData>({
    id: '',
    title: '',
    description: '',
    category: 'productivity',
    difficulty: 'beginner',
    timeMinutes: 10,
    language: 'en',
    researchBacked: false,
    sources: [],
    goalTags: []
  });

  // Validation and preview
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Filter and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Load habits data on component mount and language change
  useEffect(() => {
    loadHabits();
  }, [selectedLanguage]);

  // Auto-save form data every 30 seconds when editing
  useEffect(() => {
    if (!editingHabit && !isCreateMode) return;

    const autoSaveInterval = setInterval(() => {
      if (formData.title.trim() && formData.description.trim()) {
        localStorage.setItem('habitManager_autosave', JSON.stringify({
          formData,
          timestamp: Date.now(),
          language: selectedLanguage
        }));
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [formData, editingHabit, isCreateMode, selectedLanguage]);

  const loadHabits = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await contentAPI.getHabits(selectedLanguage);
      if (result.success && result.data) {
        setHabits(result.data);
        console.log(`✅ Loaded ${result.data.length} habits for ${selectedLanguage.toUpperCase()}`);
      } else {
        setError(result.error || 'Failed to load habits');
      }
    } catch (error) {
      console.error('Failed to load habits:', error);
      setError('Failed to load habits data');
    } finally {
      setIsLoading(false);
    }
  };

  const validateHabit = (data: HabitFormData): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required field validation
    if (!data.title.trim()) {
      errors.push({ field: 'title', message: 'Title is required', type: 'error' });
    } else if (data.title.length < 5) {
      errors.push({ field: 'title', message: 'Title must be at least 5 characters', type: 'error' });
    } else if (data.title.length > 100) {
      errors.push({ field: 'title', message: 'Title must be less than 100 characters', type: 'error' });
    }

    if (!data.description.trim()) {
      errors.push({ field: 'description', message: 'Description is required', type: 'error' });
    } else if (data.description.length < 20) {
      errors.push({ field: 'description', message: 'Description must be at least 20 characters', type: 'error' });
    } else if (data.description.length > 500) {
      errors.push({ field: 'description', message: 'Description must be less than 500 characters', type: 'error' });
    }

    if (!data.id.trim()) {
      errors.push({ field: 'id', message: 'ID is required', type: 'error' });
    } else if (!/^[a-z0-9-]+$/.test(data.id)) {
      errors.push({ field: 'id', message: 'ID must contain only lowercase letters, numbers, and hyphens', type: 'error' });
    } else if (!isCreateMode && habits.find(h => h.id === data.id && h.id !== editingHabit?.id)) {
      errors.push({ field: 'id', message: 'A habit with this ID already exists', type: 'error' });
    }

    // Time validation
    if (data.timeMinutes < 1) {
      errors.push({ field: 'timeMinutes', message: 'Time must be at least 1 minute', type: 'error' });
    } else if (data.timeMinutes > 180) {
      errors.push({ field: 'timeMinutes', message: 'Time must be less than 180 minutes', type: 'error' });
    }

    // Business logic warnings
    if (data.timeMinutes > 60 && data.difficulty === 'beginner') {
      errors.push({ field: 'timeMinutes', message: 'Long duration for beginner habits may reduce adoption', type: 'warning' });
    }

    if (data.researchBacked && data.sources.length === 0) {
      errors.push({ field: 'sources', message: 'Research-backed habits should have at least one source', type: 'warning' });
    }

    if (data.goalTags.length === 0) {
      errors.push({ field: 'goalTags', message: 'Consider adding goal tags to improve discoverability', type: 'warning' });
    }

    return errors;
  };

  const startEdit = (habit: HabitData) => {
    setEditingHabit(habit);
    setIsCreateMode(false);
    setFormData({
      id: habit.id,
      title: habit.title,
      description: habit.description,
      category: habit.category,
      difficulty: habit.difficulty,
      timeMinutes: habit.timeMinutes,
      language: habit.language,
      researchBacked: habit.researchBacked || false,
      sources: habit.sources || [],
      goalTags: habit.goalTags || []
    });
    setValidationErrors([]);
    setShowPreview(false);
  };

  const startCreate = () => {
    setIsCreateMode(true);
    setEditingHabit(null);
    setFormData({
      id: '',
      title: '',
      description: '',
      category: 'productivity',
      difficulty: 'beginner',
      timeMinutes: 10,
      language: selectedLanguage,
      researchBacked: false,
      sources: [],
      goalTags: []
    });
    setValidationErrors([]);
    setShowPreview(false);

    // Check for autosaved data
    const autosaved = localStorage.getItem('habitManager_autosave');
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
    setEditingHabit(null);
    setIsCreateMode(false);
    setFormData({
      id: '',
      title: '',
      description: '',
      category: 'productivity',
      difficulty: 'beginner',
      timeMinutes: 10,
      language: selectedLanguage,
      researchBacked: false,
      sources: [],
      goalTags: []
    });
    setValidationErrors([]);
    setShowPreview(false);
    localStorage.removeItem('habitManager_autosave');
  };

  const saveHabit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Validate form data
      const errors = validateHabit(formData);
      setValidationErrors(errors);

      const hasErrors = errors.some(e => e.type === 'error');
      if (hasErrors) {
        setError('Please fix validation errors before saving');
        return;
      }

      // For now, simulate save success since we don't have write API endpoints
      // In a real implementation, this would call contentAPI.saveHabit(formData)
      
      const updatedHabit: HabitData = {
        ...formData,
        createdAt: editingHabit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isCreateMode) {
        setHabits(prev => [...prev, updatedHabit]);
        setSuccess('✅ Habit created successfully!');
      } else {
        setHabits(prev => prev.map(h => h.id === formData.id ? updatedHabit : h));
        setSuccess('✅ Habit updated successfully!');
      }

      localStorage.removeItem('habitManager_autosave');
      cancelEdit();

      // Auto-clear success message
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      console.error('Failed to save habit:', error);
      setError('Failed to save habit');
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateHabit = (habit: HabitData) => {
    const newId = `${habit.id}-copy-${Date.now()}`;
    const duplicatedHabit: HabitData = {
      ...habit,
      id: newId,
      title: `${habit.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setFormData({
      id: duplicatedHabit.id,
      title: duplicatedHabit.title,
      description: duplicatedHabit.description,
      category: duplicatedHabit.category,
      difficulty: duplicatedHabit.difficulty,
      timeMinutes: duplicatedHabit.timeMinutes,
      language: duplicatedHabit.language,
      researchBacked: duplicatedHabit.researchBacked || false,
      sources: duplicatedHabit.sources || [],
      goalTags: duplicatedHabit.goalTags || []
    });

    setIsCreateMode(true);
    setEditingHabit(null);
    setValidationErrors([]);
  };

  const deleteHabit = async (habitId: string) => {
    if (!window.confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // For now, simulate delete success
      // In a real implementation, this would call contentAPI.deleteHabit(habitId)
      
      setHabits(prev => prev.filter(h => h.id !== habitId));
      setSuccess('✅ Habit deleted successfully!');

      // Auto-clear success message
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      console.error('Failed to delete habit:', error);
      setError('Failed to delete habit');
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

  const updateFormField = (field: keyof HabitFormData, value: any) => {
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

  // Filtered and searched habits
  const filteredHabits = useMemo(() => {
    return habits.filter(habit => {
      const matchesSearch = habit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           habit.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || habit.category === filterCategory;
      const matchesDifficulty = filterDifficulty === 'all' || habit.difficulty === filterDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [habits, searchTerm, filterCategory, filterDifficulty]);

  const renderHabitsList = () => (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Habits Manager ({filteredHabits.length} of {habits.length})
          </h3>
          <p className="text-sm text-gray-600">
            Manage habits for {selectedLanguage.toUpperCase()} language
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
            ➕ Create Habit
          </Button>
          
          <Button onClick={loadHabits} variant="secondary" disabled={isLoading}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search habits..."
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
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Difficulties</option>
          {DIFFICULTIES.map(diff => (
            <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Habits Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⏳</div>
          <p>Loading habits...</p>
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-600">
            {habits.length === 0 ? 'No habits found' : 'No habits match your search criteria'}
          </p>
          {habits.length === 0 && (
            <Button onClick={startCreate} variant="primary" className="mt-4">
              Create Your First Habit
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredHabits.map(habit => (
            <Card key={habit.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{habit.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{habit.description}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <Button onClick={() => startEdit(habit)} variant="ghost" size="sm">
                      ✏️
                    </Button>
                    <Button onClick={() => duplicateHabit(habit)} variant="ghost" size="sm">
                      📋
                    </Button>
                    <Button onClick={() => deleteHabit(habit.id)} variant="ghost" size="sm">
                      🗑️
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {habit.category}
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    {habit.difficulty}
                  </span>
                  <span>⏱️ {habit.timeMinutes}m</span>
                  {habit.researchBacked && <span>🔬 Research-backed</span>}
                </div>
                
                {habit.goalTags && habit.goalTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {habit.goalTags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {tag.replace('_', ' ')}
                      </span>
                    ))}
                    {habit.goalTags.length > 3 && (
                      <span className="text-xs text-gray-500">+{habit.goalTags.length - 3} more</span>
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
            {isCreateMode ? 'Create New Habit' : 'Edit Habit'}
          </h3>
          <p className="text-sm text-gray-600">
            {isCreateMode ? 'Add a new habit to the collection' : `Editing: ${editingHabit?.title}`}
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
            <h4 className="text-xl font-semibold text-gray-900 mb-3">{formData.title || 'Untitled Habit'}</h4>
            <p className="text-gray-700 mb-4">{formData.description || 'No description provided.'}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Category:</span>
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded">{formData.category}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Difficulty:</span>
                <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded">{formData.difficulty}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Time:</span>
                <span className="ml-2">⏱️ {formData.timeMinutes} minutes</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Research:</span>
                <span className="ml-2">{formData.researchBacked ? '🔬 Yes' : '❌ No'}</span>
              </div>
            </div>
            
            {formData.goalTags.length > 0 && (
              <div className="mt-4">
                <span className="font-medium text-gray-600">Goal Tags:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.goalTags.map(tag => (
                    <span key={tag} className="bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm">
                      {tag.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {formData.sources.length > 0 && (
              <div className="mt-4">
                <span className="font-medium text-gray-600">Research Sources:</span>
                <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                  {formData.sources.map((source, index) => (
                    <li key={index}>{source}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); saveHabit(); }} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Basic Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormField('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Morning Meditation"
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
                    placeholder="e.g., morning-meditation"
                    required
                  />
                  {validationErrors.find(e => e.field === 'id') && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.find(e => e.field === 'id')?.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Describe the habit, its benefits, and how to perform it..."
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-500">
                    {formData.description.length}/500 characters
                  </span>
                  {validationErrors.find(e => e.field === 'description') && (
                    <p className="text-sm text-red-600">
                      {validationErrors.find(e => e.field === 'description')?.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categorization */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Categorization</h4>
              
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
                    Difficulty *
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => updateFormField('difficulty', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    {DIFFICULTIES.map(diff => (
                      <option key={diff} value={diff}>
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.timeMinutes}
                    onChange={(e) => updateFormField('timeMinutes', parseInt(e.target.value) || 0)}
                    min="1"
                    max="180"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  {validationErrors.find(e => e.field === 'timeMinutes') && (
                    <p className="text-sm text-yellow-600 mt-1">
                      {validationErrors.find(e => e.field === 'timeMinutes')?.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Tags
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {GOAL_TAGS.map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.goalTags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFormField('goalTags', [...formData.goalTags, tag]);
                          } else {
                            updateFormField('goalTags', formData.goalTags.filter(t => t !== tag));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{tag.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
                {validationErrors.find(e => e.field === 'goalTags') && (
                  <p className="text-sm text-yellow-600 mt-1">
                    {validationErrors.find(e => e.field === 'goalTags')?.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Research and Sources */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Research & Sources</h4>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.researchBacked}
                    onChange={(e) => updateFormField('researchBacked', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    This habit is research-backed
                  </span>
                </label>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Research Sources (one per line)
                  </label>
                  <textarea
                    value={formData.sources.join('\n')}
                    onChange={(e) => updateFormField('sources', e.target.value.split('\n').filter(s => s.trim()))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="research-id-1&#10;research-id-2&#10;research-id-3"
                  />
                  {validationErrors.find(e => e.field === 'sources') && (
                    <p className="text-sm text-yellow-600 mt-1">
                      {validationErrors.find(e => e.field === 'sources')?.message}
                    </p>
                  )}
                </div>
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
                {isLoading ? '⏳ Saving...' : isCreateMode ? '✅ Create Habit' : '✅ Update Habit'}
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
      {editingHabit || isCreateMode ? renderEditForm() : renderHabitsList()}

      {/* Close Button */}
      {onClose && (
        <div className="mt-6 text-center">
          <Button onClick={onClose} variant="ghost">
            Close Habits Manager
          </Button>
        </div>
      )}
    </div>
  );
};