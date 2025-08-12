/**
 * Cloud Provider Selection Component
 * 
 * Allows users to choose between different cloud storage providers
 * and configure their sync preferences.
 */

import React, { useState } from 'react';
import { Button, Card, CardContent } from '../ui';
import { CloudProviderFactory } from '../../services/sync/CloudProviderFactory';
import { CloudConfig, CloudProviderType } from '../../types/sync';

interface CloudProviderSelectorProps {
  onProviderSelected: (config: CloudConfig | null) => void;
  onBack?: () => void;
  className?: string;
}

export const CloudProviderSelector: React.FC<CloudProviderSelectorProps> = ({
  onProviderSelected,
  onBack,
  className = ''
}) => {
  const [selectedProvider, setSelectedProvider] = useState<CloudProviderType | 'none' | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const providers = CloudProviderFactory.getSupportedProviders();

  const handleProviderChoice = (provider: CloudProviderType | 'none') => {
    setSelectedProvider(provider);
    
    if (provider === 'none') {
      // User chooses local-only mode
      onProviderSelected(null);
      return;
    }
    
    setIsConfiguring(true);
  };

  const handleConfigComplete = (config: CloudConfig) => {
    onProviderSelected(config);
  };

  if (isConfiguring && selectedProvider && selectedProvider !== 'none') {
    if (selectedProvider === 'nextcloud') {
      return (
        <NextCloudConfigForm
          onConfigComplete={handleConfigComplete}
          onBack={() => setIsConfiguring(false)}
          className={className}
        />
      );
    }
    
    if (selectedProvider === 'google-cloud') {
      return (
        <GoogleCloudConfigForm
          onConfigComplete={handleConfigComplete}
          onBack={() => setIsConfiguring(false)}
          className={className}
        />
      );
    }
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">☁️</div>
          <h2 className="text-2xl font-bold text-gray-900">Choose Your Sync Method</h2>
          <p className="text-gray-600 mt-1">
            Keep your habits synchronized across all your devices
          </p>
        </div>

        <div className="space-y-4">
          {/* Local Only Option */}
          <div 
            onClick={() => handleProviderChoice('none')}
            className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">Local Only</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Keep your data on this device only. No cloud sync.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    ✓ Complete Privacy
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    ✓ No Setup Required
                  </span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    ⚠ Single Device Only
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cloud Provider Options */}
          {providers.map((provider) => (
            <div 
              key={provider.type}
              onClick={() => handleProviderChoice(provider.type)}
              className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {provider.type === 'nextcloud' ? (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.5 2C9.5 2 7 4.2 7 7c0 .4 0 .8.1 1.2C5.8 8.7 4.5 10.2 4.5 12c0 2.2 1.8 4 4 4h8c1.7 0 3-1.3 3-3 0-1.4-1-2.6-2.3-2.9C17.4 6.4 15.2 2 12.5 2z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22 11v1c0 5.55-4.45 10-10 10S2 17.55 2 12 6.45 2 12 2c2.05 0 3.95.63 5.53 1.69l-2.08 2.08C14.47 5.29 13.28 5 12 5c-3.87 0-7 3.13-7 7s3.13 7 7 7 7-3.13 7-7v-1h-3l4-4 4 4h-3z"/>
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">{provider.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      provider.setup === 'easy' ? 'bg-green-100 text-green-800' :
                      provider.setup === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {provider.setup} setup
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    {provider.description}
                  </p>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {provider.pros.slice(0, 2).map((pro, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          ✓ {pro}
                        </span>
                      ))}
                    </div>
                    {provider.cons.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          ⚠ {provider.cons[0]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {onBack && (
          <div className="mt-6 text-center">
            <Button
              variant="secondary"
              onClick={onBack}
              className="px-6"
            >
              ← Back
            </Button>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>You can change your sync method later in settings</p>
        </div>
      </CardContent>
    </Card>
  );
};

// NextCloud Configuration Form
interface NextCloudConfigFormProps {
  onConfigComplete: (config: CloudConfig) => void;
  onBack: () => void;
  className?: string;
}

const NextCloudConfigForm: React.FC<NextCloudConfigFormProps> = ({
  onConfigComplete,
  onBack,
  className = ''
}) => {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [syncPath, setSyncPath] = useState('ScienceHabits');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const config: CloudConfig = {
      type: 'nextcloud',
      serverUrl: serverUrl.trim(),
      username: username.trim(),
      appPassword: appPassword.trim(),
      syncPath: syncPath.trim() || 'ScienceHabits'
    };

    try {
      // Test the configuration
      const testResult = await CloudProviderFactory.testAuthentication(config);
      
      if (testResult.success) {
        onConfigComplete(config);
      } else {
        setError(testResult.error || 'Failed to connect to NextCloud server');
      }
    } catch (error) {
      console.error('NextCloud config error:', error);
      setError('Configuration failed. Please check your settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!serverUrl || !username || !appPassword) {
      setError('Please fill in all fields first');
      return;
    }

    setIsTestingConnection(true);
    setError(null);

    const config: CloudConfig = {
      type: 'nextcloud',
      serverUrl: serverUrl.trim(),
      username: username.trim(),
      appPassword: appPassword.trim(),
      syncPath: syncPath.trim() || 'ScienceHabits'
    };

    try {
      const result = await CloudProviderFactory.testConnection(config);
      if (result.success) {
        setError(null);
        alert(`✅ Connection successful! (${result.latency}ms)`);
      } else {
        setError(result.error || 'Connection failed');
      }
    } catch (error) {
      setError('Connection test failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const isFormValid = serverUrl.trim() && username.trim() && appPassword.trim();

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">☁️</div>
          <h2 className="text-2xl font-bold text-gray-900">Configure NextCloud</h2>
          <p className="text-gray-600 mt-1">
            Connect to your NextCloud server
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Server URL
            </label>
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://cloud.example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your NextCloud username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              App Password
            </label>
            <input
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="Generate in NextCloud settings"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Create an app password in your NextCloud security settings
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sync Folder (optional)
            </label>
            <input
              type="text"
              value={syncPath}
              onChange={(e) => setSyncPath(e.target.value)}
              placeholder="ScienceHabits"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              type="button"
              onClick={testConnection}
              disabled={!isFormValid || isTestingConnection}
              variant="secondary"
              className="flex-1"
            >
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
            
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              variant="primary"
              className="flex-1"
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={onBack}>
            ← Back to providers
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Google Cloud Configuration Form  
interface GoogleCloudConfigFormProps {
  onConfigComplete: (config: CloudConfig) => void;
  onBack: () => void;
  className?: string;
}

const GoogleCloudConfigForm: React.FC<GoogleCloudConfigFormProps> = ({
  onConfigComplete,
  onBack,
  className = ''
}) => {
  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔜</div>
          <h2 className="text-2xl font-bold text-gray-900">Google Cloud Coming Soon</h2>
          <p className="text-gray-600 mt-1">
            Google Cloud Storage integration is being implemented
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <p className="text-sm text-blue-700">
            Google Cloud Storage support will be available in the next update. 
            For now, please choose NextCloud or Local Only mode.
          </p>
        </div>

        <Button onClick={onBack} className="w-full">
          ← Choose Different Provider
        </Button>
      </CardContent>
    </Card>
  );
};