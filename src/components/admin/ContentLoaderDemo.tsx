import React, { useState, useEffect } from 'react';
import { contentManager } from '../../services/storage/ContentManager';
import { ContentLoadResult } from '../../types/content';
import { Card, CardContent, Button } from '../ui';

/**
 * Demo component showing the modular content loading system in action
 * This would be useful for development and content management
 */
export function ContentLoaderDemo() {
  const [loadResult, setLoadResult] = useState<ContentLoadResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const result = await contentManager.initialize();
      setLoadResult(result);
      setStats(contentManager.getStats());
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadContent = async () => {
    setIsLoading(true);
    try {
      const result = await contentManager.reload();
      setLoadResult(result);
      setStats(contentManager.getStats());
    } catch (error) {
      console.error('Failed to reload content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !loadResult) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const validation = loadResult?.validation;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modular Content Loading System</h1>
          <p className="text-gray-600">Demonstrating dynamic content discovery and validation</p>
        </div>
        <Button onClick={reloadContent} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Reload Content'}
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <Card>
          <CardContent>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Content Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.habits}</div>
                  <div className="text-sm text-gray-500">Total Habits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.research}</div>
                  <div className="text-sm text-gray-500">Research Articles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.filesLoaded}</div>
                  <div className="text-sm text-gray-500">Files Loaded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{stats.processingTime.toFixed(1)}ms</div>
                  <div className="text-sm text-gray-500">Load Time</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Errors */}
          <Card className={validation.errors.length > 0 ? 'border-red-200' : ''}>
            <CardContent>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-red-500 text-xl">❌</span>
                  <h3 className="text-lg font-semibold">Validation Errors ({validation.errors.length})</h3>
                </div>
                
                {validation.errors.length === 0 ? (
                  <p className="text-green-600">No validation errors found! ✅</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {validation.errors.map((error, index) => (
                      <div key={index} className="p-3 bg-red-50 rounded border border-red-200">
                        <div className="font-medium text-red-800">{error.message}</div>
                        <div className="text-sm text-red-600">
                          {error.file} {error.itemId && `(${error.itemId})`}
                        </div>
                        {error.field && (
                          <div className="text-xs text-red-500 mt-1">Field: {error.field}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          <Card className={validation.warnings.length > 0 ? 'border-yellow-200' : ''}>
            <CardContent>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-yellow-500 text-xl">⚠️</span>
                  <h3 className="text-lg font-semibold">Validation Warnings ({validation.warnings.length})</h3>
                </div>
                
                {validation.warnings.length === 0 ? (
                  <p className="text-green-600">No validation warnings! ✅</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {validation.warnings.map((warning, index) => (
                      <div key={index} className="p-3 bg-yellow-50 rounded border border-yellow-200">
                        <div className="font-medium text-yellow-800">{warning.message}</div>
                        <div className="text-sm text-yellow-600">
                          {warning.file} {warning.itemId && `(${warning.itemId})`}
                        </div>
                        {warning.suggestion && (
                          <div className="text-xs text-yellow-600 mt-1">💡 {warning.suggestion}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loaded Files */}
      {loadResult && (
        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Loaded Content Files</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadResult.loadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{file.path.split('/').pop()}</div>
                      <div className="text-xs text-gray-500">
                        {file.category} • {file.type} • {Array.isArray(file.data) ? file.data.length : 0} items
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(file.loadedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Content Preview */}
      {loadResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sample Habits */}
          <Card>
            <CardContent>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Sample Loaded Habits</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {loadResult.habits.slice(0, 5).map((habit, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="font-medium text-blue-900">{habit.title}</div>
                      <div className="text-sm text-blue-700">{habit.description}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        {habit.timeMinutes} min • {habit.difficulty} • {habit.goalTags?.join(', ')}
                      </div>
                    </div>
                  ))}
                  {loadResult.habits.length > 5 && (
                    <div className="text-center text-gray-500 text-sm">
                      ... and {loadResult.habits.length - 5} more habits
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Research */}
          <Card>
            <CardContent>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Sample Loaded Research</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {loadResult.research.slice(0, 5).map((article, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded border border-green-200">
                      <div className="font-medium text-green-900">{article.title}</div>
                      <div className="text-sm text-green-700">{article.subtitle}</div>
                      <div className="text-xs text-green-600 mt-1">
                        {article.readingTime} min read • {article.difficulty} • {article.studyDetails.year}
                      </div>
                    </div>
                  ))}
                  {loadResult.research.length > 5 && (
                    <div className="text-center text-gray-500 text-sm">
                      ... and {loadResult.research.length - 5} more articles
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integration Guide */}
      <Card>
        <CardContent>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">🚀 How to Use This System</h3>
            <div className="prose prose-sm max-w-none">
              <h4>Adding New Content:</h4>
              <ol>
                <li><strong>Habits</strong>: Add JSON files to <code>src/data/habits/</code> (e.g., <code>exercise-habits.json</code>)</li>
                <li><strong>Research</strong>: Add JSON files to <code>src/data/research/</code> (e.g., <code>exercise-research.json</code>)</li>
                <li><strong>Custom</strong>: Add files to <code>src/data/content-custom/</code></li>
                <li><strong>Auto-Discovery</strong>: The system automatically finds and loads new files</li>
              </ol>

              <h4>Content Validation:</h4>
              <ul>
                <li>✅ Required fields validation</li>
                <li>✅ Unique ID enforcement</li>
                <li>✅ Cross-reference validation (habit ↔ research)</li>
                <li>✅ Data type and format validation</li>
                <li>⚠️ Warnings for missing optional fields</li>
              </ul>

              <h4>Benefits:</h4>
              <ul>
                <li>🔄 <strong>No code changes</strong> needed to add content</li>
                <li>📦 <strong>Clean separation</strong> between core and custom content</li>
                <li>🛡️ <strong>Validation</strong> catches errors before deployment</li>
                <li>🔥 <strong>Hot reload</strong> during development</li>
                <li>📊 <strong>Detailed logging</strong> for content creators</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}