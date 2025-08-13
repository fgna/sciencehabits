import React, { useState, useEffect } from 'react';
import { OnboardingContainer } from './components/onboarding/index';
import { DashboardLayout } from './components/dashboard';
import { SmartDailyDashboard } from './components/dashboard/SmartDailyDashboard';
import { initializeDatabase } from './services/storage/database';
import { useUserStore } from './stores/userStore';
import { ResearchProvider } from './contexts/ResearchContext';
import { ReminderProvider } from './contexts/ReminderContext';

function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const { loadUserData, clearUser, currentUser } = useUserStore();

  useEffect(() => {
    checkOnboardingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Initialize database first
      await initializeDatabase();
      
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