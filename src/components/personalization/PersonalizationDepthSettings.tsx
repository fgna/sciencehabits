import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { useUserStore } from '../../stores/userStore';

interface PersonalizationLevel {
  id: 'minimal' | 'balanced' | 'adaptive' | 'comprehensive';
  name: string;
  description: string;
  features: string[];
  dataCollection: 'low' | 'medium' | 'high';
  adaptiveness: 'static' | 'learning' | 'dynamic';
  examples: string[];
  pros: string[];
  considerations: string[];
}

interface PersonalizationSettings {
  level: PersonalizationLevel['id'];
  dataSharing: {
    analytics: boolean;
    habitPatterns: boolean;
    researchParticipation: boolean;
    anonymousUsage: boolean;
  };
  adaptiveFeatures: {
    smartScheduling: boolean;
    difficultyAdjustment: boolean;
    contextualHints: boolean;
    recoveryDetection: boolean;
    motivationalTiming: boolean;
  };
  privacySettings: {
    localStorageOnly: boolean;
    dataRetentionDays: number;
    shareWithResearchers: boolean;
    allowPersonalizedContent: boolean;
  };
}

interface PersonalizationDepthProps {
  user: User;
  onSave: (settings: PersonalizationSettings) => void;
  onClose: () => void;
}

export function PersonalizationDepthSettings({ user, onSave, onClose }: PersonalizationDepthProps) {
  const { emotionalDesign } = useUIPreferencesStore();
  const [selectedLevel, setSelectedLevel] = useState<PersonalizationLevel['id']>('balanced');
  const [customSettings, setCustomSettings] = useState<PersonalizationSettings>({
    level: 'balanced',
    dataSharing: {
      analytics: true,
      habitPatterns: true,
      researchParticipation: false,
      anonymousUsage: true
    },
    adaptiveFeatures: {
      smartScheduling: true,
      difficultyAdjustment: true,
      contextualHints: true,
      recoveryDetection: true,
      motivationalTiming: true
    },
    privacySettings: {
      localStorageOnly: false,
      dataRetentionDays: 365,
      shareWithResearchers: false,
      allowPersonalizedContent: true
    }
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const personalizationLevels: PersonalizationLevel[] = [
    {
      id: 'minimal',
      name: 'Minimal Personalization',
      description: 'Basic habit tracking with minimal data collection and static recommendations',
      features: [
        'Simple habit tracking',
        'Basic progress charts',
        'Static motivational messages',
        'Manual difficulty adjustment'
      ],
      dataCollection: 'low',
      adaptiveness: 'static',
      examples: [
        'Same motivational quotes for everyone',
        'Fixed habit suggestions',
        'Basic completion tracking'
      ],
      pros: [
        'Maximum privacy',
        'Consistent experience',
        'No algorithm bias',
        'Offline capable'
      ],
      considerations: [
        'Less relevant suggestions',
        'No adaptive difficulty',
        'Generic experience',
        'Manual optimization needed'
      ]
    },
    {
      id: 'balanced',
      name: 'Balanced Personalization',
      description: 'Smart features with thoughtful data usage and moderate adaptation',
      features: [
        'Smart habit suggestions',
        'Adaptive difficulty adjustment',
        'Contextual research insights',
        'Pattern-based recommendations'
      ],
      dataCollection: 'medium',
      adaptiveness: 'learning',
      examples: [
        'Suggests habits based on your goals',
        'Adjusts difficulty when you struggle',
        'Shows research relevant to your interests'
      ],
      pros: [
        'Improved relevance',
        'Gentle adaptation',
        'Research-backed suggestions',
        'Privacy-conscious'
      ],
      considerations: [
        'Some data collection',
        'Learning period required',
        'May not suit all preferences',
        'Moderate complexity'
      ]
    },
    {
      id: 'adaptive',
      name: 'Adaptive Intelligence',
      description: 'AI-powered personalization that learns and adapts to your unique patterns',
      features: [
        'Dynamic scheduling optimization',
        'Predictive recovery detection',
        'Personalized motivational timing',
        'Contextual research integration'
      ],
      dataCollection: 'high',
      adaptiveness: 'dynamic',
      examples: [
        'Predicts when you might struggle',
        'Optimizes habit timing to your schedule',
        'Personalizes motivational messages'
      ],
      pros: [
        'Highly relevant experience',
        'Proactive support',
        'Continuous improvement',
        'Advanced insights'
      ],
      considerations: [
        'Requires more data',
        'Algorithm dependency',
        'Potential over-optimization',
        'Less predictable behavior'
      ]
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive Optimization',
      description: 'Full AI personalization with research participation and maximum adaptation',
      features: [
        'Advanced behavioral prediction',
        'Multi-dimensional optimization',
        'Research contribution opportunities',
        'Experimental feature access'
      ],
      dataCollection: 'high',
      adaptiveness: 'dynamic',
      examples: [
        'Contributes to habit formation research',
        'Access to experimental features',
        'Deep behavioral insights'
      ],
      pros: [
        'Cutting-edge features',
        'Contributes to science',
        'Maximum optimization',
        'Early feature access'
      ],
      considerations: [
        'Maximum data sharing',
        'Experimental features may be unstable',
        'Algorithm complexity',
        'Research participation commitment'
      ]
    }
  ];

  useEffect(() => {
    // Load existing settings if available
    const savedSettings = localStorage.getItem(`personalization_${user.id}`);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSelectedLevel(parsed.level);
        setCustomSettings(parsed);
      } catch (error) {
        console.error('Failed to load personalization settings:', error);
      }
    }
  }, [user.id]);

  const handleLevelChange = (levelId: PersonalizationLevel['id']) => {
    setSelectedLevel(levelId);
    
    // Update settings based on level
    const newSettings = { ...customSettings, level: levelId };
    
    switch (levelId) {
      case 'minimal':
        newSettings.dataSharing = {
          analytics: false,
          habitPatterns: false,
          researchParticipation: false,
          anonymousUsage: false
        };
        newSettings.adaptiveFeatures = {
          smartScheduling: false,
          difficultyAdjustment: false,
          contextualHints: false,
          recoveryDetection: false,
          motivationalTiming: false
        };
        newSettings.privacySettings.localStorageOnly = true;
        break;
        
      case 'balanced':
        newSettings.dataSharing = {
          analytics: true,
          habitPatterns: true,
          researchParticipation: false,
          anonymousUsage: true
        };
        newSettings.adaptiveFeatures = {
          smartScheduling: true,
          difficultyAdjustment: true,
          contextualHints: true,
          recoveryDetection: true,
          motivationalTiming: false
        };
        break;
        
      case 'adaptive':
        newSettings.dataSharing = {
          analytics: true,
          habitPatterns: true,
          researchParticipation: false,
          anonymousUsage: true
        };
        newSettings.adaptiveFeatures = {
          smartScheduling: true,
          difficultyAdjustment: true,
          contextualHints: true,
          recoveryDetection: true,
          motivationalTiming: true
        };
        break;
        
      case 'comprehensive':
        newSettings.dataSharing = {
          analytics: true,
          habitPatterns: true,
          researchParticipation: true,
          anonymousUsage: true
        };
        newSettings.adaptiveFeatures = {
          smartScheduling: true,
          difficultyAdjustment: true,
          contextualHints: true,
          recoveryDetection: true,
          motivationalTiming: true
        };
        newSettings.privacySettings.shareWithResearchers = true;
        break;
    }
    
    setCustomSettings(newSettings);
  };

  const handleSave = () => {
    // Save settings
    localStorage.setItem(`personalization_${user.id}`, JSON.stringify(customSettings));
    onSave(customSettings);
  };

  const getDataCollectionColor = (level: PersonalizationLevel['dataCollection']) => {
    switch (level) {
      case 'low': return 'text-compassion-600 bg-compassion-50';
      case 'medium': return 'text-progress-600 bg-progress-50';
      case 'high': return 'text-research-600 bg-research-50';
    }
  };

  const getAdaptivenessColor = (adaptiveness: PersonalizationLevel['adaptiveness']) => {
    switch (adaptiveness) {
      case 'static': return 'text-gray-600 bg-gray-50';
      case 'learning': return 'text-progress-600 bg-progress-50';
      case 'dynamic': return 'text-research-600 bg-research-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Personalization Settings</h2>
              <p className="text-gray-600 mt-1">
                Choose how ScienceHabits adapts to your unique needs and preferences
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Personalization Levels */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-gray-900">Choose Your Personalization Level</h3>
            
            {personalizationLevels.map(level => (
              <div
                key={level.id}
                className={`
                  border-2 rounded-lg p-6 cursor-pointer transition-all duration-200
                  ${selectedLevel === level.id 
                    ? 'border-progress-500 bg-progress-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => handleLevelChange(level.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        checked={selectedLevel === level.id}
                        onChange={() => handleLevelChange(level.id)}
                        className="w-4 h-4 text-progress-600"
                      />
                      <h4 className="font-semibold text-gray-900 ml-3">{level.name}</h4>
                      
                      {/* Badges */}
                      <div className="ml-4 flex space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getDataCollectionColor(level.dataCollection)}`}>
                          {level.dataCollection} data
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getAdaptivenessColor(level.adaptiveness)}`}>
                          {level.adaptiveness}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{level.description}</p>
                    
                    {/* Features */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Key Features</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {level.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center">
                              <span className="text-progress-500 mr-2">•</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Benefits</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {level.pros.slice(0, 3).map((pro, idx) => (
                            <li key={idx} className="flex items-center">
                              <span className="text-compassion-500 mr-2">✓</span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {/* Considerations */}
                    {level.considerations.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <h5 className="font-medium text-yellow-800 mb-1">Things to Consider</h5>
                        <ul className="text-sm text-yellow-700">
                          {level.considerations.slice(0, 2).map((consideration, idx) => (
                            <li key={idx}>• {consideration}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Advanced Settings */}
          <div className="border-t pt-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-gray-700 hover:text-gray-900 transition-colors mb-4"
            >
              <span className="font-medium">Advanced Settings</span>
              <svg
                className={`w-4 h-4 ml-2 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showAdvanced && (
              <div className="grid md:grid-cols-3 gap-6">
                {/* Data Sharing */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Data Sharing</h4>
                  <div className="space-y-2">
                    {Object.entries(customSettings.dataSharing).map(([key, value]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setCustomSettings(prev => ({
                            ...prev,
                            dataSharing: { ...prev.dataSharing, [key]: e.target.checked }
                          }))}
                          className="w-4 h-4 text-progress-600"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Adaptive Features */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Adaptive Features</h4>
                  <div className="space-y-2">
                    {Object.entries(customSettings.adaptiveFeatures).map(([key, value]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setCustomSettings(prev => ({
                            ...prev,
                            adaptiveFeatures: { ...prev.adaptiveFeatures, [key]: e.target.checked }
                          }))}
                          className="w-4 h-4 text-progress-600"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Privacy</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customSettings.privacySettings.localStorageOnly}
                        onChange={(e) => setCustomSettings(prev => ({
                          ...prev,
                          privacySettings: { ...prev.privacySettings, localStorageOnly: e.target.checked }
                        }))}
                        className="w-4 h-4 text-progress-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Local storage only</span>
                    </label>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Data retention (days)
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="3650"
                        value={customSettings.privacySettings.dataRetentionDays}
                        onChange={(e) => setCustomSettings(prev => ({
                          ...prev,
                          privacySettings: { ...prev.privacySettings, dataRetentionDays: parseInt(e.target.value) }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🛡️ Your Privacy Matters</h4>
            <p className="text-sm text-blue-800">
              All personalization happens locally on your device. We only collect data you explicitly agree to share, 
              and you can change these settings anytime. Your habit data remains private and secure.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-progress-600 text-white rounded-lg hover:bg-progress-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}