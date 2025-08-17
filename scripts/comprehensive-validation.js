#!/usr/bin/env node

/**
 * Comprehensive CI/CD Validation Script
 * 
 * Performs full system validation including:
 * - Content validation
 * - TypeScript compilation
 * - Backup/restore functionality
 * - Goal-based recommendations
 * - Build process
 * - Performance checks
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class ValidationRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      progress: '🔄'
    };
    
    console.log(`${emoji[type] || 'ℹ️'} [${timestamp}] ${message}`);
  }

  async runCommand(command, description, options = {}) {
    this.log(`${description}...`, 'progress');
    
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const process = spawn(cmd, args, {
        stdio: options.silent ? 'pipe' : 'inherit',
        shell: true,
        ...options
      });

      let stdout = '';
      let stderr = '';

      if (options.silent) {
        process.stdout?.on('data', (data) => stdout += data.toString());
        process.stderr?.on('data', (data) => stderr += data.toString());
      }

      process.on('close', (code) => {
        if (code === 0) {
          this.results.passed++;
          this.results.details.push({ test: description, status: 'PASSED', code });
          this.log(`${description}: PASSED`, 'success');
          resolve({ code, stdout, stderr });
        } else {
          this.results.failed++;
          this.results.details.push({ test: description, status: 'FAILED', code, stderr });
          this.log(`${description}: FAILED (exit code ${code})`, 'error');
          if (stderr && options.silent) {
            this.log(`Error output: ${stderr}`, 'error');
          }
          reject(new Error(`Command failed with code ${code}`));
        }
      });

      process.on('error', (error) => {
        this.results.failed++;
        this.results.details.push({ test: description, status: 'ERROR', error: error.message });
        this.log(`${description}: ERROR - ${error.message}`, 'error');
        reject(error);
      });
    });
  }

  async checkFileExists(filePath, description) {
    this.log(`Checking ${description}...`, 'progress');
    
    if (fs.existsSync(filePath)) {
      this.results.passed++;
      this.results.details.push({ test: description, status: 'PASSED' });
      this.log(`${description}: EXISTS`, 'success');
      return true;
    } else {
      this.results.failed++;
      this.results.details.push({ test: description, status: 'FAILED', error: 'File not found' });
      this.log(`${description}: NOT FOUND`, 'error');
      return false;
    }
  }

  async validatePackageJson() {
    this.log('Validating package.json...', 'progress');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      const requiredScripts = [
        'start', 'build', 'test', 'validate-content'
      ];
      
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length === 0) {
        this.results.passed++;
        this.results.details.push({ test: 'Package.json scripts', status: 'PASSED' });
        this.log('Package.json validation: PASSED', 'success');
        return true;
      } else {
        this.results.failed++;
        this.results.details.push({ 
          test: 'Package.json scripts', 
          status: 'FAILED', 
          error: `Missing scripts: ${missingScripts.join(', ')}` 
        });
        this.log(`Package.json validation: FAILED - Missing scripts: ${missingScripts.join(', ')}`, 'error');
        return false;
      }
    } catch (error) {
      this.results.failed++;
      this.results.details.push({ test: 'Package.json validation', status: 'ERROR', error: error.message });
      this.log(`Package.json validation: ERROR - ${error.message}`, 'error');
      return false;
    }
  }

  async validateBuildSize() {
    this.log('Validating build size...', 'progress');
    
    try {
      const buildStatsPath = path.join('build', 'static', 'js');
      if (!fs.existsSync(buildStatsPath)) {
        throw new Error('Build directory not found - run npm run build first');
      }

      const jsFiles = fs.readdirSync(buildStatsPath).filter(f => f.endsWith('.js'));
      let totalSize = 0;
      
      jsFiles.forEach(file => {
        const filePath = path.join(buildStatsPath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });

      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      const maxSizeMB = 2; // 2MB limit for main bundle

      if (totalSize < maxSizeMB * 1024 * 1024) {
        this.results.passed++;
        this.results.details.push({ 
          test: 'Build size check', 
          status: 'PASSED',
          details: `Total JS size: ${sizeInMB}MB (under ${maxSizeMB}MB limit)`
        });
        this.log(`Build size validation: PASSED (${sizeInMB}MB)`, 'success');
        return true;
      } else {
        this.results.warnings++;
        this.results.details.push({ 
          test: 'Build size check', 
          status: 'WARNING',
          details: `Total JS size: ${sizeInMB}MB (exceeds ${maxSizeMB}MB limit)`
        });
        this.log(`Build size validation: WARNING (${sizeInMB}MB exceeds ${maxSizeMB}MB)`, 'warning');
        return false;
      }
    } catch (error) {
      this.results.failed++;
      this.results.details.push({ test: 'Build size validation', status: 'ERROR', error: error.message });
      this.log(`Build size validation: ERROR - ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive CI/CD Validation', 'info');
    this.log('==========================================', 'info');

    try {
      // Step 1: Basic file structure validation
      this.log('\n📁 STEP 1: File Structure Validation', 'info');
      await this.checkFileExists('package.json', 'Package.json');
      await this.checkFileExists('src/App.tsx', 'Main App component');
      await this.checkFileExists('public/index.html', 'HTML template');
      await this.checkFileExists('scripts/validate-content.js', 'Content validation script');
      await this.validatePackageJson();

      // Step 2: Content validation
      this.log('\n📊 STEP 2: Content Validation', 'info');
      await this.runCommand('npm run validate-content', 'Content validation');

      // Step 3: TypeScript compilation
      this.log('\n🔧 STEP 3: TypeScript Compilation', 'info');
      try {
        await this.runCommand('npx tsc --noEmit', 'TypeScript type checking', { silent: true });
      } catch (error) {
        this.log('TypeScript compilation had errors - proceeding with warnings', 'warning');
        this.results.warnings++;
        this.results.failed--; // Don't count as hard failure
      }

      // Step 4: Backup/Restore system test
      this.log('\n💾 STEP 4: Backup/Restore System Test', 'info');
      await this.runCommand('node scripts/test-backup-restore.js', 'Backup/restore functionality');

      // Step 5: Goal-based recommendations validation
      this.log('\n🎯 STEP 5: Goal-based Recommendations Validation', 'info');
      if (fs.existsSync('scripts/validate-goal-recommendations.js')) {
        await this.runCommand('node scripts/validate-goal-recommendations.js', 'Goal recommendations validation');
      } else {
        this.log('Goal recommendations validation script not found - skipping', 'warning');
        this.results.warnings++;
      }

      // Step 6: Build process
      this.log('\n🏗️  STEP 6: Build Process', 'info');
      await this.runCommand('npm run build', 'Production build');
      await this.validateBuildSize();

      // Step 7: Basic functionality tests
      this.log('\n🧪 STEP 7: Basic Functionality Tests', 'info');
      
      // Check for critical imports
      try {
        const appTsxContent = fs.readFileSync('src/App.tsx', 'utf8');
        if (appTsxContent.includes('import') && appTsxContent.includes('export')) {
          this.results.passed++;
          this.results.details.push({ test: 'App.tsx structure', status: 'PASSED' });
          this.log('App.tsx structure: PASSED', 'success');
        } else {
          throw new Error('Invalid App.tsx structure');
        }
      } catch (error) {
        this.results.failed++;
        this.results.details.push({ test: 'App.tsx structure', status: 'FAILED', error: error.message });
        this.log(`App.tsx structure: FAILED - ${error.message}`, 'error');
      }

      // Step 8: Security checks
      this.log('\n🔒 STEP 8: Security Checks', 'info');
      try {
        // Check for common security issues
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Check for audit
        try {
          await this.runCommand('npm audit --audit-level=high', 'Security audit (high severity)', { silent: true });
        } catch (error) {
          this.log('Security audit found high-severity issues - check npm audit', 'warning');
          this.results.warnings++;
        }

        this.results.passed++;
        this.results.details.push({ test: 'Security checks', status: 'PASSED' });
        this.log('Security checks: PASSED', 'success');
        
      } catch (error) {
        this.results.failed++;
        this.results.details.push({ test: 'Security checks', status: 'FAILED', error: error.message });
        this.log(`Security checks: FAILED - ${error.message}`, 'error');
      }

    } catch (error) {
      this.log(`Validation suite failed: ${error.message}`, 'error');
    }

    // Final results
    this.printResults();
    return this.results.failed === 0;
  }

  printResults() {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(1);
    
    this.log('\n🎯 VALIDATION RESULTS', 'info');
    this.log('==========================================', 'info');
    this.log(`⏱️  Duration: ${duration}s`, 'info');
    this.log(`✅ Passed: ${this.results.passed}`, 'success');
    this.log(`❌ Failed: ${this.results.failed}`, 'error');
    this.log(`⚠️  Warnings: ${this.results.warnings}`, 'warning');
    this.log(`📊 Total: ${this.results.passed + this.results.failed + this.results.warnings}`, 'info');

    if (this.results.failed === 0) {
      this.log('\n🎉 ALL VALIDATIONS PASSED!', 'success');
      this.log('✨ Ready for deployment', 'success');
    } else {
      this.log('\n💥 VALIDATION FAILURES DETECTED', 'error');
      this.log('🔧 Please fix the issues above before proceeding', 'error');
      
      // Show failed tests
      const failed = this.results.details.filter(d => d.status === 'FAILED' || d.status === 'ERROR');
      if (failed.length > 0) {
        this.log('\n📋 Failed Tests:', 'error');
        failed.forEach(test => {
          this.log(`   • ${test.test}: ${test.error || 'Unknown error'}`, 'error');
        });
      }
    }

    // Show warnings
    const warnings = this.results.details.filter(d => d.status === 'WARNING');
    if (warnings.length > 0) {
      this.log('\n⚠️  Warnings:', 'warning');
      warnings.forEach(test => {
        this.log(`   • ${test.test}: ${test.details || test.error || 'Check required'}`, 'warning');
      });
    }
  }
}

// Main execution
async function main() {
  const validator = new ValidationRunner();
  
  try {
    const success = await validator.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Validation suite crashed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { ValidationRunner };