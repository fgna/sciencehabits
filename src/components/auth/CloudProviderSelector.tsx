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
import { SimpleGoogleDriveAuth } from './SimpleGoogleDriveAuth';
import { HabitSyncService } from '../../services/habitSyncService';

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
    
    if (selectedProvider === 'google-drive') {
      return (
        <SimpleGoogleDriveAuth
          onAuthComplete={async (success) => {
            if (success) {
              // Enable sync service
              const syncResult = await HabitSyncService.enableGoogleDriveSync();
              if (syncResult.success) {
                handleConfigComplete({
                  type: 'google-drive'
                });
              } else {
                console.error('Failed to enable sync:', syncResult.error);
                setIsConfiguring(false);
              }
            } else {
              setIsConfiguring(false);
            }
          }}
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
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sync Your Habits Everywhere
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Keep your progress safe and access your habits on all your devices. 
            Your data stays private and encrypted.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="bg-blue-50 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-gray-900 text-center mb-3">
            ✨ What you get with sync
          </h3>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Access habits on phone, tablet, and computer</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Automatic backup to your chosen cloud service</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>End-to-end encryption keeps your data private</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Choose your sync option:</h3>
          
          {/* Google Drive Option - Primary */}
          <div 
            onClick={() => handleProviderChoice('google-drive')}
            className="border-2 border-blue-200 bg-blue-50 rounded-xl p-5 cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 1C7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Google Drive 
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">Recommended</span>
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Simple one-click setup. Your encrypted habits will be saved to your Google Drive.
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Uses your existing Google account • No setup required</span>
                </div>
              </div>
            </div>
          </div>

          {/* NextCloud Option */}
          <div 
            onClick={() => handleProviderChoice('nextcloud')}
            className="border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">NextCloud</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Use your own cloud server for maximum privacy. Perfect for EU users.
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Self-hosted • GDPR compliant • Advanced users</span>
                </div>
              </div>
            </div>
          </div>

          {/* Local Only Option */}
          <div 
            onClick={() => handleProviderChoice('none')}
            className="border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Stay Local Only</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Keep everything on this device only. Most private option, but no sync.
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L7.5 7.5m2.378 2.378a3 3 0 104.243 4.243m0 0L12 12m-2.378-2.378L12 12m0 0l2.121 2.121M12 12L9.879 9.879" />
                  </svg>
                  <span>No internet required • Maximum privacy</span>
                </div>
              </div>
            </div>
          </div>

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

        {/* Trust indicators */}
        <div className="text-center pt-6 border-t border-gray-100 mt-6">
          <p className="text-xs text-gray-500 mb-2">🔒 Your data is encrypted before it leaves your device</p>
          <p className="text-xs text-gray-500 mb-2">✅ We never see your personal information or cloud files</p>
          <p className="text-xs text-gray-500">You can change your sync method later in settings</p>
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