import React from 'react';
import { Goal } from '../../services/goalsService';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';

interface GoalExplainerProps {
  goal: Goal;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function GoalExplainer({ goal, isExpanded = false, onToggle }: GoalExplainerProps) {
  const { animationsEnabled, emotionalDesign } = useUIPreferencesStore();

  const researchCredibilityColor = goal.researchLevel === 'high' ? 'research-high' : 
                                  goal.researchLevel === 'medium' ? 'research-medium' : 'research-low';

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${
      animationsEnabled ? 'transition-all duration-300' : ''
    }`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="text-2xl mr-3">{goal.icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {goal.title}
              </h3>
              <p className="text-sm text-gray-600">
                {goal.description}
              </p>
            </div>
          </div>
          
          {onToggle && (
            <button
              onClick={onToggle}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Hide' : 'Show'} more about ${goal.title}`}
            >
              <svg 
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className={`border-t border-gray-100 ${animationsEnabled ? 'animate-fade-in' : ''}`}>
          <div className="p-4 space-y-4">
            {/* Research Backing */}
            <div>
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 mr-2 text-research-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                </svg>
                <h4 className="text-sm font-medium text-gray-900">Scientific Backing</h4>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full research-badge ${researchCredibilityColor}`}>
                  {goal.researchLevel || 'medium'} evidence
                </span>
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                {goal.researchSummary || 
                 `This goal is supported by scientific research showing measurable benefits for ${goal.category} outcomes.`}
              </p>
            </div>

            {/* Benefits */}
            <div>
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 mr-2 text-compassion-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h4 className="text-sm font-medium text-gray-900">Expected Benefits</h4>
              </div>
              
              <ul className="text-sm text-gray-600 space-y-1">
                {(goal.benefits || [
                  'Improved daily wellbeing',
                  'Better long-term health outcomes',
                  'Increased life satisfaction'
                ]).map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-compassion-500 mr-2 mt-0.5">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Time Investment */}
            <div>
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 mr-2 text-progress-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <h4 className="text-sm font-medium text-gray-900">Time Investment</h4>
              </div>
              
              <p className="text-sm text-gray-600">
                Most habits for this goal take <strong>5-15 minutes daily</strong>.
                You'll see initial benefits within <strong>1-2 weeks</strong> and significant 
                improvements after <strong>4-8 weeks</strong> of consistent practice.
              </p>
            </div>

            {/* Common Concerns */}
            {goal.commonConcerns && (
              <div>
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 mr-2 text-recovery-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h4 className="text-sm font-medium text-gray-900">Common Concerns</h4>
                </div>
                
                <div className="text-sm text-gray-600 space-y-2">
                  {goal.commonConcerns.map((concern, index) => (
                    <div key={index} className="p-2 bg-recovery-50 rounded border border-recovery-200">
                      <p className="font-medium text-recovery-800">{concern.concern}</p>
                      <p className="text-recovery-700 mt-1">{concern.response}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}