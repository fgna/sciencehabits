import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Card, CardHeader, CardContent } from '../ui';
import { useHabitStore, habitTemplates } from '../../stores/habitStore';
import { useUserStore } from '../../stores/userStore';
import { lifestyleOptions, timePreferenceOptions } from '../../stores/onboardingStore';
import { Goal, loadGoals, getAvailableGoals } from '../../services/goalsService';
import { Habit } from '../../types';

interface CreateHabitFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateHabitForm({ onClose, onSuccess }: CreateHabitFormProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [currentStep, setCurrentStep] = useState<'basic' | 'details' | 'preferences'>('basic');
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  
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

    loadAvailableGoals();
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
        timeTags: formData.timeTags
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

  const handleTemplateSelect = (template: typeof habitTemplates[0]) => {
    setFormData({
      title: template.title,
      description: template.description,
      category: template.category,
      timeMinutes: template.timeMinutes,
      difficulty: template.difficulty,
      instructions: template.instructions,
      equipment: 'none',
      goalTags: [],
      lifestyleTags: ['professional', 'parent', 'student'],
      timeTags: ['flexible']
    });
    setShowTemplates(false);
  };

  const categories = [
    { id: 'stress', name: 'Stress Management', icon: '🧘‍♀️', description: 'Reduce stress and anxiety' },
    { id: 'productivity', name: 'Productivity', icon: '⚡', description: 'Improve focus and efficiency' },
    { id: 'health', name: 'Physical Health', icon: '💪', description: 'Build strength and wellness' },
    { id: 'energy', name: 'Energy & Mood', icon: '🔋', description: 'Boost energy and positivity' },
    { id: 'sleep', name: 'Sleep & Recovery', icon: '😴', description: 'Better rest and recovery' }
  ];

  const difficulties = [
    { id: 'beginner', name: 'Beginner', description: 'Easy to start, low commitment', color: 'green' },
    { id: 'intermediate', name: 'Intermediate', description: 'Moderate effort required', color: 'yellow' },
    { id: 'advanced', name: 'Advanced', description: 'Challenging, high commitment', color: 'red' }
  ];

  const equipment = [
    { id: 'none', name: 'No Equipment', description: 'Can be done anywhere' },
    { id: 'minimal', name: 'Minimal Equipment', description: 'Basic items you likely have' },
    { id: 'equipment', name: 'Special Equipment', description: 'Requires specific gear' }
  ];

  const canProceed = () => {
    if (currentStep === 'basic') {
      return formData.title.trim() && formData.description.trim() && formData.timeMinutes > 0;
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
            {/* Template suggestions */}
            {!editingHabit && !showTemplates && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Need inspiration?</h4>
                    <p className="text-sm text-blue-700">Choose from proven habit templates</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplates(true)}
                  >
                    Browse Templates
                  </Button>
                </div>
              </div>
            )}

            {/* Template selection */}
            {showTemplates && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Habit Templates</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTemplates(false)}
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {habitTemplates.map((template, index) => (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="font-medium text-gray-900">{template.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{template.description}</div>
                        <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                          <span>{template.timeMinutes} min</span>
                          <span>•</span>
                          <span className="capitalize">{template.difficulty}</span>
                          <span>•</span>
                          <span className="capitalize">{template.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment
                  </label>
                  <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    value={formData.equipment}
                    onChange={(e) => setFormData({ equipment: e.target.value as any })}
                  >
                    {equipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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
            {['basic', 'details', 'preferences'].map((step, index) => {
              const stepIndex = ['basic', 'details', 'preferences'].indexOf(currentStep);
              const isActive = index <= stepIndex;
              return (
                <div key={step} className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-primary-600' : 'bg-gray-300'}`} />
                  {index < 2 && <div className={`w-8 h-0.5 ${isActive ? 'bg-primary-600' : 'bg-gray-300'}`} />}
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
                    const steps = ['basic', 'details', 'preferences'];
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
                    const steps = ['basic', 'details', 'preferences'];
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