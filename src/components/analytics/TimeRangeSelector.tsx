import React, { useState, useEffect } from 'react';
import { getTimeRangeOptions, TimeRangeOption } from '../../config/ui';

interface TimeRangeSelectorProps {
  value: '7d' | '30d' | '90d';
  onChange: (range: '7d' | '30d' | '90d') => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange
}) => {
  const [timeRangeOptions, setTimeRangeOptions] = useState<TimeRangeOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await getTimeRangeOptions();
        // Filter to only include the values supported by the component
        const filteredOptions = options.filter(opt => 
          ['7d', '30d', '90d'].includes(opt.value)
        );
        setTimeRangeOptions(filteredOptions);
      } catch (error) {
        console.error('Failed to load time range options:', error);
        // Fallback options
        setTimeRangeOptions([
          { value: '7d', label: '7 days', description: 'Past week', icon: '📅' },
          { value: '30d', label: '30 days', description: 'Past month', icon: '📆' },
          { value: '90d', label: '3 months', description: 'Past quarter', icon: '📊' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  if (loading) {
    return (
      <div className="time-range-selector">
        <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
      </div>
    );
  }

  return (
    <div className="time-range-selector">
      {timeRangeOptions.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value as '7d' | '30d' | '90d')}
          className={`time-range-btn ${value === option.value ? 'active' : ''}`}
          title={option.description}
        >
          <span className="mr-1">{option.icon}</span>
          {option.label}
        </button>
      ))}
    </div>
  );
};