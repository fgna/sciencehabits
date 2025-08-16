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
import { GoalMappingTab } from './GoalMappingTab';

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

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'goal-mapping' | 'json' | 'translations' | 'validation'>('overview');
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

  const [localizedContent, setLocalizedContent] = useState<LocalizedContent | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);

  useEffect(() => {
    checkAdminAuth();
    loadDashboardStats();
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
      
      // For demo purposes, use mock data
      const mockStats = {
        totalHabits: 47,
        totalResearch: 23,
        translationCompleteness: 85,
        recentUploads: uploadResults.length,
        validationIssues: 3
      };
      
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
          translationCompleteness: 85
        }
      };
      
      setStats(mockStats);
      setLocalizedContent(mockLocalizedContent);
      console.log('✅ Dashboard stats loaded successfully');
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
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

  const renderTranslationsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Translation Status</h3>
          
          {localizedContent && (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">German Translation Progress</span>
                  <span className="text-sm text-gray-600">{localizedContent.metadata.translationCompleteness}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${localizedContent.metadata.translationCompleteness}%` }}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Content Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Habits:</span>
                      <span>{localizedContent.habits.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Research:</span>
                      <span>{localizedContent.research.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Untranslated Items:</span>
                      <span className="text-red-600">{localizedContent.untranslatedContent.length}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Missing Translations</h4>
                  {localizedContent.untranslatedContent.length > 0 ? (
                    <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                      {localizedContent.untranslatedContent.slice(0, 10).map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-xs bg-yellow-50 p-2 rounded">
                          <span className="truncate">{item.title}</span>
                          <span className={`px-1 py-0.5 rounded text-xs ${
                            item.priority === 'high' ? 'bg-red-100 text-red-800' :
                            item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-green-600">✅ All content translated!</p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
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
            { id: 'content', label: 'Content', icon: '📝' },
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
            {activeTab === 'goal-mapping' && <GoalMappingTab />}
            {activeTab === 'json' && renderJSONTab()}
            {activeTab === 'translations' && renderTranslationsTab()}
            {(activeTab === 'content' || activeTab === 'validation') && (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🚧</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                  <p className="text-gray-600">
                    This section is under development and will be available in the next update.
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