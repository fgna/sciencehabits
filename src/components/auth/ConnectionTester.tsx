/**
 * Connection Tester Component
 * 
 * Provides comprehensive testing and validation of cloud provider connections.
 * Tests connection, authentication, and basic operations.
 */

import React, { useState } from 'react';
import { Button, Card, CardContent } from '../ui';
import { CloudProviderFactory } from '../../services/sync/CloudProviderFactory';
import { CloudConfig, CloudProviderType } from '../../types/sync';

interface ConnectionTesterProps {
  config: CloudConfig;
  onTestComplete?: (success: boolean, results: TestResults) => void;
  onClose?: () => void;
  className?: string;
}

interface TestResults {
  connection: TestResult;
  authentication: TestResult;
  basicOperations?: TestResult;
  quota?: {
    used: number;
    available: number | null;
    percentage: number | null;
  };
}

interface TestResult {
  success: boolean;
  latency?: number;
  error?: string;
  details?: string;
}

export const ConnectionTester: React.FC<ConnectionTesterProps> = ({
  config,
  onTestComplete,
  onClose,
  className = ''
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [results, setResults] = useState<TestResults | null>(null);
  const [progress, setProgress] = useState(0);

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setCurrentTest(null);
    setResults(null);
    setProgress(0);

    const testResults: TestResults = {
      connection: { success: false },
      authentication: { success: false }
    };

    try {
      // Test 1: Connection Test
      setCurrentTest('Testing connection...');
      setProgress(25);
      
      const connectionResult = await CloudProviderFactory.testConnection(config);
      testResults.connection = {
        success: connectionResult.success,
        latency: connectionResult.latency,
        error: connectionResult.error,
        details: connectionResult.success 
          ? `Connected successfully in ${connectionResult.latency}ms`
          : connectionResult.error
      };

      if (!testResults.connection.success) {
        setResults(testResults);
        setCurrentTest('Connection test failed');
        if (onTestComplete) onTestComplete(false, testResults);
        return;
      }

      // Test 2: Authentication Test
      setCurrentTest('Testing authentication...');
      setProgress(50);
      
      const authResult = await CloudProviderFactory.testAuthentication(config);
      testResults.authentication = {
        success: authResult.success,
        error: authResult.error,
        details: authResult.success 
          ? 'Authentication successful'
          : authResult.error
      };

      if (authResult.quota) {
        testResults.quota = authResult.quota;
      }

      if (!testResults.authentication.success) {
        setResults(testResults);
        setCurrentTest('Authentication test failed');
        if (onTestComplete) onTestComplete(false, testResults);
        return;
      }

      // Test 3: Basic Operations Test
      setCurrentTest('Testing basic operations...');
      setProgress(75);
      
      const operationsResult = await testBasicOperations(config);
      testResults.basicOperations = operationsResult;

      setProgress(100);
      setCurrentTest('Tests completed!');
      setResults(testResults);

      const overallSuccess = testResults.connection.success && 
                            testResults.authentication.success && 
                            (testResults.basicOperations?.success ?? true);

      if (onTestComplete) {
        onTestComplete(overallSuccess, testResults);
      }

    } catch (error) {
      console.error('Comprehensive test failed:', error);
      setCurrentTest('Test suite failed');
      const errorResult = {
        ...testResults,
        connection: { 
          ...testResults.connection, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      };
      setResults(errorResult);
      if (onTestComplete) onTestComplete(false, errorResult);
    } finally {
      setIsRunning(false);
    }
  };

  const testBasicOperations = async (config: CloudConfig): Promise<TestResult> => {
    try {
      const provider = CloudProviderFactory.create(config);
      
      // Test file listing
      await provider.listFiles('');
      
      // Test directory creation (by uploading a test file)
      const testData = {
        data: [1, 2, 3, 4, 5], // Small test payload
        iv: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
        timestamp: Date.now(),
        context: 'connection-test',
        version: '1.0'
      };
      
      const testFileName = `test-${Date.now()}`;
      
      // Upload test file
      await provider.uploadFile(testFileName, testData);
      
      // Download test file
      const downloaded = await provider.downloadFile(testFileName);
      
      // Verify data integrity
      const dataMatches = JSON.stringify(downloaded) === JSON.stringify(testData);
      
      // Clean up - delete test file
      try {
        await provider.deleteFile(testFileName);
      } catch (error) {
        console.warn('Failed to clean up test file:', error);
      }
      
      return {
        success: dataMatches,
        details: dataMatches 
          ? 'File operations successful'
          : 'Data integrity check failed'
      };
    } catch (error) {
      console.error('Basic operations test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Operations test failed',
        details: 'Could not perform file upload/download test'
      };
    }
  };

  const getProviderInfo = (type: CloudProviderType) => {
    const providers = CloudProviderFactory.getSupportedProviders();
    return providers.find(p => p.type === type);
  };

  const formatQuota = (quota: TestResults['quota']) => {
    if (!quota) return 'Unknown';
    
    const formatBytes = (bytes: number) => {
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = bytes;
      let unitIndex = 0;
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      
      return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const used = formatBytes(quota.used);
    const available = quota.available ? formatBytes(quota.available) : 'Unlimited';
    
    return `${used} used${quota.available ? ` of ${available}` : ''}`;
  };

  const providerInfo = getProviderInfo(config.type as CloudProviderType);

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Connection Test</h2>
            <p className="text-gray-600 mt-1">
              Testing connection to {providerInfo?.name || config.type}
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>

        {/* Configuration Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Configuration</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Provider:</strong> {providerInfo?.name || config.type}</p>
            {config.type === 'nextcloud' && (
              <>
                <p><strong>Server:</strong> {(config as any).serverUrl}</p>
                <p><strong>Username:</strong> {(config as any).username}</p>
                <p><strong>Sync Path:</strong> {(config as any).syncPath}</p>
              </>
            )}
            {config.type === 'google-cloud' && (
              <>
                <p><strong>Project:</strong> {(config as any).projectId}</p>
                <p><strong>Bucket:</strong> {(config as any).bucketName}</p>
                <p><strong>Region:</strong> {(config as any).region}</p>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {currentTest || 'Initializing...'}
              </span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Test Results */}
        {results && (
          <div className="space-y-4 mb-6">
            <h3 className="font-medium text-gray-900">Test Results</h3>
            
            {/* Connection Test Result */}
            <div className={`p-3 rounded-lg ${
              results.connection.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`text-lg ${
                  results.connection.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {results.connection.success ? '✅' : '❌'}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    results.connection.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    Connection Test
                  </p>
                  <p className={`text-sm ${
                    results.connection.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {results.connection.details || results.connection.error || 'No details available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Authentication Test Result */}
            <div className={`p-3 rounded-lg ${
              results.authentication.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`text-lg ${
                  results.authentication.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {results.authentication.success ? '✅' : '❌'}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    results.authentication.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    Authentication Test
                  </p>
                  <p className={`text-sm ${
                    results.authentication.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {results.authentication.details || results.authentication.error || 'No details available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Operations Test Result */}
            {results.basicOperations && (
              <div className={`p-3 rounded-lg ${
                results.basicOperations.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className={`text-lg ${
                    results.basicOperations.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {results.basicOperations.success ? '✅' : '❌'}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      results.basicOperations.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      File Operations Test
                    </p>
                    <p className={`text-sm ${
                      results.basicOperations.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {results.basicOperations.details || results.basicOperations.error || 'No details available'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Storage Quota Info */}
            {results.quota && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="text-lg text-blue-600">💾</div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Storage Quota</p>
                    <p className="text-sm text-blue-700">
                      {formatQuota(results.quota)}
                      {results.quota.percentage !== null && (
                        ` (${results.quota.percentage.toFixed(1)}% used)`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={runComprehensiveTest}
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? 'Testing...' : 'Run Full Test'}
          </Button>
          
          {onClose && (
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isRunning}
            >
              {results ? 'Close' : 'Cancel'}
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-4 text-xs text-gray-500">
          <p>
            The full test checks connection, authentication, and basic file operations.
            This helps ensure your sync will work properly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};