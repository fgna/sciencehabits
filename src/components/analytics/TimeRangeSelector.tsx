import React from 'react';

interface TimeRangeSelectorProps {
  value: '7d' | '30d' | '90d';
  onChange: (range: '7d' | '30d' | '90d') => void;
}

const timeRangeOptions = [
  { value: '7d' as const, label: '7 days' },
  { value: '30d' as const, label: '30 days' },
  { value: '90d' as const, label: '90 days' }
];

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange
}) => {
  return (
    <div className="time-range-selector">
      {timeRangeOptions.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`time-range-btn ${value === option.value ? 'active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};