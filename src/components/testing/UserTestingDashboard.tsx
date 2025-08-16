/**
 * User Testing Dashboard
 * 
 * Main dashboard component for the User Data Mock Dataset Testing Environment.
 * Provides comprehensive interface for testing different user journey scenarios.
 */

import React, { useState, useEffect } from 'react';
import { MockUserProfile, BehaviorEvent, UserTestingContext } from '../../types/testing';
import { mockUserDataService } from '../../services/testing/MockUserDataService';
import { UserScenarioSelector } from './UserScenarioSelector';
import { UserJourneyVisualization } from './UserJourneyVisualization';
import { AppPreviewWithContext } from './AppPreviewWithContext';

interface UserTestingDashboardProps {
  isActive?: boolean;
  onClose?: () => void;
}

export const UserTestingDashboard: React.FC<UserTestingDashboardProps> = ({
  isActive = false,
  onClose
}) => {
  const [testingContext, setTestingContext] = useState<UserTestingContext>(mockUserDataService.getTestingContext());
  const [currentView, setCurrentView] = useState<'selector' | 'preview' | 'analytics'>('selector');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [behaviorAnalytics, setBehaviorAnalytics] = useState(mockUserDataService.getBehaviorAnalytics());

  // Refresh testing context
  const refreshContext = () => {
    setTestingContext(mockUserDataService.getTestingContext());
    setBehaviorAnalytics(mockUserDataService.getBehaviorAnalytics());
  };

  // Handle user selection
  const handleUserChange = (userId: string) => {
    mockUserDataService.enableTestingMode(userId);
    refreshContext();
    setCurrentView('preview');
  };

  // Handle user comparison
  const handleCompareUsers = (userIds: string[]) => {
    setSelectedUsers(userIds);
    setCurrentView('analytics');
  };

  // Handle behavior events
  const handleBehaviorEvent = (event: BehaviorEvent) => {
    mockUserDataService.recordBehaviorEvent(event.action, event.data);
    refreshContext();
  };

  // Stop testing mode
  const handleStopTesting = () => {
    mockUserDataService.disableTestingMode();
    refreshContext();
    setCurrentView('selector');
  };

  // Export testing data
  const handleExportData = () => {
    const data = mockUserDataService.exportBehaviorData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-testing-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear testing data
  const handleClearData = () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to clear all testing data? This action cannot be undone.')) {
      mockUserDataService.clearTestingData();
      refreshContext();
    }
  };

  // Auto-refresh context every 5 seconds when testing is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (testingContext.isTestingMode) {
      interval = setInterval(refreshContext, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testingContext.isTestingMode]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-screen mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">🧪 User Testing Environment</h1>
              <p className="text-purple-100 text-sm">Test different user journey scenarios and behavioral patterns</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {testingContext.isTestingMode && (
                <div className="flex items-center space-x-2 bg-red-500 bg-opacity-20 rounded-lg px-3 py-1">
                  <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                  <span className="text-sm">Recording</span>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between px-4 py-2">
            <nav className="flex space-x-1">
              {[
                { key: 'selector', label: '👥 User Scenarios', disabled: false },
                { key: 'preview', label: '📱 App Preview', disabled: !testingContext.currentUser },
                { key: 'analytics', label: '📊 Analytics', disabled: !testingContext.isTestingMode }
              ].map(({ key, label, disabled }) => (
                <button
                  key={key}
                  onClick={() => !disabled && setCurrentView(key as typeof currentView)}
                  disabled={disabled}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === key
                      ? 'bg-white text-purple-600 shadow-sm'
                      : disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-2">
              {testingContext.isTestingMode && (
                <>
                  <button
                    onClick={handleStopTesting}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                  >
                    Stop Testing
                  </button>
                  <button
                    onClick={handleExportData}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Export Data
                  </button>
                </>
              )}
              
              <button
                onClick={handleClearData}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        {testingContext.isTestingMode && testingContext.currentUser && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-blue-800">
                  <strong>Testing:</strong> {testingContext.currentUser.name}
                </span>
                <span className="text-blue-600">
                  <strong>Scenario:</strong> {testingContext.currentUser.scenario.replace('_', ' ')}
                </span>
                <span className="text-blue-600">
                  <strong>Events:</strong> {testingContext.behaviorEvents.length}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-blue-600">
                <span>
                  <strong>Engagement:</strong> {behaviorAnalytics.engagementScore}/100
                </span>
                <span>
                  <strong>Duration:</strong> {Math.round(behaviorAnalytics.sessionDuration / (1000 * 60))}min
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'selector' && (
            <div className="h-full overflow-y-auto p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Selector */}
                <div className="lg:col-span-2">
                  <UserScenarioSelector
                    scenarios={mockUserDataService.getAllScenarios()}
                    selectedUser={testingContext.currentUser?.id || ''}
                    onUserChange={handleUserChange}
                    onCompareUsers={handleCompareUsers}
                  />
                </div>

                {/* Quick Stats & Insights */}
                <div className="space-y-4">
                  {/* Testing Overview */}
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-3">Testing Overview</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Available Users:</span>
                        <span className="font-medium">{mockUserDataService.getAllUsers().length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Session:</span>
                        <span className={`font-medium ${testingContext.isTestingMode ? 'text-green-600' : 'text-gray-400'}`}>
                          {testingContext.isTestingMode ? 'Running' : 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Recorded Events:</span>
                        <span className="font-medium">{testingContext.behaviorEvents.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Insights */}
                  {testingContext.insights.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                      <h3 className="text-md font-semibold text-gray-900 mb-3">Recent Insights</h3>
                      <div className="space-y-2">
                        {testingContext.insights.slice(-5).map((insight, index) => (
                          <div 
                            key={index}
                            className={`text-sm p-2 rounded-md ${
                              insight.type === 'positive' ? 'bg-green-50 text-green-800' :
                              insight.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                              'bg-blue-50 text-blue-800'
                            }`}
                          >
                            <div className="flex items-start space-x-1">
                              <span className="text-xs">
                                {insight.type === 'positive' ? '✅' : 
                                 insight.type === 'warning' ? '⚠️' : 'ℹ️'}
                              </span>
                              <span>{insight.message}</span>
                            </div>
                            <div className="text-xs opacity-75 mt-1">
                              {new Date(insight.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentView === 'preview' && testingContext.currentUser && (
            <div className="h-full overflow-hidden">
              <AppPreviewWithContext
                user={testingContext.currentUser}
                onBehaviorEvent={handleBehaviorEvent}
                isRecording={testingContext.isTestingMode}
              />
            </div>
          )}

          {currentView === 'analytics' && testingContext.currentUser && (
            <div className="h-full overflow-y-auto p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Journey Visualization */}
                <div className="lg:col-span-1">
                  <UserJourneyVisualization
                    user={testingContext.currentUser}
                    comparisonUsers={selectedUsers.map(id => mockUserDataService.getUserById(id)).filter(Boolean) as MockUserProfile[]}
                  />
                </div>

                {/* Behavioral Analytics */}
                <div className="space-y-4">
                  {/* Real-time Stats */}
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-3">Session Analytics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{behaviorAnalytics.totalEvents}</div>
                        <div className="text-xs text-gray-600">Total Events</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{behaviorAnalytics.engagementScore}</div>
                        <div className="text-xs text-gray-600">Engagement Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Top Actions */}
                  {behaviorAnalytics.topActions.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                      <h3 className="text-md font-semibold text-gray-900 mb-3">Top Actions</h3>
                      <div className="space-y-2">
                        {behaviorAnalytics.topActions.map((action, index) => (
                          <div key={action.action} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{action.action.replace('_', ' ')}</span>
                            <span className="text-sm font-medium">{action.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Distribution */}
                  {behaviorAnalytics.timeDistribution.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                      <h3 className="text-md font-semibold text-gray-900 mb-3">Activity Timeline</h3>
                      <div className="space-y-2">
                        {behaviorAnalytics.timeDistribution.map((period, index) => (
                          <div key={period.period} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{period.period}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="h-2 bg-blue-500 rounded-full"
                                  style={{ 
                                    width: `${Math.max(5, (period.events / Math.max(...behaviorAnalytics.timeDistribution.map(p => p.events))) * 100)}%` 
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium w-6 text-right">{period.events}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};