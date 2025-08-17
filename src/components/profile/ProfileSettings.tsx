import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../../types';
import { Button } from '../ui';
import { useUserStore } from '../../stores/userStore';
import { AppGoal, loadMainGoals } from '../../config/goals';
import { getTimeOptions, getSupportedLanguages, TimeOption, Language } from '../../config/ui';
import { dbHelpers } from '../../services/storage/database';

interface ProfileSettingsProps {
  user: User;
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    goals: user.goals,
    dailyMinutes: user.dailyMinutes,
    preferredTime: user.preferredTime,
    language: user.language
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [availableGoals, setAvailableGoals] = useState<AppGoal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [timeOptions, setTimeOptions] = useState<TimeOption[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { updateUser, clearUser } = useUserStore();
  
  // Auto-save functionality
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');

  const autoSave = useCallback(async () => {
    try {
      setSaveStatus('saving');
      
      // Update user via store
      await updateUser({
        name: formData.name || undefined,
        goals: formData.goals,
        dailyMinutes: formData.dailyMinutes,
        preferredTime: formData.preferredTime,
        language: formData.language
      });
      
      // Mark this data as saved
      lastSavedDataRef.current = JSON.stringify(formData);
      setSaveStatus('saved');
      
    } catch (error) {
      console.error('Failed to auto-save profile:', error);
      setSaveStatus('error');
    }
  }, [formData, updateUser]);

  // Auto-save effect - saves changes after user stops typing/selecting for 1 second
  useEffect(() => {
    const currentData = JSON.stringify(formData);
    const originalData = JSON.stringify({
      name: user.name || '',
      goals: user.goals,
      dailyMinutes: user.dailyMinutes,
      preferredTime: user.preferredTime,
      language: user.language
    });
    
    // Only auto-save if data has changed and is different from what we last saved
    if (currentData !== originalData && currentData !== lastSavedDataRef.current) {
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 1000); // Save after 1 second of inactivity
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, user, autoSave]);

  useEffect(() => {
    loadAvailableGoals();
    loadUIConfiguration();
  }, []);

  const loadAvailableGoals = async () => {
    try {
      setGoalsLoading(true);
      const goals = await loadMainGoals();
      setAvailableGoals(goals);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setGoalsLoading(false);
    }
  };

  const loadUIConfiguration = async () => {
    try {
      setConfigLoading(true);
      const [timeOpts, langs] = await Promise.all([
        getTimeOptions(),
        getSupportedLanguages()
      ]);
      setTimeOptions(timeOpts);
      setLanguages(langs);
    } catch (error) {
      console.error('Failed to load UI configuration:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  // Legacy manual save function (keeping for compatibility, but hiding the button)
  const handleSave = async () => {
    await autoSave();
  };

  const handleGoalToggle = (goalId: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  const handleDeleteAllData = async () => {
    try {
      setIsDeleting(true);
      
      // Clear all data from IndexedDB
      await dbHelpers.clearAllData();
      
      // Clear user state
      clearUser();
      
      // Clear any localStorage items related to the app
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sciencehabits') || 
            key.startsWith('habit') || 
            key.startsWith('user') ||
            key.startsWith('analytics') ||
            key.startsWith('onboarding')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Reload the page to ensure fresh start
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to delete all data:', error);
      alert('Failed to delete all data. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name (Optional)
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter your name for personalized greetings"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

      </div>

      {/* Goals */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Goals</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select all goals that matter to you. This helps us recommend the most relevant habits.
        </p>
        {goalsLoading ? (
          <div className="col-span-2 text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading goals...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableGoals.map((goal) => (
              <button
                key={goal.id}
                type="button"
                onClick={() => handleGoalToggle(goal.id)}
                className={`flex items-center space-x-3 p-3 rounded-lg border text-left transition-colors ${
                  formData.goals.includes(goal.id)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <span className="text-xl">{goal.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{goal.title}</span>
                </div>
                {formData.goals.includes(goal.id) && (
                  <svg className="w-4 h-4 ml-auto text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
        {/* MVP: Daily Time Commitment Disabled for MVP - restore for full version
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Time Commitment
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={formData.dailyMinutes}
              onChange={(e) => setFormData(prev => ({ ...prev, dailyMinutes: parseInt(e.target.value) }))}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-900 min-w-[80px]">
              {formData.dailyMinutes} minutes
            </span>
          </div>
        </div>
        */}

        {/* MVP: Preferred Time Disabled for MVP - restore for full version
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Time
          </label>
          {configLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading options...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {timeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, preferredTime: option.id as any }))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    formData.preferredTime === option.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{option.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        */}
      </div>

      {/* MVP: Language Settings Disabled for MVP - restore for full version
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Language & Display</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          {configLoading ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              Loading languages...
            </div>
          ) : (
            <select
              value={formData.language}
              onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value as 'en' | 'de' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.nativeName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      */}

      {/* Data Management */}
      <div className="space-y-4 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Delete All Personal Data</h4>
              <p className="text-sm text-red-700 mt-1">
                This will permanently delete all your habits, progress, analytics, and personal settings. 
                This action cannot be undone and will restart the app as if you're a new user.
              </p>
              <div className="mt-3">
                {!showDeleteConfirm ? (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="outline"
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    Delete All Data
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-red-800">
                      Are you absolutely sure? This action is irreversible.
                    </p>
                    <div className="flex space-x-3">
                      <Button
                        onClick={handleDeleteAllData}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
                      </Button>
                      <Button
                        onClick={() => setShowDeleteConfirm(false)}
                        variant="outline"
                        disabled={isDeleting}
                        className="text-gray-700 border-gray-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-save Status */}
      <div className="flex items-center justify-center pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-sm">
          {saveStatus === 'saving' && (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              <span className="text-gray-600">Saving changes...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-green-600">All changes saved automatically</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-600">Failed to save changes</span>
              <Button
                onClick={handleSave}
                size="sm"
                variant="outline"
                className="ml-2 text-xs"
              >
                Retry
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}