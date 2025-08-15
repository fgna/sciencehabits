/**
 * Admin Dashboard Component
 * 
 * Main administrative interface for content management system.
 * Provides access to all CMS features with role-based permissions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardContent } from '../ui';
import { 
  AdminAuthService, 
  ContentManager, 
  JSONWorkflowService, 
  I18nContentLoader,
  ResearchValidator,
  AdminUser,
  UploadResult,
  LocalizedContent
} from '../../services/cms';
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
  // const [i18nLoader] = useState(() => new I18nContentLoader(contentManager));
  const [researchValidator] = useState(() => new ResearchValidator(adminAuth));

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'json' | 'translations' | 'validation'>('overview');
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
  }, [loadDashboardStats]);

  const checkAdminAuth = async () => {
    try {
      // For demo purposes, create a mock admin user immediately
      const mockUser: AdminUser = {
        id: 'admin-001',
        email: 'admin@sciencehabits.app',
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

  const loadDashboardStats = useCallback(async () => {
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
  }, []);

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
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setActiveTab('json')} variant="primary">
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

      {/* Translation Management Dashboard */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Translation Management</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              Full Feature Set
            </span>
          </div>
          <TranslationDashboard />
        </CardContent>
      </Card>
    </div>
  );

  const renderContentTab = () => (
    <div className="space-y-6">
      {/* Content Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Habits Management</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Habits:</span>
                <span className="font-medium">{stats.totalHabits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Published:</span>
                <span className="font-medium text-green-600">{Math.floor(stats.totalHabits * 0.85)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Draft:</span>
                <span className="font-medium text-yellow-600">{Math.floor(stats.totalHabits * 0.12)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Under Review:</span>
                <span className="font-medium text-blue-600">{Math.floor(stats.totalHabits * 0.03)}</span>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button variant="primary" className="text-sm">View All Habits</Button>
              <Button variant="secondary" className="text-sm">Add New Habit</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Research Management</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Studies:</span>
                <span className="font-medium">{stats.totalResearch}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Validated:</span>
                <span className="font-medium text-green-600">{Math.floor(stats.totalResearch * 0.91)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Review:</span>
                <span className="font-medium text-yellow-600">{Math.floor(stats.totalResearch * 0.09)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">High Quality Score:</span>
                <span className="font-medium text-purple-600">{Math.floor(stats.totalResearch * 0.78)}</span>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button variant="primary" className="text-sm">View All Research</Button>
              <Button variant="secondary" className="text-sm">Add New Study</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Management Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-xl mb-2">✏️</div>
              <h4 className="font-medium text-gray-900">Bulk Edit</h4>
              <p className="text-sm text-gray-600">Edit multiple items at once</p>
            </button>
            
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-xl mb-2">🔄</div>
              <h4 className="font-medium text-gray-900">Sync Content</h4>
              <p className="text-sm text-gray-600">Synchronize with external sources</p>
            </button>

            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-xl mb-2">📋</div>
              <h4 className="font-medium text-gray-900">Content Audit</h4>
              <p className="text-sm text-gray-600">Review content quality and accuracy</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Content Activity */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">📝</div>
                <div>
                  <p className="font-medium text-sm">Updated "Morning Meditation" habit</p>
                  <p className="text-xs text-gray-600">2 hours ago</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Updated</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm">📚</div>
                <div>
                  <p className="font-medium text-sm">Added new research study on sleep habits</p>
                  <p className="text-xs text-gray-600">5 hours ago</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Added</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm">🌍</div>
                <div>
                  <p className="font-medium text-sm">Completed German translation review</p>
                  <p className="text-xs text-gray-600">1 day ago</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Reviewed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderValidationTab = () => (
    <div className="space-y-6">
      {/* Validation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Validation Issues</p>
                <p className="text-2xl font-bold text-red-600">{stats.validationIssues}</p>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Validated Content</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalHabits + stats.totalResearch - stats.validationIssues}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Validation Run</p>
                <p className="text-sm font-medium text-gray-900">2 hours ago</p>
              </div>
              <div className="text-3xl">🔍</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handleValidationRun}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              disabled={isLoading}
            >
              <div className="text-xl mb-2">🔍</div>
              <h4 className="font-medium text-gray-900">Run Full Validation</h4>
              <p className="text-sm text-gray-600">Check all content for issues and inconsistencies</p>
            </button>

            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-xl mb-2">🔗</div>
              <h4 className="font-medium text-gray-900">Validate Links</h4>
              <p className="text-sm text-gray-600">Check all external links and references</p>
            </button>

            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-xl mb-2">📊</div>
              <h4 className="font-medium text-gray-900">Data Integrity Check</h4>
              <p className="text-sm text-gray-600">Verify data consistency and relationships</p>
            </button>

            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-xl mb-2">🏷️</div>
              <h4 className="font-medium text-gray-900">Validate Metadata</h4>
              <p className="text-sm text-gray-600">Check tags, categories, and classifications</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Validation Issues */}
      {stats.validationIssues > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Issues</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <div className="text-red-500 mt-0.5">⚠️</div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-red-900">Missing Research Reference</p>
                  <p className="text-sm text-red-700">Habit "Daily Walking" references non-existent study ID: study_789</p>
                  <p className="text-xs text-red-600 mt-1">Found in: habits.json, line 45</p>
                </div>
                <Button variant="secondary" className="text-xs">Fix</Button>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="text-yellow-500 mt-0.5">⚠️</div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-yellow-900">Translation Missing</p>
                  <p className="text-sm text-yellow-700">Research study "Sleep Quality 2024" missing German translation</p>
                  <p className="text-xs text-yellow-600 mt-1">Priority: Medium</p>
                </div>
                <Button variant="secondary" className="text-xs">Translate</Button>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                <div className="text-orange-500 mt-0.5">⚠️</div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-orange-900">Broken External Link</p>
                  <p className="text-sm text-orange-700">Research DOI link returns 404 error</p>
                  <p className="text-xs text-orange-600 mt-1">DOI: 10.1234/example.2024.001</p>
                </div>
                <Button variant="secondary" className="text-xs">Update</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation History */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation History</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Full validation completed</p>
                <p className="text-xs text-gray-600">2 hours ago • 3 issues found</p>
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Issues Found</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Link validation completed</p>
                <p className="text-xs text-gray-600">6 hours ago • All links valid</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Passed</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Data integrity check completed</p>
                <p className="text-xs text-gray-600">1 day ago • 1 issue resolved</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Resolved</span>
            </div>
          </div>
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
            {activeTab === 'content' && renderContentTab()}
            {activeTab === 'json' && renderJSONTab()}
            {activeTab === 'translations' && renderTranslationsTab()}
            {activeTab === 'validation' && renderValidationTab()}
          </>
        )}
      </div>
    </div>
  );
};