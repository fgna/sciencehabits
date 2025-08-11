import React from 'react';

interface ValidationStatusProps {
  status: 'complete' | 'partial' | 'missing_research';
  missingResearchCount?: number;
  className?: string;
}

export function ValidationStatus({ status, missingResearchCount = 0, className = '' }: ValidationStatusProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'complete':
        return {
          icon: '✅',
          text: 'Research verified',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'partial':
        return {
          icon: '⚠️',
          text: `Research partially available (${missingResearchCount} missing)`,
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200'
        };
      case 'missing_research':
        return {
          icon: '🔍',
          text: 'Research evidence being compiled',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className={`
      flex items-center gap-2 px-3 py-2 rounded-lg border text-sm
      ${display.bgColor} ${display.textColor} ${display.borderColor}
      ${className}
    `}>
      <span className="text-base">{display.icon}</span>
      <span className="font-medium">{display.text}</span>
    </div>
  );
}

interface ResearchPendingProps {
  habitTitle: string;
  missingCount?: number;
  className?: string;
}

export function ResearchPending({ habitTitle, missingCount = 1, className = '' }: ResearchPendingProps) {
  return (
    <div className={`
      bg-gradient-to-r from-blue-50 to-indigo-50 
      border border-blue-200 rounded-lg p-4
      ${className}
    `}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-blue-900 mb-1">
            Research Evidence Coming Soon
          </h4>
          <p className="text-sm text-blue-700 mb-2">
            We're compiling scientific evidence for "{habitTitle}". 
            {missingCount > 1 && ` ${missingCount} studies are being reviewed.`}
          </p>
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Research in progress</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DevValidationWarningProps {
  missingResearchIds: string[];
  habitId: string;
}

export function DevValidationWarning({ missingResearchIds, habitId }: DevValidationWarningProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Development Warning: Missing Research Data
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>Habit "{habitId}" references research that doesn't exist:</p>
            <ul className="list-disc list-inside mt-1">
              {missingResearchIds.map(id => (
                <li key={id}><code className="bg-red-100 px-1 rounded">{id}</code></li>
              ))}
            </ul>
          </div>
          <div className="mt-3">
            <div className="flex">
              <button className="bg-red-100 text-red-800 px-3 py-1 rounded text-xs hover:bg-red-200">
                View Validation Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ValidationSummaryCardProps {
  title: string;
  count: number;
  status: 'error' | 'warning' | 'info' | 'success';
  description?: string;
  className?: string;
}

export function ValidationSummaryCard({ 
  title, 
  count, 
  status, 
  description,
  className = ''
}: ValidationSummaryCardProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          count: 'text-red-900',
          icon: '🚨'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          count: 'text-yellow-900',
          icon: '⚠️'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          count: 'text-blue-900',
          icon: '💡'
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          count: 'text-green-900',
          icon: '✅'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className={`
      ${styles.bg} ${styles.border} border rounded-lg p-4
      ${className}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{styles.icon}</span>
          <h3 className={`font-medium ${styles.text}`}>{title}</h3>
        </div>
        <span className={`text-2xl font-bold ${styles.count}`}>{count}</span>
      </div>
      {description && (
        <p className={`mt-2 text-sm ${styles.text}`}>{description}</p>
      )}
    </div>
  );
}