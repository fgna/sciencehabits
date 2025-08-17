import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { HabitsView } from '../habits';
import { AnalyticsView } from '../analytics/AnalyticsView';
import { ResponsiveAnalyticsView } from '../analytics/ResponsiveAnalyticsView';
import { ProfileModal } from '../profile';
import { ProfileSettings } from '../profile';
import { ResearchArticles } from '../research';
import { ContentLoaderDemo } from '../admin/ContentLoaderDemo';
import { ReminderIndicator } from '../reminders/ReminderIndicator';
import { RecoveryDashboard } from '../recovery';
import { SmartDailyDashboard } from './SmartDailyDashboard';
import { EnhancedProgressVisualization } from '../visualization/EnhancedProgressVisualization';
import { MotivationalMessagingSystem } from '../motivation/MotivationalMessagingSystem';
import { useUserStore } from '../../stores/userStore';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { addSampleCompletionsToExistingProgress } from '../../utils/devDataGenerator';
import { SimplifiedDashboard } from './SimplifiedDashboard';
import { CleanNavigation } from '../navigation/CleanNavigation';
import { Analytics } from '../analytics/Analytics';
import { CloudProviderSelector } from '../auth/CloudProviderSelector';
import { ReportExporter } from '../analytics/ReportExporter';
import { CloudConfig } from '../../types/sync';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { BackupSection } from '../settings/BackupSection';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: any;
  onSignOut?: () => void;
}

type DashboardTab = 'today' | 'habits' | 'progress' | 'recovery' | 'research' | 'settings' | 'content-demo';

// Settings Navigation Component
function SettingsNavigation({ activeTab, onTabChange }: { 
  activeTab: 'profile'; // MVP: Simplified settings tabs - only profile for now
  onTabChange: (tab: 'profile') => void;
}) {
  const tabs = [
    // MVP: Disabled for MVP - restore for full version
    // { id: 'sync' as const, name: 'Cloud Sync', icon: '☁️' },
    { id: 'profile' as const, name: 'Profile', icon: '👤' },
    // MVP: Disabled for MVP - restore for full version
    // { id: 'layout' as const, name: 'Layout', icon: '🎯' },
    // MVP: Disabled for MVP - export feature needs more work
    // { id: 'export' as const, name: 'Export', icon: '📤' }
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
  );
}

// Analytics Export Section Component
// MVP: Simplified Export Section using BackupSection
function AnalyticsExportSection() {
  return <BackupSection />;
}

export function DashboardLayout({ children, user, onSignOut }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('today');
  const [simplifiedTab, setSimplifiedTab] = useState<'today' | 'habits' | 'analytics' | 'settings'>('today');
  const [settingsTab, setSettingsTab] = useState<'profile'>('profile'); // MVP: Only profile tab for now

  const handleTabChange = (tab: 'today' | 'habits' | 'analytics' | 'settings') => {
    setSimplifiedTab(tab);
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Get data from store for components that need it
  const { userHabits, userProgress, refreshProgress, saveCloudConfig, currentUser } = useUserStore();
  const { layoutMode, setLayoutMode } = useUIPreferencesStore();

  // Dev function to add sample progress data
  const addSampleData = async () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    try {
      console.log('🔧 Adding sample completions to existing progress...');
      
      if (userProgress.length === 0) {
        console.log('No existing progress found. Please add some habits first.');
        return;
      }

      const { dbHelpers } = await import('../../services/storage/database');
      
      // Add sample completions for the last 14 days to existing habits
      const today = new Date();
      const completionDates: string[] = [];
      
      // Generate a proper streak: complete today and the last few days consecutively
      // Plus some scattered completions in the past
      
      // Add today and yesterday for sure (to create current streak)
      completionDates.push(today.toISOString().split('T')[0]);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      completionDates.push(yesterday.toISOString().split('T')[0]);
      
      // Add 3 more consecutive days for a 5-day current streak
      for (let i = 2; i <= 4; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        completionDates.push(date.toISOString().split('T')[0]);
      }
      
      // Add some random completions in the past 2 weeks (for longest streak calculation)
      for (let i = 5; i < 14; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        if (Math.random() < 0.6) { // 60% chance for older dates
          completionDates.push(date.toISOString().split('T')[0]);
        }
      }

      console.log(`Adding ${completionDates.length} sample completions to ${userProgress.length} habits...`);
      console.log('Sample completion dates:', completionDates);

      // Add completions to all existing habits
      for (const progress of userProgress) {
        console.log(`Processing habit ${progress.habitId}, existing completions:`, progress.completions.length);
        
        let addedCount = 0;
        for (const date of completionDates) {
          // Check if completion already exists
          if (!progress.completions.includes(date)) {
            try {
              await dbHelpers.markHabitComplete(progress.userId, progress.habitId, date);
              addedCount++;
              console.log(`✓ Added completion for ${progress.habitId} on ${date}`);
            } catch (error) {
              console.warn(`Failed to add completion for ${progress.habitId} on ${date}:`, error);
            }
          } else {
            console.log(`Skipping existing completion for ${progress.habitId} on ${date}`);
          }
        }
        console.log(`Added ${addedCount} new completions for ${progress.habitId}`);
      }
      
      // Refresh the store to get updated data
      console.log('Refreshing progress data...');
      await refreshProgress();
      
      // Log the updated progress
      console.log('✅ Sample data added! Check Progress Visualization to see updated streaks.');
    } catch (error) {
      console.error('❌ Failed to add sample data:', error);
    }
  };

  // Listen for navigation events
  useEffect(() => {
    const handleShowResearchArticle = (event: CustomEvent) => {
      setActiveTab('research');
    };
    
    const handleNavigateToHabits = (event: CustomEvent) => {
      setActiveTab('habits');
    };

    window.addEventListener('showResearchArticle', handleShowResearchArticle as EventListener);
    window.addEventListener('navigate-to-habits', handleNavigateToHabits as EventListener);
    
    return () => {
      window.removeEventListener('showResearchArticle', handleShowResearchArticle as EventListener);
      window.removeEventListener('navigate-to-habits', handleNavigateToHabits as EventListener);
    };
  }, []);

  const navigation: { id: DashboardTab; name: string; icon: React.ReactNode }[] = [
    {
      id: 'today' as const,
      name: 'Today',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'habits' as const,
      name: 'My Habits',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      id: 'progress' as const,
      name: 'Progress',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'recovery' as const,
      name: 'Recovery',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    {
      id: 'research' as const,
      name: 'Research',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 'settings' as const,
      name: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  // Add content demo tab in development mode
  if (process.env.NODE_ENV === 'development') {
    navigation.push({
      id: 'content-demo' as const,
      name: 'Content Demo',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    });
  }

  // If simplified mode is enabled, render the simplified dashboard
  if (layoutMode === 'simplified') {
    return (
      <div className="min-h-screen bg-gray-50">
        <CleanNavigation 
          activeTab={simplifiedTab} 
          onTabChange={handleTabChange} 
        />
        
        <main className="flex-1">
          {simplifiedTab === 'today' && <SimplifiedDashboard />}
          {simplifiedTab === 'habits' && <HabitsView />}
          {simplifiedTab === 'analytics' && <ResponsiveAnalyticsView />}
          {simplifiedTab === 'settings' && (
            <div className="max-w-4xl mx-auto p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
                <p className="text-gray-600">Manage your account settings</p>
              </div>
              
              <SettingsNavigation 
                activeTab={settingsTab} 
                onTabChange={setSettingsTab} 
              />
              
              {/* MVP: Cloud Sync Disabled for MVP - restore for full version
              {settingsTab === 'sync' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">☁️ Cloud Sync</h2>
                  <p className="text-gray-600 mb-4">
                    Keep your habits synchronized across all your devices with secure cloud storage.
                  </p>
                  <CloudProviderSelector 
                    onProviderSelected={async (config) => {
                      if (config) {
                        console.log('Cloud provider selected:', config);
                        await saveCloudConfig({
                          type: config.type,
                          serverUrl: config.serverUrl,
                          username: config.username,
                          appPassword: config.appPassword,
                          syncPath: config.syncPath,
                          projectId: config.projectId,
                          bucketName: config.bucketName,
                          region: config.region,
                          credentials: config.credentials
                        });
                      }
                    }}
                  />
                </div>
              )}
              */}
              
              {/* Profile Tab */}
              {settingsTab === 'profile' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">👤 Profile</h2>
                  {currentUser ? (
                    <ProfileSettings user={currentUser} />
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">👤</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Profile...</h3>
                      <p className="text-gray-600">Setting up your profile settings</p>
                    </div>
                  )}
                </div>
              )}

              {/* MVP: Layout Tab Disabled for MVP - restore for full version
              {settingsTab === 'layout' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 Layout Mode</h2>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setLayoutMode('simplified')}
                      className={layoutMode === 'simplified' ? 'bg-blue-600 text-white border-blue-600' : ''}
                    >
                      Simplified
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setLayoutMode('enhanced')}
                    >
                      Enhanced
                    </Button>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    Choose between a clean simplified interface or the full-featured enhanced view.
                  </p>
                </div>
              )}
              */}

              {/* MVP: Export Tab - Disabled for MVP, needs more work */}
            </div>
          )}
        </main>
        
        {/* MVP: Layout toggle disabled for MVP - restore for full version
        <div className="fixed bottom-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLayoutMode('enhanced')}
            className="bg-white shadow-lg"
            title="Switch to Enhanced Layout"
          >
            🔄 Enhanced
          </Button>
        </div>
        */}
        
        {/* Profile Modal */}
        {user && (
          <ProfileModal 
            isOpen={isProfileOpen} 
            onClose={() => setIsProfileOpen(false)} 
            user={user} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">🧬</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">ScienceHabits</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Science-backed habit tracking</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {user && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    Welcome back{user.name ? `, ${user.name}` : ''}!
                  </p>
                  <p className="text-xs text-gray-500">{user.lifestyle} lifestyle</p>
                </div>
              )}
              
              {/* Reminder Indicator */}
              <ReminderIndicator className="hidden sm:flex" />
              
              <div className="flex items-center space-x-2">
                {/* Dev-only buttons */}
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addSampleData}
                      className="hidden sm:inline-flex bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                      title="Add sample habit completions for testing"
                    >
                      📊 Sample Data
                    </Button>
                    {/* MVP: Layout toggle disabled for MVP - restore for full version
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLayoutMode('simplified')}
                      className="hidden sm:inline-flex bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                      title="Switch to Simplified Layout"
                    >
                      🎯 Simplified
                    </Button>
                    */}
                  </>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProfileOpen(true)}
                  className="hidden sm:inline-flex"
                >
                  Profile
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSignOut}
                  className="hidden sm:inline-flex text-gray-500 hover:text-gray-700"
                  title="Reset App"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
                
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              ))}
              
              <div className="pt-2 border-t border-gray-200 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsProfileOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  Profile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSignOut}
                  className="w-full text-gray-500 hover:text-gray-700"
                >
                  Reset App
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Motivational Messaging System */}
      {user && (
        <MotivationalMessagingSystem 
          user={user}
          habits={userHabits}
          progress={userProgress}
          currentContext={{
            timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                      new Date().getHours() < 17 ? 'midday' : 
                      new Date().getHours() < 21 ? 'evening' : 'night',
            dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
            isWeekend: [0, 6].includes(new Date().getDay()),
            recentActivity: 'active'
          }}
        />
      )}

      {/* Main Content */}
      <main className="flex-1">
        {/* Tab content - Show children for today or SmartDailyDashboard */}
        {activeTab === 'today' && children}
        
        {activeTab === 'habits' && <HabitsView />}
        
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {user && (
              <EnhancedProgressVisualization 
                habits={userHabits}
                progress={userProgress}
                user={user}
                timeframe="month"
              />
            )}
            <AnalyticsView />
          </div>
        )}
        
        {activeTab === 'recovery' && <RecoveryDashboard />}
        
        {activeTab === 'research' && <ResearchArticles />}
        
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
              <p className="text-gray-600">Manage your account settings</p>
            </div>
            
            <SettingsNavigation 
              activeTab={settingsTab} 
              onTabChange={setSettingsTab} 
            />
            
            {/* MVP: Cloud Sync Disabled for MVP - restore for full version
            {settingsTab === 'sync' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">☁️ Cloud Sync</h2>
                <p className="text-gray-600 mb-4">
                  Keep your habits synchronized across all your devices with secure cloud storage.
                </p>
                <CloudProviderSelector 
                  onProviderSelected={async (config) => {
                    if (config) {
                      console.log('Cloud provider selected:', config);
                      await saveCloudConfig({
                        type: config.type,
                        serverUrl: config.serverUrl,
                        username: config.username,
                        appPassword: config.appPassword,
                        syncPath: config.syncPath,
                        projectId: config.projectId,
                        bucketName: config.bucketName,
                        region: config.region,
                        credentials: config.credentials
                      });
                    }
                  }}
                />
              </div>
            )}
            */}
            
            {/* Profile Tab */}
            {settingsTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">👤 Profile</h2>
                {currentUser ? (
                  <ProfileSettings user={currentUser} />
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">👤</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Profile...</h3>
                    <p className="text-gray-600">Setting up your profile settings</p>
                  </div>
                )}
              </div>
            )}

            {/* MVP: Layout Tab Disabled for MVP - restore for full version
            {settingsTab === 'layout' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 Layout Mode</h2>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setLayoutMode('simplified')}
                  >
                    Simplified
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLayoutMode('enhanced')}
                    className={layoutMode === 'enhanced' ? 'bg-blue-600 text-white border-blue-600' : ''}
                  >
                    Enhanced
                  </Button>
                </div>
                <p className="text-gray-600 text-sm mt-2">
                  Choose between a clean simplified interface or the full-featured enhanced view.
                </p>
              </div>
            )}
            */}

            {/* MVP: Export Tab - Disabled for MVP, needs more work */}
          </div>
        )}
        
        {activeTab === 'content-demo' && <ContentLoaderDemo />}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-5">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                activeTab === item.id
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.name}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom padding for mobile navigation */}
      <div className="md:hidden h-16" />
      
      {/* Profile Modal */}
      {user && (
        <ProfileModal 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
          user={user} 
        />
      )}
    </div>
  );
}