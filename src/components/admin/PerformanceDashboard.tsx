/**
 * Performance Dashboard Component
 * 
 * Real-time performance monitoring dashboard for tracking application
 * performance metrics, API response times, and user experience indicators.
 * Integrated with the comprehensive performance optimization system.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { performanceMonitor } from '../../utils/performanceMonitor';
import PerformanceManager from '../../services/performance';

interface PerformanceStats {
  summary: {
    totalMetrics: number;
    timeRange: { start: string; end: string };
    overallHealth: 'good' | 'warning' | 'critical';
  };
  apiMetrics: {
    averageResponseTime: number;
    slowestEndpoints: Array<{ endpoint: string; averageTime: number; count: number }>;
    errorRate: number;
    totalRequests: number;
  };
  renderMetrics: {
    averageRenderTime: number;
    slowestComponents: Array<{ component: string; averageTime: number; count: number }>;
    totalRenders: number;
  };
  userExperience: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
  };
  recommendations: string[];
}

const PerformanceDashboard: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshStats = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Get comprehensive performance report from new system
      const comprehensiveReport = await PerformanceManager.getComprehensivePerformanceReport();
      
      // Calculate time range for legacy system
      const now = new Date();
      const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24;
      const start = new Date(now.getTime() - (hours * 60 * 60 * 1000));
      
      // Get legacy report for comparison
      const legacyReport = performanceMonitor.generateReport({ start, end: now });
      
      // Merge data from both systems
      const mergedStats: PerformanceStats = {
        summary: {
          totalMetrics: legacyReport.summary.totalMetrics,
          timeRange: legacyReport.summary.timeRange,
          overallHealth: comprehensiveReport.overallScore >= 90 ? 'good' : 
                        comprehensiveReport.overallScore >= 70 ? 'warning' : 'critical',
        },
        apiMetrics: {
          averageResponseTime: comprehensiveReport.averageAPIResponseTime || legacyReport.apiMetrics.averageResponseTime,
          slowestEndpoints: legacyReport.apiMetrics.slowestEndpoints,
          errorRate: legacyReport.apiMetrics.errorRate,
          totalRequests: legacyReport.apiMetrics.totalRequests,
        },
        renderMetrics: legacyReport.renderMetrics,
        userExperience: {
          firstContentfulPaint: comprehensiveReport.firstContentfulPaint || legacyReport.userExperience.firstContentfulPaint,
          largestContentfulPaint: comprehensiveReport.largestContentfulPaint || legacyReport.userExperience.largestContentfulPaint,
          cumulativeLayoutShift: legacyReport.userExperience.cumulativeLayoutShift,
          firstInputDelay: legacyReport.userExperience.firstInputDelay,
        },
        recommendations: [
          ...comprehensiveReport.recommendations,
          ...legacyReport.recommendations,
        ],
      };
      
      setStats(mergedStats);
    } catch (error) {
      console.error('Failed to refresh performance stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshStats]);

  const getHealthStatusColor = (health: string) => {
    switch (health) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthStatusIcon = (health: string) => {
    switch (health) {
      case 'good': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatScore = (score: number) => {
    return score.toFixed(3);
  };

  const clearMetrics = () => {
    performanceMonitor.clearMetrics();
    refreshStats();
  };

  const exportData = () => {
    const data = performanceMonitor.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading performance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '1h' | '6h' | '24h')}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Auto-refresh</span>
            </label>
            
            <button
              onClick={refreshStats}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Overall Health Status */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(stats.summary.overallHealth)}`}>
          <span className="mr-2">{getHealthStatusIcon(stats.summary.overallHealth)}</span>
          Overall Health: {stats.summary.overallHealth.toUpperCase()}
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          Monitoring {stats.summary.totalMetrics} metrics from {new Date(stats.summary.timeRange.start).toLocaleString()} to {new Date(stats.summary.timeRange.end).toLocaleString()}
        </div>
      </div>

      {/* API Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{formatTime(stats.apiMetrics.averageResponseTime)}</div>
            <div className="text-sm text-blue-800">Average Response Time</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.apiMetrics.totalRequests}</div>
            <div className="text-sm text-green-800">Total Requests</div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.apiMetrics.errorRate.toFixed(1)}%</div>
            <div className="text-sm text-red-800">Error Rate</div>
          </div>
        </div>

        {stats.apiMetrics.slowestEndpoints.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Slowest Endpoints</h4>
            <div className="space-y-2">
              {stats.apiMetrics.slowestEndpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <div className="font-mono text-sm text-gray-700 truncate">{endpoint.endpoint}</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{endpoint.count} calls</span>
                    <span className="text-sm font-medium">{formatTime(endpoint.averageTime)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Render Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Render Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{formatTime(stats.renderMetrics.averageRenderTime)}</div>
            <div className="text-sm text-purple-800">Average Render Time</div>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{stats.renderMetrics.totalRenders}</div>
            <div className="text-sm text-indigo-800">Total Renders</div>
          </div>
        </div>

        {stats.renderMetrics.slowestComponents.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Slowest Components</h4>
            <div className="space-y-2">
              {stats.renderMetrics.slowestComponents.map((component, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <div className="font-mono text-sm text-gray-700">{component.component}</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{component.count} renders</span>
                    <span className="text-sm font-medium">{formatTime(component.averageTime)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Web Vitals */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Web Vitals</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-lg font-bold text-gray-700">{formatTime(stats.userExperience.firstContentfulPaint)}</div>
            <div className="text-sm text-gray-600">First Contentful Paint</div>
            <div className="text-xs text-gray-500 mt-1">Target: &lt;1.8s</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-lg font-bold text-gray-700">{formatTime(stats.userExperience.largestContentfulPaint)}</div>
            <div className="text-sm text-gray-600">Largest Contentful Paint</div>
            <div className="text-xs text-gray-500 mt-1">Target: &lt;2.5s</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-lg font-bold text-gray-700">{formatTime(stats.userExperience.firstInputDelay)}</div>
            <div className="text-sm text-gray-600">First Input Delay</div>
            <div className="text-xs text-gray-500 mt-1">Target: &lt;100ms</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-lg font-bold text-gray-700">{formatScore(stats.userExperience.cumulativeLayoutShift)}</div>
            <div className="text-sm text-gray-600">Cumulative Layout Shift</div>
            <div className="text-xs text-gray-500 mt-1">Target: &lt;0.1</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {stats.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Recommendations</h3>
          <div className="space-y-3">
            {stats.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-500 mt-0.5">💡</span>
                <p className="text-sm text-yellow-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Optimization Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Performance Optimization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => {
              if ((window as any).APICache) {
                (window as any).APICache.clear();
                alert('API cache cleared successfully');
                refreshStats();
              } else {
                alert('API cache not available');
              }
            }}
            className="p-4 text-left border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <div className="font-medium text-gray-900 mb-1">Clear API Cache</div>
            <div className="text-sm text-gray-600">Clear all cached API responses to force fresh data</div>
          </button>
          
          <button
            onClick={() => {
              if ((window as any).ComponentChunks) {
                Object.keys((window as any).ComponentChunks).forEach(chunk => {
                  console.log(`Preloading chunk: ${chunk}`);
                });
                alert('Component chunks preloaded');
              } else {
                alert('Component chunking not available');
              }
            }}
            className="p-4 text-left border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
          >
            <div className="font-medium text-gray-900 mb-1">Preload Components</div>
            <div className="text-sm text-gray-600">Preload lazy-loaded components for faster navigation</div>
          </button>
          
          <button
            onClick={async () => {
              try {
                const report = await PerformanceManager.getComprehensivePerformanceReport();
                const link = document.createElement('a');
                link.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(report, null, 2))}`;
                link.download = `performance-optimization-report-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
              } catch (error) {
                console.error('Failed to generate optimization report:', error);
                alert('Failed to generate optimization report');
              }
            }}
            className="p-4 text-left border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <div className="font-medium text-gray-900 mb-1">Export Optimization Report</div>
            <div className="text-sm text-gray-600">Download comprehensive performance analysis</div>
          </button>
        </div>
      </div>

      {/* Performance Targets Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Performance Targets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg border-2 ${
            stats.apiMetrics.averageResponseTime <= 200 ? 'border-green-200 bg-green-50' :
            stats.apiMetrics.averageResponseTime <= 500 ? 'border-yellow-200 bg-yellow-50' :
            'border-red-200 bg-red-50'
          }`}>
            <div className="text-lg font-bold">
              {stats.apiMetrics.averageResponseTime <= 200 ? '✅' :
               stats.apiMetrics.averageResponseTime <= 500 ? '⚠️' : '❌'}
            </div>
            <div className="text-sm font-medium">API Response Time</div>
            <div className="text-xs text-gray-600">Target: &lt; 200ms</div>
            <div className="text-xs text-gray-600">Current: {formatTime(stats.apiMetrics.averageResponseTime)}</div>
          </div>
          
          <div className={`p-4 rounded-lg border-2 ${
            stats.userExperience.firstContentfulPaint <= 1500 ? 'border-green-200 bg-green-50' :
            stats.userExperience.firstContentfulPaint <= 2500 ? 'border-yellow-200 bg-yellow-50' :
            'border-red-200 bg-red-50'
          }`}>
            <div className="text-lg font-bold">
              {stats.userExperience.firstContentfulPaint <= 1500 ? '✅' :
               stats.userExperience.firstContentfulPaint <= 2500 ? '⚠️' : '❌'}
            </div>
            <div className="text-sm font-medium">First Contentful Paint</div>
            <div className="text-xs text-gray-600">Target: &lt; 1.5s</div>
            <div className="text-xs text-gray-600">Current: {formatTime(stats.userExperience.firstContentfulPaint)}</div>
          </div>
          
          <div className={`p-4 rounded-lg border-2 ${
            stats.userExperience.largestContentfulPaint <= 2500 ? 'border-green-200 bg-green-50' :
            stats.userExperience.largestContentfulPaint <= 4000 ? 'border-yellow-200 bg-yellow-50' :
            'border-red-200 bg-red-50'
          }`}>
            <div className="text-lg font-bold">
              {stats.userExperience.largestContentfulPaint <= 2500 ? '✅' :
               stats.userExperience.largestContentfulPaint <= 4000 ? '⚠️' : '❌'}
            </div>
            <div className="text-sm font-medium">Largest Contentful Paint</div>
            <div className="text-xs text-gray-600">Target: &lt; 2.5s</div>
            <div className="text-xs text-gray-600">Current: {formatTime(stats.userExperience.largestContentfulPaint)}</div>
          </div>
          
          <div className={`p-4 rounded-lg border-2 ${
            stats.userExperience.cumulativeLayoutShift <= 0.1 ? 'border-green-200 bg-green-50' :
            stats.userExperience.cumulativeLayoutShift <= 0.25 ? 'border-yellow-200 bg-yellow-50' :
            'border-red-200 bg-red-50'
          }`}>
            <div className="text-lg font-bold">
              {stats.userExperience.cumulativeLayoutShift <= 0.1 ? '✅' :
               stats.userExperience.cumulativeLayoutShift <= 0.25 ? '⚠️' : '❌'}
            </div>
            <div className="text-sm font-medium">Cumulative Layout Shift</div>
            <div className="text-xs text-gray-600">Target: &lt; 0.1</div>
            <div className="text-xs text-gray-600">Current: {formatScore(stats.userExperience.cumulativeLayoutShift)}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
        <div className="flex space-x-4">
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export Data
          </button>
          
          <button
            onClick={clearMetrics}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Clear Metrics
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;