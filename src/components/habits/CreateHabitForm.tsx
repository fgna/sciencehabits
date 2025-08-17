import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Card, CardHeader, CardContent } from '../ui';
import { useHabitStore } from '../../stores/habitStore';
import { useUserStore } from '../../stores/userStore';
import { lifestyleOptions, timePreferenceOptions } from '../../stores/onboardingStore';
import { Goal, loadGoals, getAvailableGoals } from '../../services/goalsService';
import { Habit, HabitFrequency } from '../../types';
import { createDefaultFrequency, createWeeklyFrequency, getFrequencyDescription, createDefaultReminders } from '../../utils/frequencyHelpers';
import { getHabitCategories, getHabitDifficulties, HabitCategory, HabitDifficulty } from '../../config/ui';

interface CreateHabitFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateHabitForm({ onClose, onSuccess }: CreateHabitFormProps) {
  const [currentStep, setCurrentStep] = useState<'basic' | 'frequency' | 'details' | 'preferences'>('basic');
  const [selectedFrequency, setSelectedFrequency] = useState<HabitFrequency>(createDefaultFrequency());
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [difficulties, setDifficulties] = useState<HabitDifficulty[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  
  const { 
    formData, 
    formErrors, 
    isLoading,
    editingHabit,
    setFormData, 
    setFormError,
    clearFormErrors,
    createHabit,
    updateHabit,
    resetForm
  } = useHabitStore();
  
  const { currentUser } = useUserStore();

  useEffect(() => {
    const loadAvailableGoals = async () => {
      try {
        await loadGoals();
        const goals = getAvailableGoals(currentUser?.isPremium ?? false);
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
        const [cats, diffs] = await Promise.all([
          getHabitCategories(),
          getHabitDifficulties()
        ]);
        setCategories(cats);
        setDifficulties(diffs);
      } catch (error) {
        console.error('Failed to load UI configuration:', error);
      } finally {
        setConfigLoading(false);
      }
    };

    loadAvailableGoals();
    loadUIConfiguration();
  }, [currentUser?.isPremium]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    clearFormErrors();
    
    let success = false;
    if (editingHabit) {
      // Convert form data to partial habit updates
      const habitUpdates: Partial<Habit> = {
        title: formData.title,
        description: formData.description,
        timeMinutes: formData.timeMinutes,
        category: formData.category,
        difficulty: formData.difficulty as any, // Allow flexible difficulty values
        equipment: formData.equipment,
        instructions: formData.instructions,
        goalTags: formData.goalTags,
        lifestyleTags: formData.lifestyleTags,
        timeTags: formData.timeTags,
        frequency: selectedFrequency,
        reminders: createDefaultReminders()
      };
      success = await updateHabit(editingHabit.id, habitUpdates);
    } else {
      const habit = await createHabit(currentUser.id);
      success = !!habit;
    }
    
    if (success) {
      resetForm();
      onSuccess();
      onClose();
    }
  };

  const canProceed = () => {
    if (currentStep === 'basic') {
      return formData.title.trim() && formData.description.trim() && formData.timeMinutes > 0;
    }
    if (currentStep === 'frequency') {
      return selectedFrequency.type !== undefined;
    }
    if (currentStep === 'details') {
      return formData.instructions.trim();
    }
    return formData.goalTags.length > 0 && formData.lifestyleTags.length > 0 && formData.timeTags.length > 0;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">

            {/* Basic info form */}
            <div className="space-y-4">
              <Input
                label="Habit Title *"
                placeholder="e.g., 10-minute morning walk"
                value={formData.title}
                onChange={(e) => setFormData({ title: e.target.value })}
                error={formErrors.title}
                maxLength={60}
              />

              <Textarea
                label="Description *"
                placeholder="Brief description of what this habit involves..."
                value={formData.description}
                onChange={(e) => setFormData({ description: e.target.value })}
                error={formErrors.description}
                maxLength={150}
                rows={2}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Duration (minutes) *"
                  placeholder="5"
                  value={formData.timeMinutes}
                  onChange={(e) => setFormData({ timeMinutes: parseInt(e.target.value) || 0 })}
                  error={formErrors.timeMinutes}
                  min={1}
                  max={120}
                />

              </div>
            </div>
          </div>
        );

      case 'frequency':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How often will you do this habit?</h3>
              <p className="text-gray-600">Choose the frequency that works best for your lifestyle</p>
            </div>

            {/* Frequency Type Selection */}
            <div className="space-y-4">
              {/* Daily Option */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedFrequency.type === 'daily' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-primary-300'
                }`}
                onClick={() => setSelectedFrequency(createDefaultFrequency())}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl mt-1">📅</div>
                  <div className="flex-1">
                    <div className={`font-semibold ${selectedFrequency.type === 'daily' ? 'text-primary-900' : 'text-gray-900'}`}>
                      Daily Habit
                    </div>
                    <div className={`text-sm ${selectedFrequency.type === 'daily' ? 'text-primary-700' : 'text-gray-600'}`}>
                      Do this habit every day
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Best for building consistent routines like meditation, reading, or exercise
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Option */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedFrequency.type === 'weekly' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-primary-300'
                }`}
                onClick={() => setSelectedFrequency(createWeeklyFrequency(3, []))}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl mt-1">📊</div>
                  <div className="flex-1">
                    <div className={`font-semibold ${selectedFrequency.type === 'weekly' ? 'text-primary-900' : 'text-gray-900'}`}>
                      Weekly Goal
                    </div>
                    <div className={`text-sm ${selectedFrequency.type === 'weekly' ? 'text-primary-700' : 'text-gray-600'}`}>
                      Set a target number of times per week
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Perfect for gym sessions, social activities, or learning new skills
                    </div>
                  </div>
                </div>
              </div>

              {/* Periodic Option */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedFrequency.type === 'periodic' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-primary-300'
                }`}
                onClick={() => setSelectedFrequency({
                  type: 'periodic',
                  periodicTarget: {
                    interval: 'weekly',
                    intervalCount: 1
                  }
                })}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl mt-1">🔄</div>
                  <div className="flex-1">
                    <div className={`font-semibold ${selectedFrequency.type === 'periodic' ? 'text-primary-900' : 'text-gray-900'}`}>
                      Periodic Habit
                    </div>
                    <div className={`text-sm ${selectedFrequency.type === 'periodic' ? 'text-primary-700' : 'text-gray-600'}`}>
                      Set intervals like weekly, monthly, or quarterly
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Great for maintenance tasks, reviews, or less frequent activities
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Frequency Configuration */}
            {selectedFrequency.type === 'weekly' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Weekly Goal Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">
                      How many times per week?
                    </label>
                    <select 
                      className="block w-32 px-3 py-2 border border-blue-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      value={selectedFrequency.weeklyTarget?.sessionsPerWeek || 3}
                      onChange={(e) => setSelectedFrequency(createWeeklyFrequency(
                        parseInt(e.target.value),
                        selectedFrequency.weeklyTarget?.preferredDays || []
                      ))}
                    >
                      {[1,2,3,4,5,6,7].map(num => (
                        <option key={num} value={num}>{num} times</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      Preferred days (optional)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                        const isSelected = selectedFrequency.weeklyTarget?.preferredDays?.includes(day) || false;
                        return (
                          <button
                            key={day}
                            type="button"
                            className={`px-2 py-1 text-xs rounded ${
                              isSelected 
                                ? 'bg-blue-200 text-blue-800 border border-blue-300' 
                                : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
                            }`}
                            onClick={() => {
                              const currentDays = selectedFrequency.weeklyTarget?.preferredDays || [];
                              const newDays = isSelected 
                                ? currentDays.filter(d => d !== day)
                                : [...currentDays, day];
                              setSelectedFrequency(createWeeklyFrequency(
                                selectedFrequency.weeklyTarget?.sessionsPerWeek || 3,
                                newDays
                              ));
                            }}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedFrequency.type === 'periodic' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-3">Periodic Schedule</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-800 mb-1">
                      Every
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      className="block w-full px-3 py-2 border border-purple-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                      value={selectedFrequency.periodicTarget?.intervalCount || 1}
                      onChange={(e) => setSelectedFrequency({
                        ...selectedFrequency,
                        periodicTarget: {
                          ...selectedFrequency.periodicTarget!,
                          intervalCount: parseInt(e.target.value) || 1
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-800 mb-1">
                      Interval
                    </label>
                    <select 
                      className="block w-full px-3 py-2 border border-purple-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                      value={selectedFrequency.periodicTarget?.interval || 'weekly'}
                      onChange={(e) => setSelectedFrequency({
                        ...selectedFrequency,
                        periodicTarget: {
                          ...selectedFrequency.periodicTarget!,
                          interval: e.target.value as 'weekly' | 'monthly' | 'quarterly' | 'yearly'
                        }
                      })}
                    >
                      <option value="weekly">Week(s)</option>
                      <option value="monthly">Month(s)</option>
                      <option value="quarterly">Quarter(s)</option>
                      <option value="yearly">Year(s)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Frequency Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <p className="text-sm text-gray-700">
                {getFrequencyDescription(selectedFrequency)}
              </p>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            {/* Category selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category *
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {categories.map((cat) => {
                  const isSelected = formData.category === cat.id;
                  return (
                    <div
                      key={cat.id}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                      onClick={() => setFormData({ category: cat.id as any })}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{cat.icon}</span>
                        <div>
                          <div className={`font-medium ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                            {cat.name}
                          </div>
                          <div className={`text-sm ${isSelected ? 'text-primary-700' : 'text-gray-500'}`}>
                            {cat.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {formErrors.category && (
                <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
              )}
            </div>

            {/* Difficulty selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Difficulty Level *
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {difficulties.map((diff) => {
                  const isSelected = formData.difficulty === diff.id;
                  const colorClasses = {
                    green: isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300',
                    yellow: isSelected ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300',
                    red: isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
                  };
                  
                  return (
                    <div
                      key={diff.id}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${colorClasses[diff.color as keyof typeof colorClasses]}`}
                      onClick={() => setFormData({ difficulty: diff.id as any })}
                    >
                      <div className={`font-medium ${isSelected ? `text-${diff.color}-900` : 'text-gray-900'}`}>
                        {diff.name}
                      </div>
                      <div className={`text-sm ${isSelected ? `text-${diff.color}-700` : 'text-gray-500'}`}>
                        {diff.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instructions */}
            <Textarea
              label="Step-by-step Instructions *"
              placeholder="1. First step...&#10;2. Second step...&#10;3. Final step..."
              value={formData.instructions}
              onChange={(e) => setFormData({ instructions: e.target.value })}
              error={formErrors.instructions}
              maxLength={500}
              rows={5}
              helpText="Write clear, numbered steps that anyone can follow"
            />
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            {/* Goal tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Which goals does this habit support? *
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {availableGoals.map((goal) => {
                  const isSelected = formData.goalTags.includes(goal.id);
                  return (
                    <label key={goal.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newTags = e.target.checked 
                            ? [...formData.goalTags, goal.id]
                            : formData.goalTags.filter(t => t !== goal.id);
                          setFormData({ goalTags: newTags });
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{goal.title}</div>
                        <div className="text-sm text-gray-500">{goal.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {formErrors.goalTags && (
                <p className="mt-1 text-sm text-red-600">{formErrors.goalTags}</p>
              )}
            </div>

            {/* Lifestyle tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Which lifestyles is this suitable for? *
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                {lifestyleOptions.map((lifestyle) => {
                  const isSelected = formData.lifestyleTags.includes(lifestyle.id);
                  return (
                    <label key={lifestyle.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newTags = e.target.checked 
                            ? [...formData.lifestyleTags, lifestyle.id]
                            : formData.lifestyleTags.filter(t => t !== lifestyle.id);
                          setFormData({ lifestyleTags: newTags });
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{lifestyle.title}</div>
                        <div className="text-sm text-gray-500">{lifestyle.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {formErrors.lifestyleTags && (
                <p className="mt-1 text-sm text-red-600">{formErrors.lifestyleTags}</p>
              )}
            </div>

            {/* Time preference tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                When can this habit be done? *
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {timePreferenceOptions.map((time) => {
                  const isSelected = formData.timeTags.includes(time.id);
                  return (
                    <label key={time.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newTags = e.target.checked 
                            ? [...formData.timeTags, time.id]
                            : formData.timeTags.filter(t => t !== time.id);
                          setFormData({ timeTags: newTags });
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{time.title}</div>
                        <div className="text-sm text-gray-500">{time.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {formErrors.timeTags && (
                <p className="mt-1 text-sm text-red-600">{formErrors.timeTags}</p>
              )}
            </div>
          </div>
        );
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'basic': return 'Basic Information';
      case 'frequency': return 'Frequency & Schedule';
      case 'details': return 'Category & Instructions';
      case 'preferences': return 'Goals & Preferences';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingHabit ? 'Edit Habit' : 'Create New Habit'}
              </h2>
              <p className="text-sm text-gray-500">{getStepTitle()}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center mt-4 space-x-2">
            {['basic', 'frequency', 'details', 'preferences'].map((step, index) => {
              const stepIndex = ['basic', 'frequency', 'details', 'preferences'].indexOf(currentStep);
              const isActive = index <= stepIndex;
              return (
                <div key={step} className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-primary-600' : 'bg-gray-300'}`} />
                  {index < 3 && <div className={`w-8 h-0.5 ${isActive ? 'bg-primary-600' : 'bg-gray-300'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 max-h-[calc(90vh-200px)] overflow-y-auto">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex space-x-3">
              {currentStep !== 'basic' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const steps = ['basic', 'frequency', 'details', 'preferences'];
                    const currentIndex = steps.indexOf(currentStep);
                    setCurrentStep(steps[currentIndex - 1] as any);
                  }}
                >
                  Back
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {currentStep !== 'preferences' ? (
                <Button
                  type="button"
                  onClick={() => {
                    const steps = ['basic', 'frequency', 'details', 'preferences'];
                    const currentIndex = steps.indexOf(currentStep);
                    setCurrentStep(steps[currentIndex + 1] as any);
                  }}
                  disabled={!canProceed()}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  isLoading={isLoading}
                  disabled={!canProceed() || isLoading}
                >
                  {editingHabit ? 'Update Habit' : 'Create Habit'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}