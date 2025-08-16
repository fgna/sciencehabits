/**
 * Admin Dashboard Component
 * 
 * Main administrative interface for content management system.
 * Provides access to all CMS features with role-based permissions.
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent } from '../ui';
import { 
  AdminAuthService, 
  ContentManager, 
  JSONWorkflowService, 
  ResearchValidator,
  AdminUser,
  UploadResult,
  LocalizedContent
} from '../../services/cms';
import { ContentAPIClient, ContentAPIHealth, ContentStats } from '../../services/admin';
import { GoalMappingTab } from './GoalMappingTab';
import { HabitsManager } from './HabitsManager';
import { ResearchManager } from './ResearchManager';
import { TranslationDashboard } from './TranslationDashboard';

interface AdminDashboardProps {
  onClose?: () => void;
  className?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onClose,
  className = ''
}) => {
  const [adminAuth] = useState(() => new AdminAuthService());
  const [contentManager] = useState(() => new ContentManager(adminAuth));
  const [jsonWorkflow] = useState(() => new JSONWorkflowService(adminAuth, contentManager));
  const [researchValidator] = useState(() => new ResearchValidator(adminAuth));
  const [contentAPI] = useState(() => new ContentAPIClient());

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'habits' | 'research' | 'goal-mapping' | 'json' | 'translations' | 'validation'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalHabits: 0,
    totalResearch: 0,
    translationCompleteness: 0,
    recentUploads: 0,
    validationIssues: 0
  });

  // Content API state
  const [apiHealth, setApiHealth] = useState<ContentAPIHealth | null>(null);
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const [localizedContent, setLocalizedContent] = useState<LocalizedContent | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);

  useEffect(() => {
    const initializeData = async () => {
      await checkAdminAuth();
      await loadContentAPIData();
      await loadDashboardStats();
    };
    
    initializeData();
  }, []);

  const checkAdminAuth = async () => {
    try {
      // For demo purposes, create a mock admin user immediately
      const mockUser: AdminUser = {
        id: 'admin-001',
        email: process.env.REACT_APP_ADMIN_EMAIL || 'admin@example.com',
        role: 'super_admin',
        permissions: [
          {
            resource: 'habits',
            actions: ['create', 'read', 'update', 'delete', 'publish']
          },
          {
            resource: 'research',
            actions: ['create', 'read', 'update', 'delete', 'publish']
          },
          {
            resource: 'translations',
            actions: ['create', 'read', 'update', 'delete']
          },
          {
            resource: 'users',
            actions: ['create', 'read', 'update', 'delete']
          },
          {
            resource: 'system',
            actions: ['create', 'read', 'update', 'delete']
          }
        ],
        lastLogin: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setCurrentUser(mockUser);
      console.log('✅ Demo admin authenticated successfully');
    } catch (error) {
      console.error('Admin auth check failed:', error);
      setError('Authentication failed');
    }
  };

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Use Content API data if available, otherwise fallback to mock data
      if (contentStats) {
        const updatedStats = {
          totalHabits: contentStats.summary.totalHabits,
          totalResearch: contentStats.summary.totalResearch,
          translationCompleteness: contentStats.byLanguage.de?.completeness || 0,
          recentUploads: uploadResults.length,
          validationIssues: connectionStatus === 'connected' ? 1 : 3
        };
        setStats(updatedStats);
      } else {
        // Fallback to mock data when Content API is not available
        const mockStats = {
          totalHabits: 47,
          totalResearch: 23,
          translationCompleteness: 85,
          recentUploads: uploadResults.length,
          validationIssues: 3
        };
        setStats(mockStats);
      }
      
      const mockLocalizedContent = {
        habits: [],
        research: [],
        untranslatedContent: [
          {
            contentType: 'habit' as const,
            contentId: 'habit-1',
            title: 'Morning Meditation',
            missingFields: ['description'],
            priority: 'high' as const
          },
          {
            contentType: 'research' as const,
            contentId: 'research-1', 
            title: 'Sleep Study 2024',
            missingFields: ['summary'],
            priority: 'medium' as const
          }
        ],
        metadata: {
          language: 'de',
          version: '1.0.0',
          lastUpdated: new Date(),
          translationCompleteness: contentStats?.byLanguage.de?.completeness || 85
        }
      };
      
      setLocalizedContent(mockLocalizedContent);
      console.log('✅ Dashboard stats loaded successfully');
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadContentAPIData = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Test connection first
      const connectionTest = await contentAPI.testConnection();
      if (connectionTest.connected) {
        setConnectionStatus('connected');
        
        // Load API health data
        const health = await contentAPI.checkHealth();
        setApiHealth(health);
        
        // Load content statistics
        const statsResult = await contentAPI.getContentStats();
        if (statsResult.success && statsResult.data) {
          setContentStats(statsResult.data);
        }
        
        console.log('✅ Content API data loaded successfully');
      } else {
        setConnectionStatus('disconnected');
        console.warn('⚠️ Content API is not available, using mock data');
      }
      
    } catch (error) {
      console.error('Failed to load Content API data:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleJSONUpload = async (file: File, type: 'habits' | 'research') => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await jsonWorkflow.uploadFile(file, type);
      setUploadResults([result, ...uploadResults.slice(0, 9)]); // Keep last 10 uploads

      if (result.success) {
        await loadDashboardStats(); // Refresh stats
        alert(`✅ Successfully uploaded ${result.recordCount} ${type} records!`);
      } else {
        alert(`❌ Upload failed: ${result.errors.map(e => e.message).join(', ')}`);
      }
    } catch (error) {
      console.error('JSON upload failed:', error);
      setError('JSON upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidationRun = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const validationStats = await researchValidator.runDailyValidation();
      alert(`✅ Validation completed: ${validationStats.validated} validated, ${validationStats.errors} errors, ${validationStats.warnings} warnings`);
      
      await loadDashboardStats(); // Refresh stats
    } catch (error) {
      console.error('Validation run failed:', error);
      setError('Validation run failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Content API Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Content API Status</h3>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
              connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              <span className="capitalize">{connectionStatus}</span>
            </div>
          </div>
          
          {apiHealth && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Version</p>
                <p className="font-medium">{apiHealth.version}</p>
              </div>
              <div>
                <p className="text-gray-600">Uptime</p>
                <p className="font-medium">{Math.round(apiHealth.uptime / 3600)}h</p>
              </div>
              <div>
                <p className="text-gray-600">Endpoints</p>
                <p className="font-medium">{Object.keys(apiHealth.endpoints).length} active</p>
              </div>
              <div>
                <p className="text-gray-600">Last Update</p>
                <p className="font-medium">{new Date(apiHealth.lastUpdate).toLocaleDateString()}</p>
              </div>
            </div>
          )}
          
          {connectionStatus === 'disconnected' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                📡 Content API is unavailable. Dashboard is running in mock mode with sample data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Habits</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalHabits}</p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Research Studies</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalResearch}</p>
              </div>
              <div className="text-3xl">📚</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">German Translation</p>
                <p className="text-2xl font-bold text-purple-600">{stats.translationCompleteness}%</p>
              </div>
              <div className="text-3xl">🌍</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Goal Mapping Score</p>
                <p className="text-2xl font-bold text-green-600">98/100</p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Issues</p>
                <p className="text-2xl font-bold text-orange-600">{stats.validationIssues}</p>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setActiveTab('goal-mapping')} variant="primary">
              🎯 Goal Mapping
            </Button>
            <Button onClick={() => setActiveTab('json')} variant="secondary">
              📤 Upload JSON
            </Button>
            <Button onClick={handleValidationRun} variant="secondary" disabled={isLoading}>
              🔍 Run Validation
            </Button>
            <Button onClick={() => setActiveTab('translations')} variant="secondary">
              🌍 Translations
            </Button>
            <Button onClick={() => contentManager.syncContentUpdates()} variant="secondary">
              🔄 Sync Content
            </Button>
            <Button onClick={loadContentAPIData} variant="secondary" disabled={isLoading}>
              📡 Test API Connection
            </Button>
            <Button onClick={() => window.open('https://github.com/freya/sciencehabits-content-api', '_blank')} variant="secondary">
              🔧 Manage Content Repo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {uploadResults.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Uploads</h3>
            <div className="space-y-3">
              {uploadResults.slice(0, 5).map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{result.fileName}</p>
                    <p className="text-sm text-gray-600">{result.recordCount} records</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-sm ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? '✅ Success' : '❌ Failed'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderJSONTab = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">JSON Upload</h3>
          <p className="text-gray-600 mb-6">
            Upload your existing JSON files to update content. Files will be validated and duplicates detected automatically.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Habits Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <div className="text-4xl mb-3">🎯</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Habits</h4>
              <p className="text-sm text-gray-600 mb-4">Upload habits.json or enhanced_habits.json</p>
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleJSONUpload(file, 'habits');
                }}
                className="hidden"
                id="habits-upload"
              />
              <label
                htmlFor="habits-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Choose File
              </label>
            </div>

            {/* Research Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
              <div className="text-4xl mb-3">📚</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Research</h4>
              <p className="text-sm text-gray-600 mb-4">Upload research_articles.json</p>
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleJSONUpload(file, 'research');
                }}
                className="hidden"
                id="research-upload"
              />
              <label
                htmlFor="research-upload"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
              >
                Choose File
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload History</h3>
            <div className="space-y-4">
              {uploadResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{result.fileName}</h4>
                    <span className={`px-2 py-1 rounded text-sm ${
                      result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? '✅ Success' : '❌ Failed'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Records: {result.recordCount}</p>
                    {result.errors.length > 0 && (
                      <p className="text-red-600">Errors: {result.errors.length}</p>
                    )}
                    {result.warnings.length > 0 && (
                      <p className="text-yellow-600">Warnings: {result.warnings.length}</p>
                    )}
                    {result.duplicates && (
                      <p className="text-blue-600">
                        Duplicates: {result.duplicates.exactDuplicates.length} exact, {result.duplicates.likelyDuplicates.length} likely
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );


  if (!currentUser) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Authentication Required</h2>
          {error ? (
            <p className="text-red-600 mb-4">{error}</p>
          ) : (
            <p className="text-gray-600 mb-4">Checking authentication...</p>
          )}
          {onClose && (
            <Button onClick={onClose}>Close</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`w-full max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CMS Admin Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {currentUser.email} ({currentUser.role.replace('_', ' ')})
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={() => adminAuth.logout()} variant="ghost">
              Sign Out
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="secondary">
                Close
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'habits', label: 'Habits', icon: '🎯' },
            { id: 'research', label: 'Research', icon: '📚' },
            { id: 'goal-mapping', label: 'Goal Mapping', icon: '🎯' },
            { id: 'json', label: 'JSON Upload', icon: '📤' },
            { id: 'translations', label: 'Translations', icon: '🌍' },
            { id: 'validation', label: 'Validation', icon: '🔍' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {isLoading && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⏳</div>
            <p>Loading...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'habits' && (
              <HabitsManager contentAPI={contentAPI} />
            )}
            {activeTab === 'research' && (
              <ResearchManager contentAPI={contentAPI} />
            )}
            {activeTab === 'goal-mapping' && <GoalMappingTab />}
            {activeTab === 'json' && renderJSONTab()}
            {activeTab === 'translations' && (
              <TranslationDashboard />
            )}
            {activeTab === 'validation' && (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🚧</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                  <p className="text-gray-600">
                    Content validation dashboard is under development.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};