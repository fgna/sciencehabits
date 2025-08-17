import React, { useState } from 'react';
import { Button, Input, Textarea } from '../ui';
import { useHabitStore } from '../../stores/habitStore';
import { useUserStore } from '../../stores/userStore';
import { createDefaultFrequency, createDefaultReminders } from '../../utils/frequencyHelpers';

interface CreateHabitFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateHabitForm({ onClose, onSuccess }: CreateHabitFormProps) {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const { 
    formData, 
    formErrors, 
    isLoading,
    editingHabit,
    setFormData, 
    clearFormErrors,
    createHabit,
    updateHabit,
    resetForm
  } = useHabitStore();
  
  const { currentUser } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    clearFormErrors();
    
    // Set sensible defaults for simplified form
    const defaultData = {
      ...formData,
      category: 'feel_better', // Default category
      difficulty: 'beginner', // Default difficulty
      equipment: 'none', // Default equipment
      instructions: formData.description, // Use description as instructions
      goalTags: ['feel_better'], // Default goal tags
      lifestyleTags: ['all'], // Default lifestyle tags
      timeTags: ['flexible'] // Default time tags
    };
    
    // Update the form data with defaults
    setFormData(defaultData);
    
    let success = false;
    if (editingHabit) {
      // Convert form data to partial habit updates
      const habitUpdates = {
        title: formData.title,
        description: formData.description,
        timeMinutes: formData.timeMinutes,
        category: 'feel_better',
        difficulty: 'beginner' as const,
        equipment: 'none',
        instructions: formData.description,
        goalTags: ['feel_better'],
        lifestyleTags: ['all'],
        timeTags: ['flexible'],
        frequency: createDefaultFrequency(),
        reminders: createDefaultReminders()
      };
      success = await updateHabit(editingHabit.id, habitUpdates);
    } else {
      const habit = await createHabit(currentUser.id);
      success = !!habit;
    }
    
    if (success) {
      setShowSuccessMessage(true);
      resetForm();
      onSuccess();
      
      // Close after showing success message
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();
      }, 2500);
    }
  };

  const canProceed = () => {
    return formData.title.trim() && formData.description.trim() && formData.timeMinutes > 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingHabit ? 'Edit Habit' : 'Create Custom Habit'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-green-800">
                      {editingHabit ? 'Habit Updated!' : 'Habit Created!'}
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      {editingHabit ? 'Your changes have been saved.' : 'Your new habit has been added to your collection.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Simplified Form */}
            <div className="space-y-6">
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
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <strong>Note:</strong> Your habit will be set to daily frequency by default. 
                    You can customize frequency, category, and other settings after creation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>

            <div className="flex space-x-3">
              <Button
                type="submit"
                isLoading={isLoading}
                disabled={!canProceed() || isLoading}
              >
                {editingHabit ? 'Update Habit' : 'Create Habit'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}