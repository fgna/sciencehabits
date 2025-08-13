import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { HabitsView } from '../habits';
import { AnalyticsView } from '../analytics/AnalyticsView';
import { ProfileModal } from '../profile';
import { ResearchArticles } from '../research';
import { ContentLoaderDemo } from '../admin/ContentLoaderDemo';
import { ReminderIndicator } from '../reminders/ReminderIndicator';
import { RecoveryDashboard } from '../recovery';
import { SmartDailyDashboard } from './SmartDailyDashboard';
import { EnhancedProgressVisualization } from '../visualization/EnhancedProgressVisualization';
import { MotivationalMessagingSystem } from '../motivation/MotivationalMessagingSystem';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: any;
  onSignOut?: () => void;
}

type DashboardTab = 'today' | 'habits' | 'progress' | 'recovery' | 'research' | 'content-demo';

export function DashboardLayout({ children, user, onSignOut }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('today');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Listen for research article navigation events
  useEffect(() => {
    const handleShowResearchArticle = (event: CustomEvent) => {
      setActiveTab('research');
    };

    window.addEventListener('showResearchArticle', handleShowResearchArticle as EventListener);
    
    return () => {
      window.removeEventListener('showResearchArticle', handleShowResearchArticle as EventListener);
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
      <MotivationalMessagingSystem />

      {/* Main Content */}
      <main className="flex-1">
        {/* Tab content - Show children for today or SmartDailyDashboard */}
        {activeTab === 'today' && children}
        
        {activeTab === 'habits' && <HabitsView />}
        
        {activeTab === 'progress' && (
          <div className="space-y-6">
            <EnhancedProgressVisualization />
            <AnalyticsView />
          </div>
        )}
        
        {activeTab === 'recovery' && <RecoveryDashboard />}
        
        {activeTab === 'research' && <ResearchArticles />}
        
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