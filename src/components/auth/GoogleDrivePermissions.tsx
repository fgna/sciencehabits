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
    
    if (error?.message?.includes('client_id')) {
      return 'Google Drive setup is not yet configured. Please try NextCloud or Local mode instead.';
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
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 1C7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Connect Your Google Drive
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Safely sync your habits across all devices with simple Google sign-in.
            Your data stays private and encrypted.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="bg-blue-50 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-gray-900 text-center mb-4">
            ✨ What you get with Google Drive sync
          </h3>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <span>Access habits on phone, tablet, and computer</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <span>Automatic backup to your Google Drive</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <span>End-to-end encryption keeps your data private</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <span>Uses your existing Google account - no new passwords</span>
            </div>
          </div>
        </div>

        {/* Permission Explanation */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-2">
                What Google will ask permission for:
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Create a "ScienceHabits" folder in your Drive</li>
                <li>✅ Save your encrypted habit backups there</li>
                <li>✅ Access only files created by this app</li>
              </ul>
            </div>
          </div>
        </div>

        {/* What We DON'T Access */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                What we CAN'T access:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>❌ Your other Google Drive files</li>
                <li>❌ Your emails or Gmail</li>
                <li>❌ Your photos or personal documents</li>
                <li>❌ Your contacts or calendar</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Connection Issue</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleSignIn}
            disabled={isAuthenticating}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 1C7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isAuthenticating ? 'Connecting...' : 'Sign in with Google'}
          </Button>

          {onBack && (
            <Button
              variant="secondary"
              onClick={onBack}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              ← Back to sync options
            </Button>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="text-center pt-6 border-t border-gray-100 mt-6">
          <p className="text-xs text-gray-500 mb-2">
            🔒 Your data is encrypted before it leaves your device
          </p>
          <p className="text-xs text-gray-500">
            ✅ We use Google's secure authentication - no passwords stored
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