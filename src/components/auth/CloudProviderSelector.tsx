/**
 * Cloud Provider Selection Component
 * 
 * MVP: Simplified to show local-only mode with informational message
 * Full cloud provider functionality disabled for MVP
 */

import React from 'react';
import { Card, CardContent } from '../ui';
import { CloudConfig } from '../../types/sync';

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
  // MVP: Cloud sync disabled for MVP - show local-only mode
  return (
    <Card className={className}>
      <CardContent>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">💾</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Local Storage Only</h3>
          <p className="text-gray-600 mb-4">
            Cloud sync is temporarily disabled. Your data is safely stored locally on your device.
          </p>
          <p className="text-sm text-gray-500">
            MVP Version: Cloud sync will be restored in the full version.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

/* 
Full cloud provider implementation preserved for restoration:
- Google Drive integration with SimpleGoogleDriveAuth
- NextCloud configuration with app password support
- Local-only mode option
- Configuration validation and error handling
- Provider selection UI with icons and descriptions
Restore complete implementation in the full version.
*/