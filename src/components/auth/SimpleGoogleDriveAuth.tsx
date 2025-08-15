/**
 * Google Drive Authentication
 * 
 * Implements real Google OAuth 2.0 authentication for Google Drive access.
 * Requires proper Google Cloud project setup with OAuth client ID.
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent } from '../ui';
import { GoogleDriveService } from '../../services/googleDriveService';

// TypeScript declarations for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: any) => void;
            error_callback?: (error: any) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

interface SimpleGoogleDriveAuthProps {
  onAuthComplete: (success: boolean) => void;
  onBack?: () => void;
  className?: string;
}

export const SimpleGoogleDriveAuth: React.FC<SimpleGoogleDriveAuthProps> = ({
  onAuthComplete,
  onBack,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isScriptLoading, setIsScriptLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Google OAuth configuration
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive.file';

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const loadGoogleScript = () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('Google Identity Services script loaded');
          // Wait a bit for the global google object to be available
          setTimeout(() => {
            setIsScriptLoading(false);
            initializeGoogleAuth();
          }, 100);
        };
        
        script.onerror = () => {
          console.error('Failed to load Google Identity Services script');
          setError('Failed to load Google services. Please check your internet connection.');
          setIsScriptLoading(false);
        };
        
        document.head.appendChild(script);
      } else {
        // Script already exists, check if google is available
        if (window.google?.accounts?.oauth2) {
          setIsScriptLoading(false);
          initializeGoogleAuth();
        } else {
          // Wait for google object to be available
          timeoutId = setTimeout(() => {
            if (window.google?.accounts?.oauth2) {
              setIsScriptLoading(false);
              initializeGoogleAuth();
            } else {
              console.warn('Google object not available, retrying...');
              setRetryCount(prev => prev + 1);
            }
          }, 500);
        }
      }
    };

    loadGoogleScript();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [retryCount]);

  const initializeGoogleAuth = () => {
    if (!window.google) {
      console.error('Google Identity Services not loaded');
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      setError('Google OAuth client ID not configured. Please set REACT_APP_GOOGLE_CLIENT_ID in your environment variables.');
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        callback: handleAuthResponse,
        error_callback: handleAuthError,
      });
      setTokenClient(client);
    } catch (err) {
      console.error('Failed to initialize Google OAuth client:', err);
      setError('Failed to initialize Google authentication. Please check your configuration.');
    }
  };

  const handleAuthResponse = async (response: any) => {
    console.log('Google OAuth response:', response);
    
    if (response.access_token) {
      console.log('✅ Google authentication successful');
      console.log('✅ Access token received');
      
      // Store the access token for Google Drive API calls
      localStorage.setItem('google_drive_token', response.access_token);
      
      // Test the connection to ensure everything works
      try {
        console.log('🔄 Testing Google Drive connection...');
        const testResult = await GoogleDriveService.testConnection();
        
        if (testResult.success) {
          console.log('✅ Google Drive connection test successful');
          onAuthComplete(true);
        } else {
          console.error('Google Drive connection test failed:', testResult.error);
          setError(`Connection test failed: ${testResult.error}`);
        }
      } catch (err: any) {
        console.error('Google Drive connection test error:', err);
        setError('Unable to connect to Google Drive. Please try again.');
      }
      
      setIsLoading(false);
    } else {
      console.error('No access token in response');
      setError('Authentication failed. No access token received.');
      setIsLoading(false);
    }
  };

  const handleAuthError = (error: any) => {
    console.error('Google OAuth error:', error);
    
    let errorMessage = 'Authentication failed. Please try again.';
    
    if (error.type === 'popup_closed' || error.error === 'popup_closed_by_user') {
      errorMessage = 'Sign-in was cancelled. Please try again when ready.';
    } else if (error.type === 'popup_blocked') {
      errorMessage = 'Pop-up was blocked. Please allow pop-ups for this site and try again.';
    } else if (error.error === 'invalid_client') {
      errorMessage = 'Invalid Google client configuration. Please check your OAuth setup.';
    }
    
    setError(errorMessage);
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!tokenClient) {
      setError('Google authentication not ready. Please wait and try again.');
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      setError('Google OAuth not configured. Please set up your Google Cloud project and add REACT_APP_GOOGLE_CLIENT_ID to your environment.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Starting Google OAuth flow...');
      tokenClient.requestAccessToken();
    } catch (err: any) {
      console.error('Google sign-in failed:', err);
      setError(err.message || 'Unable to start Google sign-in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="p-6 text-center space-y-6">
        {/* Google Drive Icon */}
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 1C7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900">
          Connect Google Drive
        </h2>
        
        <p className="text-gray-600">
          Sync your habits securely across all your devices with Google Drive.
        </p>

        {/* Error Display */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-amber-900 mb-1">Setup Required</h4>
                <p className="text-sm text-amber-800 mb-3">{error}</p>
                {error.includes('OAuth') && (
                  <div className="text-xs text-amber-700 bg-amber-100 rounded p-2">
                    <p className="font-medium mb-1">Quick Setup:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                      <li>Create project → Enable Drive API → Create OAuth client</li>
                      <li>Add {window.location.origin} to authorized origins</li>
                      <li>Copy client ID to REACT_APP_GOOGLE_CLIENT_ID in .env.local</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sign In Button */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          isLoading={isLoading}
          variant="primary"
          size="lg"
          fullWidth={true}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {!isLoading && (
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 1C7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {isLoading ? 'Connecting...' : 'Sign in with Google'}
        </Button>
        
        {onBack && (
          <button 
            onClick={onBack}
            className="text-gray-500 text-sm hover:text-gray-700"
          >
            ← Back to sync options
          </button>
        )}

        {/* Simple trust indicator */}
        <p className="text-xs text-gray-500">
          🔒 Your data is encrypted and stays private
        </p>
      </CardContent>
    </Card>
  );
};