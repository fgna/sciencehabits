/**
 * User Scenario Selector Component
 * 
 * Interface for selecting and comparing different mock user profiles
 * for testing various user journeys and behaviors.
 */

import React, { useState } from 'react';
import { MockUserProfile } from '../../types/testing';

interface UserScenarioSelectorProps {
  scenarios: Record<string, MockUserProfile[]>;
  selectedUser: string;
  onUserChange: (userId: string) => void;
  onCompareUsers: (userIds: string[]) => void;
}

export const UserScenarioSelector: React.FC<UserScenarioSelectorProps> = ({
  scenarios,
  selectedUser,
  onUserChange,
  onCompareUsers
}) => {
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  const getUserColor = (scenario: string) => {
    const colors = {
      new_user: 'bg-green-100 text-green-800 border-green-200',
      consistent_user: 'bg-blue-100 text-blue-800 border-blue-200',
      struggling_user: 'bg-red-100 text-red-800 border-red-200',
      power_user: 'bg-purple-100 text-purple-800 border-purple-200',
      returning_user: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      custom: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[scenario as keyof typeof colors] || colors.custom;
  };

  const getScenarioIcon = (scenario: string) => {
    const icons = {
      new_user: '🌱',
      consistent_user: '⭐',
      struggling_user: '💪',
      power_user: '🚀',
      returning_user: '🔄',
      custom: '👤'
    };
    return icons[scenario as keyof typeof icons] || icons.custom;
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">User Scenarios</h3>
          <span className="text-sm text-gray-500">
            Test different user journeys and behaviors
          </span>
        </div>

        {selectedForComparison.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedForComparison.length} users selected for comparison
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => onCompareUsers(selectedForComparison)}
                  disabled={selectedForComparison.length < 2}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Compare Journeys
                </button>
                <button
                  onClick={() => setSelectedForComparison([])}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-400"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {Object.entries(scenarios).map(([scenarioType, users]) => (
          <div key={scenarioType} className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              {getScenarioIcon(scenarioType)}
              <span className="ml-2 capitalize">{scenarioType.replace('_', ' ')} Users</span>
              <span className="ml-2 text-sm text-gray-500">({users.length})</span>
            </h4>
            
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedUser === user.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={() => onUserChange(user.id)}>
                      <div className="flex items-center space-x-3 mb-2">
                        <h5 className="font-medium text-gray-900">{user.name}</h5>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getUserColor(user.scenario)}`}>
                          {user.scenario.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{user.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Active Habits:</span> {user.habits.active.length}
                        </div>
                        <div>
                          <span className="font-medium">Current Streak:</span> {user.analytics.currentStreak} days
                        </div>
                        <div>
                          <span className="font-medium">Completion Rate:</span> {user.analytics.completionRate}%
                        </div>
                        <div>
                          <span className="font-medium">Engagement:</span> 
                          <span className={`ml-1 ${getEngagementColor(user.behavior.engagementLevel)}`}>
                            {user.behavior.engagementLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={selectedForComparison.includes(user.id)}
                        onChange={() => {
                          setSelectedForComparison(prev => 
                            prev.includes(user.id)
                              ? prev.filter(id => id !== user.id)
                              : [...prev, user.id]
                          );
                        }}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {selectedUser === user.id && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
                        <div>
                          <div className="font-medium mb-1">Goals:</div>
                          <div className="space-y-1">
                            {user.onboarding.selectedGoals.map(goal => (
                              <span key={goal} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-1">
                                {goal.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium mb-1">Struggles:</div>
                          <div className="space-y-1">
                            {user.behavior.strugglingAreas.length > 0 ? 
                              user.behavior.strugglingAreas.map(area => (
                                <span key={area} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded-full mr-1 text-xs">
                                  {area.replace('_', ' ')}
                                </span>
                              )) :
                              <span className="text-green-600">No struggles identified</span>
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-blue-600">
                        <div><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</div>
                        <div><strong>Last active:</strong> {new Date(user.lastActiveAt).toLocaleDateString()}</div>
                        <div><strong>Login pattern:</strong> {user.behavior.loginFrequency}</div>
                      </div>

                      {user.behavior.motivationTriggers.length > 0 && (
                        <div className="mt-3">
                          <div className="font-medium text-xs text-blue-800 mb-1">Motivation Triggers:</div>
                          <div className="flex flex-wrap gap-1">
                            {user.behavior.motivationTriggers.slice(0, 3).map(trigger => (
                              <span key={trigger} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                {trigger.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
            + Create Custom User Scenario
          </button>
        </div>
      </div>
    </div>
  );
};