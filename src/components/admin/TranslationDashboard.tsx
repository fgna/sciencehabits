import React, { useState, useEffect } from 'react';
import { SupportedLanguage } from '../../types/i18n';
import { translationMetadataService } from '../../services/i18n/TranslationMetadataService';
import { qualityWarningService } from '../../services/i18n/QualityWarningService';

interface DashboardStats {
  totalTranslations: number;
  reviewedTranslations: number;
  pendingReviews: number;
  flaggedTranslations: number;
  averageConfidence: number;
  translationsByLanguage: Record<SupportedLanguage, number>;
  qualityWarningsByType: Record<string, number>;
}

interface QualityAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  fileId: string;
  language: SupportedLanguage;
  contentType: 'habit' | 'research' | 'ui';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export function TranslationDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load statistics
      const dashboardStats = translationMetadataService.getTranslationStats();
      setStats(dashboardStats);

      // Load quality alerts
      const activeAlerts = qualityWarningService.getActiveAlerts();
      setAlerts(activeAlerts);

      console.log('📊 Loaded dashboard data:', { stats: dashboardStats, alerts: activeAlerts.length });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleResolveAlert = async (alertId: string) => {
    try {
      await qualityWarningService.resolveAlert(alertId, 'admin', 'Resolved from dashboard');
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleMarkAsReviewed = async (fileId: string) => {
    try {
      await translationMetadataService.markAsReviewed(fileId, 'admin', 'Reviewed from dashboard');
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to mark as reviewed:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (selectedLanguage !== 'all' && alert.language !== selectedLanguage) {
      return false;
    }
    if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) {
      return false;
    }
    return true;
  });

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Translation Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitor and manage multi-language content translation quality and reviews
        </p>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Translations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTranslations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reviewed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reviewedTranslations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Confidence</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageConfidence}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language Breakdown */}
      {stats && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Translations by Language</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.translationsByLanguage).map(([language, count]) => (
              <div key={language} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">
                  {language === 'en' && '🇺🇸'}
                  {language === 'de' && '🇩🇪'}
                  {language === 'fr' && '🇫🇷'}
                  {language === 'es' && '🇪🇸'}
                </div>
                <p className="text-sm font-medium text-gray-600">{language.toUpperCase()}</p>
                <p className="text-xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality Alerts */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Quality Alerts</h2>
            <div className="flex space-x-4">
              {/* Language Filter */}
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage | 'all')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Languages</option>
                <option value="en">English</option>
                <option value="de">German</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
              </select>

              {/* Severity Filter */}
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <span className="text-4xl mb-4 block">🎉</span>
              <p className="text-lg font-medium">No quality alerts!</p>
              <p className="text-sm">All translations are meeting quality standards.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div key={alert.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">{getTypeIcon(alert.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{alert.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {alert.language.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{alert.message}</p>
                      <div className="text-sm text-gray-500">
                        <span>File: {alert.fileId}</span>
                        <span className="mx-2">•</span>
                        <span>Type: {alert.contentType}</span>
                        <span className="mx-2">•</span>
                        <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleMarkAsReviewed(alert.fileId)}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-sm"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              const report = qualityWarningService.generateQualityReport();
              console.log('📊 Quality Report:', report);
              alert('Quality report generated! Check console for details.');
            }}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="text-xl mb-2">📊</div>
            <h3 className="font-medium text-gray-900">Generate Quality Report</h3>
            <p className="text-sm text-gray-600">Create comprehensive quality analysis</p>
          </button>

          <button
            onClick={() => {
              const data = translationMetadataService.exportMetadata();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `translation-metadata-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="text-xl mb-2">💾</div>
            <h3 className="font-medium text-gray-900">Export Metadata</h3>
            <p className="text-sm text-gray-600">Download translation metadata backup</p>
          </button>

          <button
            onClick={() => {
              const data = qualityWarningService.exportQualityData();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `quality-data-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="text-xl mb-2">📋</div>
            <h3 className="font-medium text-gray-900">Export Quality Data</h3>
            <p className="text-sm text-gray-600">Download quality alerts and rules</p>
          </button>
        </div>
      </div>
    </div>
  );
}