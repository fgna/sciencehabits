/**
 * Mobile-First Experience
 * 
 * Complete mobile-optimized dashboard wrapper with navigation.
 * Designed for 360px-430px screens with thumb navigation only.
 */

import React, { useState } from 'react';
import { MobileFirstDashboard } from './MobileFirstDashboard';
import { MobileFirstHabitsView } from '../habits/MobileFirstHabitsView';
import { MobileFirstAnalyticsView } from '../analytics/MobileFirstAnalyticsView';
import { MobileFirstNavigation } from '../navigation/MobileFirstNavigation';
import { ProfileSettings } from '../profile';
import { useUserStore } from '../../stores/userStore';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';

type MobileTab = 'today' | 'habits' | 'progress' | 'settings';

export function MobileFirstExperience() {
  const [activeTab, setActiveTab] = useState<MobileTab>('today');
  const { currentUser } = useUserStore();
  const { setLayoutMode } = useUIPreferencesStore();

  // Mobile Settings Component
  function MobileSettings() {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600">Manage your preferences</p>
        </div>

        {/* Settings Content */}
        <div className="px-4 py-6 space-y-4">
          
          {/* Layout Switcher */}
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">App Layout</h3>
            <div className="space-y-2">
              <button
                onClick={() => setLayoutMode('simplified')}
                className="w-full p-3 text-left bg-blue-50 border-2 border-blue-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-900">📱 Mobile-First</div>
                    <div className="text-xs text-blue-700">Current layout</div>
                  </div>
                  <div className="text-blue-600">✓</div>
                </div>
              </button>
              
              <button
                onClick={() => setLayoutMode('simplified')}
                className="w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">🎯 Simplified</div>
                <div className="text-xs text-gray-500">Clean minimal interface</div>
              </button>
              
              <button
                onClick={() => setLayoutMode('enhanced')}
                className="w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">⚡ Enhanced</div>
                <div className="text-xs text-gray-500">Full-featured dashboard</div>
              </button>
            </div>
          </div>

          {/* Profile Settings */}
          {currentUser && (
            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Profile</h3>
              <ProfileSettings user={currentUser} />
            </div>
          )}

          {/* About */}
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">About</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>ScienceHabits v1.0</p>
              <p>Science-backed habit tracking</p>
              <p>Mobile-optimized for 📱 thumb navigation</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Content */}
      <main className="pb-16"> {/* Bottom padding for navigation */}
        {activeTab === 'today' && <MobileFirstDashboard />}
        {activeTab === 'habits' && <MobileFirstHabitsView />}
        {activeTab === 'progress' && <MobileFirstAnalyticsView />}
        {activeTab === 'settings' && <MobileSettings />}
      </main>

      {/* Mobile Navigation */}
      <MobileFirstNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}