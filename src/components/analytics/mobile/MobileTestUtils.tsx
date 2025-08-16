/**
 * Mobile UX Test Utilities
 * 
 * Helper functions and components for testing mobile responsiveness
 * and accessibility of the analytics dashboard.
 */

import React from 'react';

export interface MobileTestConfig {
  deviceName: string;
  viewport: {
    width: number;
    height: number;
  };
  touchSupport: boolean;
  userAgent: string;
}

export const MOBILE_TEST_DEVICES: MobileTestConfig[] = [
  {
    deviceName: 'iPhone SE',
    viewport: { width: 375, height: 667 },
    touchSupport: true,
    userAgent: 'iPhone SE'
  },
  {
    deviceName: 'iPhone 14',
    viewport: { width: 390, height: 844 },
    touchSupport: true,
    userAgent: 'iPhone 14'
  },
  {
    deviceName: 'Samsung Galaxy S21',
    viewport: { width: 384, height: 854 },
    touchSupport: true,
    userAgent: 'Samsung Galaxy S21'
  },
  {
    deviceName: 'iPad Portrait',
    viewport: { width: 768, height: 1024 },
    touchSupport: true,
    userAgent: 'iPad'
  }
];

export interface AccessibilityTestResult {
  component: string;
  touchTargetSize: 'pass' | 'fail';
  screenReaderLabels: 'pass' | 'fail';
  keyboardNavigation: 'pass' | 'fail';
  colorContrast: 'pass' | 'fail';
  issues: string[];
}

/**
 * Test component for validating mobile UX principles
 */
export function MobileUXValidator({ children }: { children: React.ReactNode }) {
  const [testResults, setTestResults] = React.useState<AccessibilityTestResult[]>([]);
  
  React.useEffect(() => {
    // Run automated accessibility checks
    const runTests = () => {
      const results: AccessibilityTestResult[] = [];
      
      // Check touch target sizes
      const interactiveElements = document.querySelectorAll('button, a, input, [role="button"]');
      interactiveElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const minSize = 44; // 44px minimum touch target
        
        if (rect.width < minSize || rect.height < minSize) {
          console.warn(`Touch target too small: ${element.tagName} (${rect.width}x${rect.height})`);
        }
      });
      
      // Check for aria-labels
      const buttonsWithoutLabels = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
      if (buttonsWithoutLabels.length > 0) {
        console.warn(`${buttonsWithoutLabels.length} buttons missing accessibility labels`);
      }
      
      setTestResults(results);
    };
    
    // Run tests after component mount
    setTimeout(runTests, 1000);
  }, []);
  
  return (
    <div data-testid="mobile-ux-container">
      {children}
    </div>
  );
}

/**
 * Hook for testing mobile responsiveness
 */
export function useMobileTest() {
  const [deviceInfo, setDeviceInfo] = React.useState({
    isMobile: false,
    isTablet: false,
    touchSupport: false,
    screenWidth: 0,
    screenHeight: 0
  });
  
  React.useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const touchSupport = 'ontouchstart' in window;
      
      setDeviceInfo({
        isMobile,
        isTablet,
        touchSupport,
        screenWidth: width,
        screenHeight: height
      });
    };
    
    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    
    return () => window.removeEventListener('resize', updateDeviceInfo);
  }, []);
  
  return deviceInfo;
}

/**
 * Component for displaying mobile UX test results
 */
export function MobileTestSummary() {
  const deviceInfo = useMobileTest();
  
  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs z-50 max-w-sm">
      <h4 className="font-bold mb-2">Mobile UX Test</h4>
      <div className="space-y-1">
        <div>Screen: {deviceInfo.screenWidth}x{deviceInfo.screenHeight}</div>
        <div>Mobile: {deviceInfo.isMobile ? '✅' : '❌'}</div>
        <div>Touch: {deviceInfo.touchSupport ? '✅' : '❌'}</div>
        <div>Viewport: {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}</div>
      </div>
    </div>
  );
}

/**
 * Test runner for mobile analytics components
 */
export function runMobileAnalyticsTests() {
  console.log('🧪 Running Mobile Analytics UX Tests...');
  
  const tests = [
    {
      name: 'Touch Target Sizes',
      test: () => {
        const interactiveElements = document.querySelectorAll('button, a, input, [role="button"]');
        const failedElements: Element[] = [];
        
        interactiveElements.forEach((element) => {
          const rect = element.getBoundingClientRect();
          if (rect.width < 44 || rect.height < 44) {
            failedElements.push(element);
          }
        });
        
        return {
          passed: failedElements.length === 0,
          message: failedElements.length > 0 
            ? `${failedElements.length} elements below 44px minimum`
            : 'All touch targets meet minimum size requirements'
        };
      }
    },
    {
      name: 'Accessibility Labels',
      test: () => {
        const unlabeledButtons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        const unlabeledWithoutText = Array.from(unlabeledButtons).filter(btn => !btn.textContent?.trim());
        
        return {
          passed: unlabeledWithoutText.length === 0,
          message: unlabeledWithoutText.length > 0
            ? `${unlabeledWithoutText.length} buttons missing accessible labels`
            : 'All interactive elements have proper labels'
        };
      }
    },
    {
      name: 'Responsive Layout',
      test: () => {
        const width = window.innerWidth;
        const isMobileViewport = width < 768;
        const hasMobileOptimizations = document.querySelector('[class*="grid-cols-2"]') !== null;
        
        return {
          passed: !isMobileViewport || hasMobileOptimizations,
          message: isMobileViewport && hasMobileOptimizations
            ? 'Mobile layout optimizations detected'
            : 'Mobile layout may need optimization'
        };
      }
    }
  ];
  
  const results = tests.map(test => ({
    name: test.name,
    ...test.test()
  }));
  
  console.table(results);
  
  const passedTests = results.filter(r => r.passed).length;
  console.log(`✅ ${passedTests}/${results.length} tests passed`);
  
  return results;
}