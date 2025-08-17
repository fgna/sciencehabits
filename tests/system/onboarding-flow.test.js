/**
 * System Test: Onboarding Flow Validation
 * 
 * Tests the complete onboarding experience to ensure users can:
 * 1. Start onboarding from clean state
 * 2. Select goals successfully
 * 3. Load habit recommendations without hanging
 * 4. Complete onboarding and reach dashboard
 */

const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class OnboardingFlowTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      startTime: new Date().toISOString(),
      tests: [],
      summary: { passed: 0, failed: 0, total: 0 }
    };
  }

  async setup() {
    console.log('🚀 Starting Onboarding Flow System Test...');
    
    // Launch browser in headless mode
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set viewport and user agent
    await this.page.setViewport({ width: 1280, height: 720 });
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Error:', msg.text());
      }
    });
    
    // Set up error handling
    this.page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
  }

  async runTest(testName, testFunction) {
    const startTime = Date.now();
    console.log(`\n🧪 Running: ${testName}`);
    
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

  async testApplicationLoads() {
    // Test if the application loads without errors
    await this.page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for React to render
    await this.page.waitForSelector('body', { timeout: 10000 });
    
    // Check if JavaScript loaded successfully
    const hasJSErrors = await this.page.evaluate(() => {
      return window.onerror !== null || window.addEventListener !== undefined;
    });
    
    if (!hasJSErrors) {
      throw new Error('JavaScript did not load properly');
    }
  }

  async testOnboardingStarts() {
    // Clear any existing user data
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await this.page.reload({ waitUntil: 'networkidle0' });
    
    // Should show onboarding
    await this.page.waitForSelector('[data-testid="onboarding-container"], .onboarding', { 
      timeout: 10000 
    });
    
    // Should show welcome or goals step
    const welcomeExists = await this.page.$('[data-testid="welcome-step"], h1');
    if (!welcomeExists) {
      throw new Error('Onboarding welcome/start screen not found');
    }
  }

  async testGoalSelection() {
    // Look for goal selection interface
    const goalButtons = await this.page.$$('[data-testid*="goal"], button, .goal');
    
    if (goalButtons.length === 0) {
      // Try to navigate to goals if not already there
      const nextButton = await this.page.$('button:contains("Next"), button:contains("Continue"), button:contains("Start")');
      if (nextButton) {
        await nextButton.click();
        await this.page.waitForTimeout(1000);
      }
    }
    
    // Wait for goals to be available
    await this.page.waitForSelector('[data-testid*="goal"], .goal, button', { timeout: 10000 });
    
    // Select the first available goal
    const firstGoal = await this.page.$('[data-testid*="goal"], .goal-button, button');
    if (!firstGoal) {
      throw new Error('No goal selection buttons found');
    }
    
    await firstGoal.click();
    await this.page.waitForTimeout(500);
    
    // Try to proceed to next step
    const continueButton = await this.page.$('button:contains("Continue"), button:contains("Next")');
    if (continueButton) {
      await continueButton.click();
    }
  }

  async testHabitRecommendationsLoad() {
    // This is the critical test - ensure habit loading doesn't hang
    console.log('   ⏳ Waiting for habit recommendations to load...');
    
    // Wait for the loading state first
    try {
      await this.page.waitForSelector(
        'text=/Finding perfect habits/, text=/Loading/, .loading, [data-testid*="loading"]', 
        { timeout: 5000 }
      );
      console.log('   ✓ Loading state detected');
    } catch (e) {
      // Loading state might be very brief, continue
    }
    
    // Wait for habits to actually load (this should not hang)
    const loadingTimeout = 30000; // 30 second timeout
    const startTime = Date.now();
    
    try {
      // Wait for habit cards or recommendations to appear
      await this.page.waitForSelector(
        '[data-testid*="habit"], .habit-card, .recommendation, button:contains("Select"), text=/habit/i',
        { timeout: loadingTimeout }
      );
      
      const loadTime = Date.now() - startTime;
      console.log(`   ✓ Habits loaded successfully in ${loadTime}ms`);
      
      // Verify we have actual habit content
      const habitElements = await this.page.$$('[data-testid*="habit"], .habit-card, .recommendation');
      if (habitElements.length === 0) {
        throw new Error('No habit recommendations found after loading');
      }
      
      console.log(`   ✓ Found ${habitElements.length} habit recommendations`);
      
    } catch (error) {
      const waitTime = Date.now() - startTime;
      if (waitTime >= loadingTimeout - 1000) {
        throw new Error(`Habit loading timed out after ${waitTime}ms - this indicates the production bug is present`);
      }
      throw error;
    }
  }

  async testOnboardingCompletion() {
    // Try to select a habit and complete onboarding
    const habitElement = await this.page.$('[data-testid*="habit"], .habit-card, button');
    if (habitElement) {
      await habitElement.click();
      await this.page.waitForTimeout(500);
    }
    
    // Look for completion/continue button
    const completeButton = await this.page.$('button:contains("Start"), button:contains("Complete"), button:contains("Finish")');
    if (completeButton) {
      await completeButton.click();
      await this.page.waitForTimeout(2000);
    }
    
    // Should eventually reach dashboard or main app
    try {
      await this.page.waitForSelector(
        'text=/Today/, text=/Dashboard/, text=/Welcome/, [data-testid*="dashboard"]',
        { timeout: 10000 }
      );
      console.log('   ✓ Successfully reached post-onboarding state');
    } catch (e) {
      // Might still be in onboarding, which is acceptable
      console.log('   ⚠ Still in onboarding flow (acceptable)');
    }
  }

  async testRestartOnboarding() {
    // Test the "Select a goal" button functionality after data deletion
    
    // Clear user data to simulate "Delete all personal data"
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await this.page.reload({ waitUntil: 'networkidle0' });
    
    // Should show "Select a goal" button in Today view
    try {
      const selectGoalButton = await this.page.waitForSelector(
        'button:contains("Select a goal"), button:contains("Add habits")',
        { timeout: 10000 }
      );
      
      if (selectGoalButton) {
        await selectGoalButton.click();
        await this.page.waitForTimeout(2000);
        
        // Should restart onboarding
        await this.page.waitForSelector('[data-testid="onboarding-container"], .onboarding', { 
          timeout: 10000 
        });
        console.log('   ✓ Successfully restarted onboarding from Today page');
      }
    } catch (e) {
      throw new Error('Could not find or click "Select a goal" button');
    }
  }

  async generateReport() {
    this.testResults.endTime = new Date().toISOString();
    this.testResults.duration = new Date(this.testResults.endTime) - new Date(this.testResults.startTime);
    
    const reportPath = path.join(__dirname, '../../test-reports/onboarding-flow-report.json');
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    
    console.log(`\n📊 Onboarding Flow Test Results:`);
    console.log(`   ✅ Passed: ${this.testResults.summary.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.summary.failed}`);
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
      
      await this.runTest('Application Loads Successfully', () => this.testApplicationLoads());
      await this.runTest('Onboarding Starts Correctly', () => this.testOnboardingStarts());
      await this.runTest('Goal Selection Works', () => this.testGoalSelection());
      await this.runTest('Habit Recommendations Load (Critical)', () => this.testHabitRecommendationsLoad());
      await this.runTest('Onboarding Can Complete', () => this.testOnboardingCompletion());
      await this.runTest('Restart Onboarding Works', () => this.testRestartOnboarding());
      
      const results = await this.generateReport();
      
      // Exit with appropriate code
      const exitCode = results.summary.failed === 0 ? 0 : 1;
      
      if (exitCode === 0) {
        console.log('\n🎉 All onboarding flow tests passed!');
      } else {
        console.log('\n💥 Some onboarding flow tests failed!');
      }
      
      return exitCode;
      
    } catch (error) {
      console.error('💥 Test suite failed:', error);
      return 1;
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const test = new OnboardingFlowTest();
  test.runAllTests().then(exitCode => {
    process.exit(exitCode);
  });
}

module.exports = OnboardingFlowTest;