/**
 * Mobile Floating Action Button
 * 
 * Thumb-friendly floating action button for quick access to science insights.
 * Positioned for optimal reachability on mobile devices.
 */

import React from 'react';

interface MobileFloatingActionsProps {
  onShowScience: () => void;
}

export function MobileFloatingActions({ onShowScience }: MobileFloatingActionsProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button 
        onClick={onShowScience}
        className="
          bg-blue-600 hover:bg-blue-700 active:bg-blue-800
          text-white w-14 h-14 rounded-full shadow-lg 
          flex items-center justify-center
          transition-all duration-200 transform hover:scale-105 active:scale-95
          min-h-[44px] min-w-[44px]
        "
        aria-label="View science insights"
      >
        <span className="text-2xl">🧠</span>
      </button>
    </div>
  );
}