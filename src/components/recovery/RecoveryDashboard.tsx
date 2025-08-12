/**
 * Recovery Dashboard Component
 * 
 * Central hub for the recovery-first design system that brings together
 * compassion messaging, micro-habits, trend analysis, and recovery sessions
 * to prevent habit abandonment through scientific support.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Button } from '../ui';
import { CompassionModal } from './CompassionModal';
import { TrendProgressView } from './TrendProgressView';
import { MicroHabitCard } from './MicroHabitCard';
import { useRecoveryStore } from '../../stores/recoveryStore';
import { useUserStore } from '../../stores/userStore';

interface RecoveryDashboardProps {
  className?: string;
}

export function RecoveryDashboard({ className = '' }: RecoveryDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'recovery' | 'insights'>('overview');
  const [compassionModalOpen, setCompassionModalOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');
  
  const {
    activeRecoverySessions,
    recentCompassionEvents,
    recoverySettings,
    recoveryMetrics,
    personalInsights,
    checkForCompassionTriggers,
    triggerCompassionMessage,
    generateMicroHabit,
    getRelevantResearchForSituation
  } = useRecoveryStore();
  
  const { userHabits, userProgress } = useUserStore();
  
  // Check for habits that might need compassion messages
  useEffect(() => {
    if (!recoverySettings.enableCompassionMessages) return;
    
    userHabits.forEach(habit => {
      const triggerResult = checkForCompassionTriggers(habit.id);
      if (triggerResult.shouldTrigger && triggerResult.urgency === 'immediate') {
        // Auto-trigger compassion message for high urgency cases
        if (triggerResult.messageId) {
          triggerCompassionMessage(habit.id, triggerResult.messageId);
        }
      }
    });
  }, [userHabits, userProgress]);
  
  const habitsNeedingSupport = userHabits.filter(habit => {
    const triggerResult = checkForCompassionTriggers(habit.id);
    return triggerResult.shouldTrigger;
  });
  
  const activeMicroHabits = activeRecoverySessions
    .filter(session => session.recoveryType === 'micro_habit' && !session.completed)
    .map(session => {
      const habit = userHabits.find(h => h.id === session.habitId);
      return habit ? generateMicroHabit(habit) : null;
    })
    .filter((microHabit): microHabit is NonNullable<typeof microHabit> => microHabit !== null);
  
  const recentInsights = personalInsights.slice(0, 3);
  
  const handleShowCompassion = (habitId: string) => {
    setSelectedHabitId(habitId);
    setCompassionModalOpen(true);
  };
  
  const tabs = [
    { id: 'overview' as const, name: 'Overview', icon: '📊' },
    { id: 'trends' as const, name: 'Progress Trends', icon: '📈' },
    { id: 'recovery' as const, name: 'Recovery Sessions', icon: '🔄' },
    { id: 'insights' as const, name: 'Insights', icon: '💡' }
  ];
  
  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Recovery & Progress Dashboard
        </h1>
        <p className="text-gray-600">
          Science-backed support for building sustainable habits through compassion and progress focus
        </p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{recoveryMetrics.totalRecoverySessions}</div>
            <div className="text-sm text-gray-600">Recovery Sessions</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((recoveryMetrics.successfulRecoveries / Math.max(recoveryMetrics.totalRecoverySessions, 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{activeRecoverySessions.length}</div>
            <div className="text-sm text-gray-600">Active Sessions</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{Math.round(recoveryMetrics.averageRecoveryTime)}</div>
            <div className="text-sm text-gray-600">Avg Recovery (days)</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Urgent Support Needed */}
      {habitsNeedingSupport.length > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <span className="text-xl">🤗</span>
              <h3 className="text-lg font-medium text-yellow-900">
                Habits That Could Use Some Support
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {habitsNeedingSupport.map(habit => {
                const triggerResult = checkForCompassionTriggers(habit.id);
                return (
                  <div key={habit.id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <h4 className="font-medium text-gray-900">{habit.title}</h4>
                      <p className="text-sm text-gray-600">
                        {triggerResult.severity === 'high' ? 'Missing multiple days' : 
                         triggerResult.severity === 'medium' ? 'Missed a couple days' : 
                         'Missed yesterday'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleShowCompassion(habit.id)}
                    >
                      Get Support
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Active Micro Habits */}
            {activeMicroHabits.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  🚀 Active Micro Habits
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {activeMicroHabits.map(microHabit => {
                    const session = activeRecoverySessions.find(s => s.habitId === microHabit.originalHabitId);
                    return (
                      <MicroHabitCard
                        key={microHabit.id}
                        microHabit={microHabit}
                        recoverySession={session}
                      />
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Recent Compassion Events */}
            {recentCompassionEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium">Recent Support Messages</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentCompassionEvents.slice(0, 3).map(event => {
                      const habit = userHabits.find(h => h.id === event.habitId);
                      return (
                        <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                          <span className="text-lg">💙</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {habit?.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {event.messageShown.message.substring(0, 100)}...
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(event.triggeredDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Quick Insights */}
            {recentInsights.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium">💡 Quick Insights</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentInsights.map(insight => (
                      <div key={insight.id} className="border-l-4 border-blue-500 pl-3">
                        <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {userHabits.map(habit => (
              <TrendProgressView key={habit.id} habitId={habit.id} />
            ))}
          </div>
        )}
        
        {/* Recovery Sessions Tab */}
        {activeTab === 'recovery' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Active Recovery Sessions</h3>
              </CardHeader>
              <CardContent>
                {activeRecoverySessions.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-4 block">🎉</span>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No active recovery sessions
                    </h4>
                    <p className="text-gray-600">
                      You're maintaining consistency with your habits!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeRecoverySessions.map(session => {
                      const habit = userHabits.find(h => h.id === session.habitId);
                      return (
                        <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{habit?.title}</h4>
                            <span className="text-sm text-gray-500 capitalize">
                              {session.recoveryType.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{session.currentStep}/{session.totalSteps}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(session.currentStep / session.totalSteps) * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600">
                            <strong>Next milestone:</strong> {session.nextMilestone}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Personalized Recovery Insights</h3>
              </CardHeader>
              <CardContent>
                {personalInsights.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-4 block">📊</span>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Building your insights
                    </h4>
                    <p className="text-gray-600">
                      Complete more habits to unlock personalized recovery insights
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {personalInsights.map(insight => (
                      <div key={insight.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{insight.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            insight.type === 'success_factor' ? 'bg-green-100 text-green-800' :
                            insight.type === 'risk_factor' ? 'bg-red-100 text-red-800' :
                            insight.type === 'opportunity' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {insight.type.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{insight.description}</p>
                        
                        {insight.actionable && insight.suggestedActions.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">
                              Suggested actions:
                            </h5>
                            <ul className="space-y-1">
                              {insight.suggestedActions.map((action, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{action}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <span>Confidence: {insight.confidence}%</span>
                          <span>Based on {insight.basedOn.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Compassion Modal */}
      {selectedHabitId && (
        <CompassionModal
          isOpen={compassionModalOpen}
          onClose={() => setCompassionModalOpen(false)}
          habitId={selectedHabitId}
          habitName={userHabits.find(h => h.id === selectedHabitId)?.title || ''}
          triggerCondition="first_miss" // Would be dynamic based on actual trigger
        />
      )}
    </div>
  );
}