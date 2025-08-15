import React, { useState, useEffect } from 'react';
import { OnboardingContainer } from './components/onboarding/index';
import { DashboardLayout } from './components/dashboard';
import { SmartDailyDashboard } from './components/dashboard/SmartDailyDashboard';
import { TranslationDashboard } from './components/admin/TranslationDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLogin } from './components/admin/AdminLogin';
import { ResearchTranslationReview } from './components/admin/ResearchTranslationReview';
import { initializeDatabase } from './services/storage/database';
import { useUserStore } from './stores/userStore';
import { ResearchProvider } from './contexts/ResearchContext';
import { ReminderProvider } from './contexts/ReminderContext';

function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const { loadUserData, clearUser, currentUser } = useUserStore();

  // Simple routing based on URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setCurrentView(hash || 'dashboard');
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

  // Admin dashboard view with secure authentication
  if (currentView === 'admin') {
    if (!isAdminAuthenticated) {
      return <AdminLogin onLoginSuccess={() => setIsAdminAuthenticated(true)} />;
    }

    return (
      <ResearchProvider>
        <ReminderProvider>
          <div className="min-h-screen bg-gray-50">
            {/* Admin header */}
            <div className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => window.location.hash = 'dashboard'}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      ← Back to App
                    </button>
                    <span className="text-gray-300">|</span>
                    <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    <a
                      href="#translation-dashboard"
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Translation Dashboard
                    </a>
                    <button
                      onClick={() => {
                        setIsAdminAuthenticated(false);
                        window.location.hash = 'dashboard';
                      }}
                      className="text-sm text-gray-600 hover:text-gray-700"
                    >
                      Logout
                    </button>
                    <div className="text-sm text-gray-500">
                      ScienceHabits CMS
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <AdminDashboard />
          </div>
        </ReminderProvider>
      </ResearchProvider>
    );
  }

  // Translation dashboard view
  if (currentView === 'translation-dashboard') {
    return (
      <ResearchProvider>
        <ReminderProvider>
          <div className="min-h-screen bg-gray-50">
            {/* Admin header */}
            <div className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => window.location.hash = 'admin'}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      ← Back to CMS
                    </button>
                    <span className="text-gray-300">|</span>
                    <h1 className="text-xl font-semibold text-gray-900">Translation Dashboard</h1>
                  </div>
                  <div className="text-sm text-gray-500">
                    Multi-Language Quality Control
                  </div>
                </div>
              </div>
            </div>
            <TranslationDashboard />
          </div>
        </ReminderProvider>
      </ResearchProvider>
    );
  }

  // Research translation review view
  if (currentView === 'research-translation-review') {
    return (
      <ResearchProvider>
        <ReminderProvider>
          <div className="min-h-screen bg-gray-50">
            {/* Admin header */}
            <div className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => window.location.hash = 'translation-dashboard'}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      ← Back to Translation Dashboard
                    </button>
                    <span className="text-gray-300">|</span>
                    <h1 className="text-xl font-semibold text-gray-900">German Research Review</h1>
                  </div>
                  <div className="text-sm text-gray-500">
                    Review & Approve German Translations
                  </div>
                </div>
              </div>
            </div>
            <ResearchTranslationReview />
          </div>
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