/**
 * Responsive Analytics View
 * 
 * MVP: Mobile-first analytics optimized for small screens
 * Always uses mobile-optimized view for MVP
 */

import React, { useState, useEffect } from 'react';
import { SimpleAnalyticsView } from './SimpleAnalyticsView';
import { MobileAnalyticsView } from './MobileAnalyticsView';

export function ResponsiveAnalyticsView() {
  const [isMobile, setIsMobile] = useState(true); // MVP: Default to mobile-first

  useEffect(() => {
    // MVP: Check initial screen size with mobile bias
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // MVP: Use mobile view for tablets too
    };

    // Check on mount
    checkScreenSize();

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // MVP: Use mobile view for most screens (mobile-first approach)
  if (isMobile) {
    return <MobileAnalyticsView />;
  }

  // Use simple desktop view only for large screens
  return <SimpleAnalyticsView />;
}