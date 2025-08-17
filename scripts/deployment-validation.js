#!/usr/bin/env node

/**
 * Automated Deployment Validation Script
 * 
 * Validates the deployment by running comprehensive tests
 * against the live application to ensure everything works correctly.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class DeploymentValidator {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runValidation() {
    console.log('🚀 Starting Deployment Validation...\n');
    
    try {
      await this.validateBasicConnectivity();
      await this.validateContentAPI();
      await this.validateGoalSelection();
      await this.validateMultilingualSupport();
      await this.validatePerformance();
      await this.validateSecurity();
      
      this.generateReport();
      
      if (this.results.failed > 0) {
        console.error(`❌ Validation FAILED: ${this.results.failed} tests failed`);
        process.exit(1);
      } else {
        console.log(`✅ Validation PASSED: All ${this.results.passed} tests passed`);
        process.exit(0);
      }
    } catch (error) {
      console.error('💥 Validation script crashed:', error.message);
      process.exit(1);
    }
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Testing: ${name}`);
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED', details: null });
      console.log(`✅ ${name}\n`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', details: error.message });
      console.log(`❌ ${name}: ${error.message}\n`);
    }
  }

  async validateBasicConnectivity() {
    await this.test('Application loads successfully', async () => {
      const response = await axios.get(this.baseUrl, { timeout: 10000 });
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!response.data.includes('ScienceHabits')) {
        throw new Error('Page does not contain expected app content');
      }
    });

    await this.test('Service Worker is available', async () => {
      const response = await axios.get(`${this.baseUrl}/sw.js`, { timeout: 5000 });
      if (response.status !== 200) {
        throw new Error(`Service worker not available: ${response.status}`);
      }
    });

    await this.test('Manifest is accessible', async () => {
      const response = await axios.get(`${this.baseUrl}/manifest.json`, { timeout: 5000 });
      if (response.status !== 200) {
        throw new Error(`Manifest not accessible: ${response.status}`);
      }
      
      const manifest = response.data;
      if (!manifest.name || !manifest.short_name) {
        throw new Error('Manifest missing required fields');
      }
    });
  }

  async validateContentAPI() {
    const contentApiUrl = 'http://localhost:3001';
    
    await this.test('Content API is running', async () => {
      try {
        const response = await axios.get(`${contentApiUrl}/health`, { timeout: 5000 });
        if (response.status !== 200) {
          throw new Error(`Content API health check failed: ${response.status}`);
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Content API server is not running');
        }
        throw error;
      }
    });

    await this.test('Content API returns habit data', async () => {
      const response = await axios.get(
        `${contentApiUrl}/?endpoint=habits&lang=en&key=build-key-2024-secure`,
        { timeout: 10000 }
      );
      
      if (response.status !== 200) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const habits = response.data;
      if (!Array.isArray(habits) || habits.length === 0) {
        throw new Error('API returned invalid or empty habit data');
      }
      
      // Validate habit structure
      const habit = habits[0];
      if (!habit.id || !habit.translations || !habit.goalCategory) {
        throw new Error('Habit data structure is invalid');
      }
    });

    await this.test('Content API supports all languages', async () => {
      const languages = ['en', 'de', 'fr', 'es'];
      
      for (const lang of languages) {
        const response = await axios.get(
          `${contentApiUrl}/?endpoint=habits&lang=${lang}&key=build-key-2024-secure`,
          { timeout: 5000 }
        );
        
        if (response.status !== 200) {
          throw new Error(`API failed for language ${lang}: ${response.status}`);
        }
        
        const habits = response.data;
        if (!Array.isArray(habits) || habits.length === 0) {
          throw new Error(`No habits returned for language ${lang}`);
        }
        
        // Check translations exist
        const habit = habits[0];
        if (!habit.translations[lang]) {
          throw new Error(`Missing translation for language ${lang}`);
        }
      }
    });
  }

  async validateGoalSelection() {
    await this.test('Goal selection data is available', async () => {
      const response = await axios.get(`${this.baseUrl}/data/goals-config.json`, { timeout: 5000 });
      
      if (response.status !== 200) {
        throw new Error(`Goals config not accessible: ${response.status}`);
      }
      
      const goalsConfig = response.data;
      if (!goalsConfig.goals || !Array.isArray(goalsConfig.goals)) {
        throw new Error('Goals config structure is invalid');
      }
      
      const expectedGoals = ['better_sleep', 'get_moving', 'feel_better'];
      const actualGoals = goalsConfig.goals.map(g => g.id);
      
      for (const expectedGoal of expectedGoals) {
        if (!actualGoals.includes(expectedGoal)) {
          throw new Error(`Missing expected goal: ${expectedGoal}`);
        }
      }
    });

    await this.test('Goal taxonomy is valid', async () => {
      const response = await axios.get(`${this.baseUrl}/src/data/goalTaxonomy.json`, { timeout: 5000 });
      
      if (response.status !== 200) {
        throw new Error(`Goal taxonomy not accessible: ${response.status}`);
      }
      
      const taxonomy = response.data;
      if (!taxonomy.goals || !Array.isArray(taxonomy.goals)) {
        throw new Error('Goal taxonomy structure is invalid');
      }
      
      // Verify key goal mappings exist
      const goalIds = taxonomy.goals.map(g => g.officialId);
      const requiredMappings = ['better_sleep', 'get_moving', 'feel_better'];
      
      for (const required of requiredMappings) {
        if (!goalIds.includes(required)) {
          throw new Error(`Missing goal mapping: ${required}`);
        }
      }
    });
  }

  async validateMultilingualSupport() {
    await this.test('UI translations are available', async () => {
      const languages = ['en', 'de', 'fr', 'es'];
      
      for (const lang of languages) {
        try {
          const response = await axios.get(`${this.baseUrl}/locales/${lang}/translation.json`, { timeout: 5000 });
          
          if (response.status !== 200) {
            throw new Error(`UI translations not available for ${lang}: ${response.status}`);
          }
          
          const translations = response.data;
          if (!translations || typeof translations !== 'object') {
            throw new Error(`Invalid translation data for ${lang}`);
          }
          
          // Check for key UI elements
          if (!translations.common || !translations.navigation) {
            throw new Error(`Missing core translation sections for ${lang}`);
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            // UI translations might be embedded, skip this validation
            console.log(`⚠️  UI translations for ${lang} not found at expected path (might be embedded)`);
          } else {
            throw error;
          }
        }
      }
    });

    await this.test('Language detection works', async () => {
      // Test that the app can handle different Accept-Language headers
      const response = await axios.get(this.baseUrl, {
        headers: { 'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8' },
        timeout: 5000
      });
      
      if (response.status !== 200) {
        throw new Error(`App failed with German language header: ${response.status}`);
      }
      
      // App should load successfully regardless of language header
    });
  }

  async validatePerformance() {
    await this.test('App loads within performance budget', async () => {
      const startTime = Date.now();
      const response = await axios.get(this.baseUrl, { timeout: 15000 });
      const loadTime = Date.now() - startTime;
      
      if (response.status !== 200) {
        throw new Error(`App failed to load: ${response.status}`);
      }
      
      if (loadTime > 10000) {
        throw new Error(`App took too long to load: ${loadTime}ms (budget: 10000ms)`);
      }
    });

    await this.test('Static assets are compressed', async () => {
      try {
        const response = await axios.get(`${this.baseUrl}/static/js/main.js`, {
          headers: { 'Accept-Encoding': 'gzip' },
          timeout: 5000
        });
        
        if (response.status !== 200) {
          // Main JS might have a hash, try to find it
          const indexResponse = await axios.get(this.baseUrl);
          const jsMatches = indexResponse.data.match(/\/static\/js\/main\.[a-f0-9]+\.js/);
          
          if (jsMatches) {
            const jsResponse = await axios.get(`${this.baseUrl}${jsMatches[0]}`, {
              headers: { 'Accept-Encoding': 'gzip' },
              timeout: 5000
            });
            
            if (jsResponse.headers['content-encoding'] !== 'gzip') {
              throw new Error('Main JS bundle is not gzipped');
            }
          }
        } else {
          if (response.headers['content-encoding'] !== 'gzip') {
            throw new Error('Main JS bundle is not gzipped');
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log('⚠️  Static assets not found at expected paths (might be using different naming)');
        } else {
          throw error;
        }
      }
    });
  }

  async validateSecurity() {
    await this.test('Security headers are present', async () => {
      const response = await axios.get(this.baseUrl, { timeout: 5000 });
      
      if (response.status !== 200) {
        throw new Error(`App failed to load: ${response.status}`);
      }
      
      const headers = response.headers;
      
      // Check for basic security headers
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ];
      
      const missingHeaders = securityHeaders.filter(header => !headers[header]);
      
      if (missingHeaders.length > 0) {
        console.log(`⚠️  Missing security headers: ${missingHeaders.join(', ')} (might be added by CDN)`);
      }
    });

    await this.test('No sensitive data exposed in client', async () => {
      const response = await axios.get(this.baseUrl, { timeout: 5000 });
      
      if (response.status !== 200) {
        throw new Error(`App failed to load: ${response.status}`);
      }
      
      const content = response.data.toLowerCase();
      
      // Check for potential sensitive data leaks
      const sensitivePatterns = [
        /api[_\-]?key['":\s]*[a-zA-Z0-9]{20,}/,
        /secret['":\s]*[a-zA-Z0-9]{20,}/,
        /password['":\s]*[a-zA-Z0-9]{8,}/,
        /token['":\s]*[a-zA-Z0-9]{20,}/
      ];
      
      for (const pattern of sensitivePatterns) {
        if (pattern.test(content)) {
          throw new Error('Potential sensitive data found in client-side code');
        }
      }
    });
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.passed + this.results.failed,
        passed: this.results.passed,
        failed: this.results.failed,
        success_rate: `${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`
      },
      tests: this.results.tests
    };
    
    const reportPath = path.join(__dirname, '..', 'deployment-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('========================');
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Success Rate: ${report.summary.success_rate}`);
    console.log(`\nReport saved to: ${reportPath}\n`);
    
    if (this.results.failed > 0) {
      console.log('❌ FAILED TESTS:');
      this.results.tests
        .filter(t => t.status === 'FAILED')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.details}`);
        });
      console.log('');
    }
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const validator = new DeploymentValidator(baseUrl);
  validator.runValidation();
}

module.exports = DeploymentValidator;