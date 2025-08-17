import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../../types';
import { Button, Card, CardContent } from '../ui';
import { useUserStore } from '../../stores/userStore';
import { Goal, getAvailableGoalsForProfile } from '../../services/goalsService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    goals: user.goals,
    dailyMinutes: user.dailyMinutes,
    preferredTime: user.preferredTime,
    lifestyle: user.lifestyle,
    language: user.language
  });
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const { updateUser } = useUserStore();
  
  // Auto-save functionality
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');

  const lifestyleOptions = [
    { id: 'professional', label: 'Working Professional', icon: '💼' },
    { id: 'student', label: 'Student', icon: '📚' },
    { id: 'parent', label: 'Parent/Caregiver', icon: '👨‍👩‍👧‍👦' }
  ];

  const timeOptions = [
    { id: 'morning', label: 'Morning Person', description: 'I prefer starting my day with habits' },
    { id: 'lunch', label: 'Midday Focus', description: 'I work best during lunch breaks' },
    { id: 'evening', label: 'Evening Routine', description: 'I like to wind down with habits' },
    { id: 'flexible', label: 'Flexible', description: 'I can adapt to any time' }
  ];

  const autoSave = useCallback(async () => {
    try {
      setSaveStatus('saving');
      
      // Use current formData values when called
      const currentFormData = formData;
      
      // Update user via store
      await updateUser({
        name: currentFormData.name || undefined,
        goals: currentFormData.goals,
        dailyMinutes: currentFormData.dailyMinutes,
        preferredTime: currentFormData.preferredTime,
        lifestyle: currentFormData.lifestyle,
        language: currentFormData.language
      });
      
      // Mark this data as saved
      lastSavedDataRef.current = JSON.stringify(currentFormData);
      setSaveStatus('saved');
      
    } catch (error) {
      console.error('Failed to auto-save profile:', error);
      setSaveStatus('error');
    }
  }, [formData, updateUser]);

  // Auto-save effect - saves changes after user stops making changes for 1 second
  useEffect(() => {
    const currentData = JSON.stringify(formData);
    const originalData = JSON.stringify({
      name: user.name || '',
      goals: user.goals,
      dailyMinutes: user.dailyMinutes,
      preferredTime: user.preferredTime,
      lifestyle: user.lifestyle,
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

  const loadAvailableGoals = useCallback(async () => {
    try {
      setGoalsLoading(true);
      const goals = await getAvailableGoalsForProfile(user.isPremium);
      setAvailableGoals(goals);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setGoalsLoading(false);
    }
  }, [user.isPremium]);

  useEffect(() => {
    if (isOpen) {
      loadAvailableGoals();
    }
  }, [isOpen, loadAvailableGoals]);


  const handleSave = async () => {
    await autoSave();
  };

  const handleClose = () => {
    // Clear any pending saves when closing
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    onClose();
  };

  const handleGoalToggle = (goalId: string) => {
    const goal = availableGoals.find(g => g.id === goalId);
    
    // Prevent selecting premium goals for non-premium users
    if (goal?.tier === 'premium' && !user.isPremium) {
      // Could show a modal here to upgrade to premium
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">👤</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={false}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal Info */}
          <Card>
            <CardContent>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lifestyle
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {lifestyleOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, lifestyle: option.id as any }))}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          formData.lifestyle === option.id
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-lg mb-1">{option.icon}</div>
                        <div className="font-medium text-sm">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardContent>
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
                      } ${goal.tier === 'premium' && !user.isPremium ? 'opacity-60' : ''}`}
                      disabled={goal.tier === 'premium' && !user.isPremium}
                    >
                      <span className="text-xl">{goal.icon}</span>
                      <div className="flex-1">
                        <span className="font-medium text-sm">{goal.title}</span>
                        {goal.tier === 'premium' && !user.isPremium && (
                          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full ml-2">PRO</span>
                        )}
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
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardContent>
              <div className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time
                  </label>
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
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personalization Settings */}
          <Card>
            <CardContent>
              <h3 className="text-lg font-medium text-gray-900 mb-4">AI Personalization</h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Control how ScienceHabits personalizes your experience with AI-powered features.
                </p>
                
                {/* Simplified personalization level selector */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Personalization Level
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'minimal', name: 'Minimal', desc: 'Basic tracking only' },
                      { id: 'balanced', name: 'Balanced', desc: 'Smart suggestions' },
                      { id: 'adaptive', name: 'Adaptive', desc: 'AI-powered optimization' },
                      { id: 'comprehensive', name: 'Full AI', desc: 'Maximum personalization' }
                    ].map((level) => (
                      <button
                        key={level.id}
                        type="button"
                        className="p-3 rounded-lg border text-left transition-colors border-gray-300 hover:border-gray-400"
                      >
                        <div className="font-medium text-sm">{level.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{level.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  💡 Advanced personalization settings can be accessed from the main settings menu.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-save Status */}
          <div className="flex items-center justify-between pt-4">
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
                  <span className="text-green-600">Changes saved automatically</span>
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
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={saveStatus === 'saving'}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}