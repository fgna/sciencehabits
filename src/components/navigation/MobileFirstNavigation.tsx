/**
 * Mobile-First Navigation
 * 
 * Designed for 360px-430px screens with thumb-friendly navigation.
 * Maximum 4 tabs to fit on smallest screens, 48px touch targets.
 */

import React from 'react';

interface MobileFirstNavigationProps {
  activeTab: 'today' | 'habits' | 'progress' | 'settings';
  onTabChange: (tab: 'today' | 'habits' | 'progress' | 'settings') => void;
}

export function MobileFirstNavigation({ activeTab, onTabChange }: MobileFirstNavigationProps) {
  const tabs = [
    {
      id: 'today' as const,
      name: 'Today',
      icon: '📅',
      shortName: 'Today'
    },
    {
      id: 'habits' as const,
      name: 'Habits',
      icon: '✅',
      shortName: 'Habits'
    },
    {
      id: 'progress' as const,
      name: 'Progress',
      icon: '📊',
      shortName: 'Progress'
    },
    {
      id: 'settings' as const,
      name: 'Settings',
      icon: '⚙️',
      shortName: 'Settings'
    }
  ];

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="grid grid-cols-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-3 px-2 transition-colors min-h-[48px] ${
                activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl mb-1">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.shortName}</span>
            </button>
          ))}
        </div>
      </nav>
      
      {/* Bottom padding to prevent content from being hidden behind nav */}
      <div className="h-16" />
    </>
  );
}