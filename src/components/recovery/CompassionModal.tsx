/**
 * Compassion Modal Component
 * 
 * Shows research-backed compassionate messages when users miss habits,
 * providing scientific explanations for why missing days is normal
 * and offering recovery options to prevent abandonment.
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, Modal } from '../ui';
import { CompassionMessage, CompassionEvent } from '../../types/recovery';
import { useRecoveryStore } from '../../stores/recoveryStore';
import { useUserStore } from '../../stores/userStore';

interface CompassionModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitId: string;
  habitName: string;
  triggerCondition: string;
}

export function CompassionModal({ 
  isOpen, 
  onClose, 
  habitId, 
  habitName, 
  triggerCondition 
}: CompassionModalProps) {
  const [selectedRecoveryOption, setSelectedRecoveryOption] = useState<string | null>(null);
  const [showResearch, setShowResearch] = useState(false);
  const [startTime] = useState(Date.now());
  
  const { 
    compassionMessages, 
    recoverySettings,
    startRecoverySession,
    logCompassionEvent,
    generateMicroHabit
  } = useRecoveryStore();
  
  const { userHabits } = useUserStore();
  
  const message = compassionMessages.find(msg => 
    msg.triggerCondition === triggerCondition
  );
  
  const habit = userHabits.find(h => h.id === habitId);
  
  useEffect(() => {
    if (isOpen && message) {
      // Log that the compassion message was shown
      const event: CompassionEvent = {
        id: `event_${Date.now()}`,
        habitId,
        userId: 'current_user',
        triggeredDate: new Date().toISOString(),
        triggerCondition,
        messageShown: message,
        userResponse: 'dismissed',
        timeToResponse: 0,
        followUpNeeded: triggerCondition === 'third_consecutive'
      };
      
      logCompassionEvent(event);
    }
  }, [isOpen, message, habitId, triggerCondition, logCompassionEvent]);
  
  if (!message) return null;
  
  const handleRecoverySelection = (option: string) => {
    setSelectedRecoveryOption(option);
    
    // Log user response
    const event: CompassionEvent = {
      id: `event_${Date.now()}`,
      habitId,
      userId: 'current_user',
      triggeredDate: new Date().toISOString(),
      triggerCondition,
      messageShown: message,
      userResponse: 'accepted_recovery',
      recoveryOptionSelected: option,
      timeToResponse: (Date.now() - startTime) / 1000,
      followUpNeeded: false
    };
    
    logCompassionEvent(event);
    
    // Start appropriate recovery session
    if (option.includes('2-minute') || option.includes('micro') || option.includes('small')) {
      if (habit) {
        const microHabit = generateMicroHabit(habit);
        startRecoverySession(habitId, 'micro_habit');
      }
    } else if (option.includes('time') || option.includes('when')) {
      startRecoverySession(habitId, 'timing_adjustment');
    } else if (option.includes('support') || option.includes('friend') || option.includes('check')) {
      startRecoverySession(habitId, 'social_support');
    } else {
      startRecoverySession(habitId, 'reduced_frequency');
    }
    
    // Close modal after a brief delay to show confirmation
    setTimeout(() => {
      onClose();
      setSelectedRecoveryOption(null);
    }, 1500);
  };
  
  const getEmotionalIcon = (tone: string) => {
    switch (tone) {
      case 'supportive': return '🤗';
      case 'encouraging': return '💪';
      case 'understanding': return '💙';
      case 'motivational': return '🚀';
      default: return '✨';
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'gentle': return 'blue';
      case 'moderate': return 'yellow';
      case 'intensive': return 'red';
      default: return 'blue';
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-3xl">{getEmotionalIcon(message.emotionalTone)}</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              It's completely normal to miss days
            </h2>
            <p className="text-sm text-gray-500">
              {habitName} • Day missed
            </p>
          </div>
        </div>
        
        {/* Main Message */}
        <div className="mb-6">
          <p className="text-gray-700 text-base leading-relaxed mb-4">
            {message.message}
          </p>
          
          {/* Research Toggle */}
          {recoverySettings.showResearchExplanations && (
            <button
              onClick={() => setShowResearch(!showResearch)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>📚</span>
              <span>{showResearch ? 'Hide' : 'Show'} research explanation</span>
            </button>
          )}
        </div>
        
        {/* Research Explanation */}
        {showResearch && recoverySettings.showResearchExplanations && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                  <span className="mr-2">🔬</span>
                  Research shows:
                </h4>
                <p className="text-sm text-blue-800 mb-3">
                  {message.researchExplanation}
                </p>
                
                {message.researchCitation && (
                  <div className="text-xs text-blue-700 border-t border-blue-200 pt-2">
                    <strong>Source:</strong> {message.researchCitation.authors} ({message.researchCitation.year}). 
                    <em> {message.researchCitation.title}</em>. {message.researchCitation.journal}.
                    {message.researchCitation.url && (
                      <a 
                        href={message.researchCitation.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        View study
                      </a>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Recovery Options */}
        {!selectedRecoveryOption && (
          <div className="space-y-3 mb-6">
            <h3 className="text-base font-medium text-gray-900 mb-3">
              Choose your recovery approach:
            </h3>
            
            {message.recoveryOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleRecoverySelection(option)}
                className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-start space-x-3">
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {getRecoveryIcon(option)}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-blue-900">
                      {option}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {getRecoveryDescription(option)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* Recovery Confirmation */}
        {selectedRecoveryOption && (
          <div className="text-center py-6">
            <div className="inline-flex items-center space-x-2 text-green-600 mb-4">
              <span className="text-2xl">✅</span>
              <span className="font-medium">Recovery plan activated!</span>
            </div>
            <p className="text-gray-600 mb-4">
              You've chosen: <strong>{selectedRecoveryOption}</strong>
            </p>
            <p className="text-sm text-gray-500">
              We'll track your recovery progress and provide support along the way.
            </p>
          </div>
        )}
        
        {/* Action Buttons */}
        {!selectedRecoveryOption && (
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              I'll try again tomorrow
            </Button>
            <Button
              onClick={() => handleRecoverySelection('Continue tomorrow as planned')}
              className="flex-1"
            >
              Get back on track now
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// Helper functions
function getRecoveryIcon(option: string): string {
  if (option.includes('2-minute') || option.includes('small') || option.includes('tiny')) {
    return '⚡';
  } else if (option.includes('time') || option.includes('when')) {
    return '🕐';
  } else if (option.includes('support') || option.includes('friend') || option.includes('check')) {
    return '👥';
  } else if (option.includes('break') || option.includes('rest')) {
    return '🔄';
  } else if (option.includes('change') || option.includes('adjust')) {
    return '🎯';
  } else {
    return '🚀';
  }
}

function getRecoveryDescription(option: string): string {
  if (option.includes('2-minute') || option.includes('small') || option.includes('tiny')) {
    return 'Start with the smallest possible version to rebuild momentum';
  } else if (option.includes('time') || option.includes('when')) {
    return 'Find a time that works better with your current schedule';
  } else if (option.includes('support') || option.includes('friend') || option.includes('check')) {
    return 'Get accountability and encouragement from others';
  } else if (option.includes('break') || option.includes('rest')) {
    return 'Take a planned break and return when you\'re ready';
  } else if (option.includes('change') || option.includes('adjust')) {
    return 'Modify the habit to better fit your current situation';
  } else {
    return 'Continue with your original plan and routine';
  }
}