/**
 * Mobile Period Selector
 * 
 * Sticky navigation bar with thumb-friendly period selection buttons.
 * Optimized for one-handed mobile usage.
 */

import React from 'react';

type TimeRange = 'week' | 'month' | '3months' | 'year';

interface MobilePeriodSelectorProps {
  selectedPeriod: TimeRange;
  onPeriodChange: (period: TimeRange) => void;
}

const PERIODS: { value: TimeRange; label: string; description: string }[] = [
  { value: 'week', label: 'Week', description: 'Last 7 days' },
  { value: 'month', label: 'Month', description: 'Last 30 days' },
  { value: '3months', label: 'Quarter', description: 'Last 90 days' },
  { value: 'year', label: 'Year', description: 'Last 365 days' }
];

export function MobilePeriodSelector({ selectedPeriod, onPeriodChange }: MobilePeriodSelectorProps) {
  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-30 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-bold text-gray-900">Analytics</h1>
        <span className="text-xs text-gray-500">
          {PERIODS.find(p => p.value === selectedPeriod)?.description}
        </span>
      </div>
      
      {/* Period Selection Buttons */}
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
        {PERIODS.map((period) => (
          <button
            key={period.value}
            className={`
              flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
              min-w-[44px] min-h-[44px] flex items-center justify-center
              ${selectedPeriod === period.value 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }
            `}
            onClick={() => onPeriodChange(period.value)}
            aria-label={`View ${period.description} analytics`}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}