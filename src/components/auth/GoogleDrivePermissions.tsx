/**
 * Google Drive Permissions Component
 * 
 * Provides clear, user-friendly explanation of Google Drive permissions
 * and authentication flow for ScienceHabits sync.
 */

import React, { useState } from 'react';
import { Button, Card, CardContent } from '../ui';
import { GoogleDriveAuth } from '../../services/sync/GoogleDriveProvider';

interface GoogleDrivePermissionsProps {
  onAuthComplete: (success: boolean) => void;
  onBack?: () => void;
  className?: string;
}

export const GoogleDrivePermissions: React.FC<GoogleDrivePermissionsProps> = ({
  onAuthComplete,
  onBack,
  className = ''
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'explanation' | 'authenticating' | 'success'>('explanation');

  const handleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);
      setStep('authenticating');

      // Initialize Google API
      await GoogleDriveAuth.initializeAuth();
      
      // Attempt sign in
      const success = await GoogleDriveAuth.signIn();
      
      if (success) {
        setStep('success');
        setTimeout(() => {
          onAuthComplete(true);
        }, 1500);
      } else {
        throw new Error('Sign in was cancelled or failed');
      }
    } catch (error) {
      console.error('Google Drive authentication error:', error);
      setError(getErrorMessage(error));
      setStep('explanation');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getErrorMessage = (error: any): string => {
    if (error?.error === 'popup_closed_by_user' || error?.error === 'access_denied') {
      return 'Sign in was cancelled. Please try again when you\'re ready.';
    }
    
    if (error?.error === 'popup_blocked') {
      return 'Pop-up was blocked. Please allow pop-ups for this site and try again.';
    }
    
    if (error?.message?.includes('client_id') || error?.message?.includes('1234567890')) {
      return 'Google Drive sync requires OAuth setup. Please configure a Google client ID in .env.local or use "Stay Local Only" for now.';
    }
    
    return 'Connection failed. Please check your internet connection and try again.';
  };

  if (step === 'authenticating') {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Connecting to Google Drive
          </h2>
          <p className="text-gray-600 mb-4">
            Please complete the sign-in process in the Google window.
          </p>
          <div className="text-sm text-gray-500">
            This may take a few moments...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'success') {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Connected Successfully!
          </h2>
          <p className="text-gray-600">
            Your habits will now sync securely to Google Drive.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="p-6 text-center space-y-6">
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">✓</div>
            <div className="w-12 h-1 bg-blue-600"></div>
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
          </div>
        </div>

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
          Almost Done!
        </h2>
        
        <p className="text-gray-600 leading-relaxed">
          Google will ask for permission to store your encrypted habit data. 
          We'll create a private folder in your Google Drive just for ScienceHabits.
        </p>

        {/* What we ask for */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
          <div className="flex items-start gap-2 text-green-800 font-medium mb-2">
            <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>What we ask Google for:</span>
          </div>
          <ul className="text-sm text-green-700 space-y-1 ml-6">
            <li>✅ Create a "ScienceHabits" folder in your Drive</li>
            <li>✅ Save your encrypted habit backups there</li>
            <li>❌ We can't see your other files</li>
            <li>❌ We can't read your emails or personal data</li>
          </ul>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-semibold text-amber-900 mb-1">Setup Needed</h4>
                <p className="text-sm text-amber-800 mb-3">{error}</p>
                <button 
                  onClick={onBack}
                  className="text-xs text-amber-700 hover:text-amber-800 underline"
                >
                  Try a different sync option
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!error && (
          <Button
            onClick={handleSignIn}
            disabled={isAuthenticating}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 1C7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isAuthenticating ? 'Connecting...' : 'Continue to Google'}
          </Button>
        )}
        
        {onBack && (
          <button 
            onClick={onBack}
            className="text-gray-500 text-sm hover:text-gray-700"
          >
            ← Back to sync options
          </button>
        )}

        {/* Trust indicator */}
        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            🔒 Your data is encrypted before it leaves your device
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Simple Google Drive Setup Status Component
interface GoogleDriveStatusProps {
  isConnected: boolean;
  userEmail?: string;
  onDisconnect?: () => void;
  onReconnect?: () => void;
  className?: string;
}

export const GoogleDriveStatus: React.FC<GoogleDriveStatusProps> = ({
  isConnected,
  userEmail,
  onDisconnect,
  onReconnect,
  className = ''
}) => {
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!onDisconnect) return;
    
    setIsDisconnecting(true);
    try {
      await GoogleDriveAuth.signOut();
      onDisconnect();
    } catch (error) {
      console.error('Disconnect failed:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Google Drive</h4>
              <p className="text-sm text-gray-500">Not connected</p>
            </div>
            {onReconnect && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onReconnect}
              >
                Connect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Google Drive</h4>
            <p className="text-sm text-gray-500">
              {userEmail ? `Connected as ${userEmail}` : 'Connected and syncing'}
            </p>
          </div>
          {onDisconnect && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};