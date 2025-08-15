/**
 * Responsive Analytics View
 * 
 * Automatically switches between desktop and mobile analytics views
 * based on screen size for optimal user experience.
 */

import React, { useState, useEffect } from 'react';
import { SimpleAnalyticsView } from './SimpleAnalyticsView';
import { MobileAnalyticsView } from './MobileAnalyticsView';

export function ResponsiveAnalyticsView() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check initial screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    // Check on mount
    checkScreenSize();

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Use mobile view for screens smaller than 768px (md breakpoint)
  if (isMobile) {
    return <MobileAnalyticsView />;
  }

  // Use desktop view for larger screens
  return <SimpleAnalyticsView />;
}