import React, { useState, useEffect } from 'react';
import { OnboardingContainer } from './components/onboarding/index';
import { DashboardLayout } from './components/dashboard';
import { SmartDailyDashboard } from './components/dashboard/SmartDailyDashboard';
import { UserTestingDashboard } from './components/testing';
import { initializeDatabase } from './services/storage/database';
import { useUserStore } from './stores/userStore';
import { ResearchProvider } from './contexts/ResearchContext';
import { ReminderProvider } from './contexts/ReminderContext';
// Performance manager removed for MVP

function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const { loadUserData, clearUser, currentUser } = useUserStore();

  // Simple routing based on URL hash - MVP: Only support main app and user testing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      
      // MVP: Only support main app and user testing
      if (hash === 'user-testing') {
        setCurrentView('user-testing');
      } else {
        setCurrentView('dashboard');
      }
    };

    handleHashChange(); // Set initial view
    window.addEventListener('hashchange', handleHashChange);
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    checkOnboardingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Initialize database first
      await initializeDatabase();
      
      // Performance optimization removed for MVP
      
      // Check if user has completed onboarding
      const storedUserId = localStorage.getItem('sciencehabits_user_id');
      
      if (storedUserId) {
        setIsOnboarded(true);
        // Load user data for dashboard
        await loadUserData(storedUserId);
      } else {
        setIsOnboarded(false);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setIsOnboarded(false);
    }
  };

  const handleOnboardingComplete = async (newUserId: string) => {
    setIsOnboarded(true);
    // Load user data for dashboard
    await loadUserData(newUserId);
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem('sciencehabits_user_id');
    clearUser();
    setIsOnboarded(false);
  };

  // Show loading state while checking onboarding status
  if (isOnboarded === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ScienceHabits...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if not completed
  if (!isOnboarded) {
    return <OnboardingContainer onComplete={handleOnboardingComplete} />;
  }

  // Admin dashboard removed for MVP

  // User testing dashboard view
  if (currentView === 'user-testing') {
    return (
      <ResearchProvider>
        <ReminderProvider>
          <UserTestingDashboard 
            isActive={true}
            onClose={() => window.location.hash = 'dashboard'}
          />
        </ReminderProvider>
      </ResearchProvider>
    );
  }

  // Main dashboard view
  return (
    <ResearchProvider>
      <ReminderProvider>
        <DashboardLayout 
          user={currentUser}
          onSignOut={handleResetOnboarding}
        >
          <SmartDailyDashboard />
        </DashboardLayout>
      </ReminderProvider>
    </ResearchProvider>
  );
}

export default App;