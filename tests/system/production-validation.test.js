/**
 * System Test: Production Deployment Validation
 * 
 * Validates that the production deployment on Vercel works correctly:
 * 1. Application loads without errors
 * 2. Critical functionality works
 * 3. No regression in habit loading
 * 4. Performance is acceptable
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ProductionValidationTest {
  constructor(baseUrl = 'https://sciencehabits.vercel.app') {
    this.baseUrl = baseUrl;
    this.browser = null;
    this.page = null;
    this.testResults = {
      startTime: new Date().toISOString(),
      baseUrl: baseUrl,
      tests: [],
      performance: {},
      summary: { passed: 0, failed: 0, total: 0 }
    };
  }

  async setup() {
    console.log(`🌐 Starting Production Validation Test for: ${this.baseUrl}`);
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
    
    // Enable performance monitoring
    await this.page.setCacheEnabled(false);
    
    // Set up error monitoring
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Production Error:', msg.text());
      }
    });
    
    this.page.on('pageerror', error => {
      console.log('❌ Production Page Error:', error.message);
    });
    
    // Monitor network failures
    this.page.on('requestfailed', request => {
      console.log('❌ Network Request Failed:', request.url());
    });
  }

  async runTest(testName, testFunction) {
    const startTime = Date.now();
    console.log(`\n🧪 Testing: ${testName}`);
    
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      console.log(`✅ PASSED: ${testName} (${duration}ms)`);
      
      this.testResults.tests.push({
        name: testName,
        status: 'passed',
        duration,
        timestamp: new Date().toISOString()
      });
      this.testResults.summary.passed++;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ FAILED: ${testName} (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
      
      this.testResults.tests.push({
        name: testName,
        status: 'failed',
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      this.testResults.summary.failed++;
    }
    
    this.testResults.summary.total++;
  }

  async testProductionAccessibility() {
    // Test if production site is accessible
    const response = await this.page.goto(this.baseUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    if (!response.ok()) {
      throw new Error(`Production site returned ${response.status()}: ${response.statusText()}`);
    }
    
    // Check if page loaded properly
    const title = await this.page.title();
    if (!title || title.includes('Error') || title.includes('404')) {
      throw new Error(`Page title indicates error: ${title}`);
    }
    
    console.log(`   ✓ Production site accessible, title: ${title}`);
  }

  async testNoJavaScriptErrors() {
    // Monitor for JavaScript errors
    const jsErrors = [];
    
    this.page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    // Navigate and wait for JavaScript to execute
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (jsErrors.length > 0) {
      throw new Error(`JavaScript errors detected: ${jsErrors.join(', ')}`);
    }
    
    // Check for React rendering
    const hasReactContent = await this.page.evaluate(() => {
      return document.querySelector('[data-reactroot], #root') !== null;
    });
    
    if (!hasReactContent) {
      throw new Error('React application did not render properly');
    }
    
    console.log('   ✓ No JavaScript errors, React rendered successfully');
  }

  async testCriticalOnboardingPath() {
    // Test the critical path that was failing before
    console.log('   ⏳ Testing critical onboarding path...');
    
    // Clear data to start fresh
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await this.page.reload({ waitUntil: 'networkidle0' });
    
    // Should start onboarding or show "Select a goal"
    const hasOnboardingOrGoalButton = await this.page.waitForSelector(
      '[data-testid="onboarding"], .onboarding',
      { timeout: 10000 }
    ).catch(() => null);
    
    if (!hasOnboardingOrGoalButton) {
      throw new Error('No onboarding or goal selection found');
    }
    
    // Try to trigger goal selection - look for text content instead of CSS selectors
    const goalButton = await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => 
        btn.textContent.includes('Select a goal') || 
        btn.textContent.includes('Add habits') ||
        btn.textContent.includes('goal')
      ) !== null;
    });
    
    if (goalButton) {
      await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const targetButton = buttons.find(btn => 
          btn.textContent.includes('Select a goal') || 
          btn.textContent.includes('Add habits') ||
          btn.textContent.includes('goal')
        );
        if (targetButton) targetButton.click();
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Navigate to habit recommendations if needed
    let currentUrl = this.page.url();
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        // Look for goal selection
        const goalSelectors = await this.page.$('[data-testid*="goal"], .goal-button, button');
        if (goalSelectors) {
          await goalSelectors.click();
          await this.page.waitForTimeout(1000);
          
          // Try to continue to recommendations
          const continueButton = await this.page.$('button:contains("Continue"), button:contains("Next")');
          if (continueButton) {
            await continueButton.click();
            await this.page.waitForTimeout(2000);
          }
        }
        
        // Check if we reached habit recommendations
        const isInRecommendations = await this.page.$('text=/Finding perfect habits/, text=/habit/i, [data-testid*="habit"]');
        if (isInRecommendations) {
          break;
        }
        
        attempts++;
      } catch (e) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Could not navigate to habit recommendations step');
        }
      }
    }
    
    console.log('   ✓ Successfully navigated to onboarding flow');
  }

  async testHabitLoadingInProduction() {
    // The critical test - ensure habit loading works in production
    console.log('   ⏳ Testing habit loading in production (this was the main bug)...');
    
    const startTime = Date.now();
    const maxWaitTime = 45000; // 45 second timeout
    
    try {
      // Wait for loading state
      try {
        await this.page.waitForSelector(
          'text=/Finding perfect habits/, text=/Loading/, .loading',
          { timeout: 5000 }
        );
        console.log('   ✓ Loading state detected');
      } catch (e) {
        // Loading might be very brief
      }
      
      // Wait for actual habits to load
      await this.page.waitForSelector(
        '[data-testid*="habit"], .habit-card, .recommendation',
        { timeout: maxWaitTime }
      );
      
      const loadTime = Date.now() - startTime;
      console.log(`   ✅ Habits loaded successfully in production (${loadTime}ms)`);
      
      // Verify we have actual content
      const habitCount = await this.page.$$eval(
        '[data-testid*="habit"], .habit-card, .recommendation',
        elements => elements.length
      );
      
      if (habitCount === 0) {
        throw new Error('No habit content found after loading completed');
      }
      
      console.log(`   ✓ Found ${habitCount} habit recommendations in production`);
      
      this.testResults.performance.habitLoadTime = loadTime;
      
    } catch (error) {
      const waitTime = Date.now() - startTime;
      if (waitTime >= maxWaitTime - 1000) {
        throw new Error(`Production habit loading timed out after ${waitTime}ms - CRITICAL BUG DETECTED`);
      }
      throw error;
    }
  }

  async testPerformanceMetrics() {
    // Test performance metrics
    console.log('   ⏳ Measuring performance metrics...');
    
    const navigationStart = await this.page.evaluate(() => performance.timing.navigationStart);
    
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
    
    const metrics = await this.page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
      };
    });
    
    this.testResults.performance = { ...this.testResults.performance, ...metrics };
    
    // Performance thresholds
    if (metrics.domContentLoaded > 5000) {
      throw new Error(`DOM Content Loaded too slow: ${metrics.domContentLoaded}ms`);
    }
    
    if (metrics.loadComplete > 10000) {
      console.log(`⚠ Warning: Load time is slow: ${metrics.loadComplete}ms`);
    }
    
    console.log(`   ✓ Performance acceptable (DOM: ${metrics.domContentLoaded}ms, Load: ${metrics.loadComplete}ms)`);
  }

  async testCriticalUserJourneys() {
    // Test critical user journeys work end-to-end
    console.log('   ⏳ Testing critical user journeys...');
    
    // Journey 1: New user onboarding
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await this.page.reload({ waitUntil: 'networkidle0' });
    
    // Should be able to start onboarding
    const canStartOnboarding = await this.page.$('[data-testid="onboarding"], .onboarding, button:contains("Select"), button:contains("goal")');
    if (!canStartOnboarding) {
      throw new Error('Cannot start new user onboarding journey');
    }
    
    // Journey 2: Returning user with data
    await this.page.evaluate(() => {
      localStorage.setItem('sciencehabits_user_id', 'test-user');
      localStorage.setItem('sciencehabits_onboarded', 'true');
    });
    await this.page.reload({ waitUntil: 'networkidle0' });
    
    // Should show main app or today view
    const hasMainApp = await this.page.waitForSelector(
      'text=/Today/, text=/Dashboard/, text=/Welcome/, [data-testid*="dashboard"], button:contains("Select a goal")',
      { timeout: 10000 }
    );
    
    if (!hasMainApp) {
      throw new Error('Main app does not load for returning users');
    }
    
    console.log('   ✓ Critical user journeys work correctly');
  }

  async generateReport() {
    this.testResults.endTime = new Date().toISOString();
    this.testResults.duration = new Date(this.testResults.endTime) - new Date(this.testResults.startTime);
    
    const reportPath = path.join(__dirname, '../../test-reports/production-validation-report.json');
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    
    console.log(`\n📊 Production Validation Results:`);
    console.log(`   🌐 URL: ${this.baseUrl}`);
    console.log(`   ✅ Passed: ${this.testResults.summary.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.summary.failed}`);
    console.log(`   ⚡ Performance:`);
    console.log(`      DOM Ready: ${this.testResults.performance.domContentLoaded || 'N/A'}ms`);
    console.log(`      Habit Load: ${this.testResults.performance.habitLoadTime || 'N/A'}ms`);
    console.log(`   📁 Report: ${reportPath}`);
    
    return this.testResults;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    try {
      await this.setup();
      
      await this.runTest('Production Site Accessible', () => this.testProductionAccessibility());
      await this.runTest('No JavaScript Errors', () => this.testNoJavaScriptErrors());
      await this.runTest('Critical Onboarding Path', () => this.testCriticalOnboardingPath());
      await this.runTest('Habit Loading in Production (Critical)', () => this.testHabitLoadingInProduction());
      await this.runTest('Performance Metrics', () => this.testPerformanceMetrics());
      await this.runTest('Critical User Journeys', () => this.testCriticalUserJourneys());
      
      const results = await this.generateReport();
      
      const exitCode = results.summary.failed === 0 ? 0 : 1;
      
      if (exitCode === 0) {
        console.log('\n🎉 Production validation passed - deployment is healthy!');
      } else {
        console.log('\n💥 Production validation failed - deployment has issues!');
      }
      
      return exitCode;
      
    } catch (error) {
      console.error('💥 Production validation failed:', error);
      return 1;
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const testUrl = process.argv[2] || 'https://sciencehabits.vercel.app';
  const test = new ProductionValidationTest(testUrl);
  test.runAllTests().then(exitCode => {
    process.exit(exitCode);
  });
}

module.exports = ProductionValidationTest;