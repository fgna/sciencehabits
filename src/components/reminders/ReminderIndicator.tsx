/**
 * Reminder Indicator Component
 * 
 * Shows reminder status in the UI with quick access to settings.
 * Displays next reminder time and notification count.
 */

import React, { useState } from 'react';
import { Button } from '../ui';
import { useReminderStatus } from '../../contexts/ReminderContext';
import { ReminderSettings } from './ReminderSettings';

interface ReminderIndicatorProps {
  className?: string;
}

export function ReminderIndicator({ className = '' }: ReminderIndicatorProps) {
  const { isEnabled, hasPermission, nextReminder, totalScheduled } = useReminderStatus();
  const [showSettings, setShowSettings] = useState(false);

  const formatNextReminderTime = (date: Date | null): string => {
    if (!date) return 'None';
    
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffMs < 0) return 'Now';
    if (diffMinutes === 0) return '<1m';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const getReminderStatusColor = (): string => {
    if (!hasPermission) return 'text-gray-400';
    if (!isEnabled) return 'text-yellow-500';
    if (totalScheduled === 0) return 'text-gray-500';
    return 'text-green-500';
  };

  const getReminderStatusIcon = (): string => {
    if (!hasPermission) return '🔕';
    if (!isEnabled) return '⏸️';
    if (totalScheduled === 0) return '⏰';
    return '🔔';
  };

  const getReminderStatusText = (): string => {
    if (!hasPermission) return 'Permission needed';
    if (!isEnabled) return 'Disabled';
    if (totalScheduled === 0) return 'No reminders';
    return `${totalScheduled} active`;
  };

  return (
    <>
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(true)}
          className="flex items-center space-x-2 hover:bg-gray-100"
          title="Open reminder settings"
        >
          <span className="text-lg">{getReminderStatusIcon()}</span>
          
          <div className="flex flex-col items-start text-xs">
            <span className={`font-medium ${getReminderStatusColor()}`}>
              {getReminderStatusText()}
            </span>
            
            {isEnabled && totalScheduled > 0 && (
              <span className="text-gray-500">
                Next: {formatNextReminderTime(nextReminder)}
              </span>
            )}
          </div>
        </Button>

        {/* Notification dot for upcoming reminders */}
        {isEnabled && nextReminder && (
          <div className="relative">
            {(() => {
              const now = new Date();
              const diffMs = nextReminder.getTime() - now.getTime();
              const diffMinutes = Math.floor(diffMs / (1000 * 60));
              
              // Show pulsing dot if reminder is within 30 minutes
              if (diffMinutes <= 30 && diffMinutes > 0) {
                return (
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" 
                       title={`Reminder in ${diffMinutes} minutes`} />
                );
              }
              
              // Show solid dot if reminder is overdue or due now
              if (diffMinutes <= 0) {
                return (
                  <div className="w-2 h-2 bg-red-500 rounded-full" 
                       title="Reminder is due now!" />
                );
              }
              
              return null;
            })()}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <ReminderSettings 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}

/**
 * Compact version for mobile/small spaces
 */
export function CompactReminderIndicator({ className = '' }: ReminderIndicatorProps) {
  const { isEnabled, hasPermission, nextReminder, totalScheduled } = useReminderStatus();
  const [showSettings, setShowSettings] = useState(false);

  const getReminderStatusColor = (): string => {
    if (!hasPermission) return 'text-gray-400';
    if (!isEnabled) return 'text-yellow-500';
    if (totalScheduled === 0) return 'text-gray-500';
    return 'text-green-500';
  };

  const getReminderStatusIcon = (): string => {
    if (!hasPermission) return '🔕';
    if (!isEnabled) return '⏸️';
    if (totalScheduled === 0) return '⏰';
    return '🔔';
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSettings(true)}
        className={`p-2 hover:bg-gray-100 ${className}`}
        title={`Reminders: ${isEnabled ? `${totalScheduled} active` : 'Disabled'}`}
      >
        <span className={`text-lg ${getReminderStatusColor()}`}>
          {getReminderStatusIcon()}
        </span>
        
        {totalScheduled > 0 && (
          <span className="ml-1 text-xs font-medium text-gray-600">
            {totalScheduled}
          </span>
        )}
      </Button>

      <ReminderSettings 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}

/**
 * Reminder status badge for dashboard
 */
export function ReminderStatusBadge({ className = '' }: ReminderIndicatorProps) {
  const { isEnabled, hasPermission, totalScheduled } = useReminderStatus();

  if (!hasPermission || !isEnabled) {
    return null; // Don't show badge if reminders aren't working
  }

  if (totalScheduled === 0) {
    return null; // Don't show badge if no reminders
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ${className}`}>
      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
      {totalScheduled} reminder{totalScheduled !== 1 ? 's' : ''} active
    </div>
  );
}