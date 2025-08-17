#!/usr/bin/env node

/**
 * Pre-commit Validation Hook
 * 
 * Lightweight validation that runs before git commits
 * Focuses on quick checks that prevent broken commits
 */

const { spawn } = require('child_process');
const fs = require('fs');

class PreCommitValidator {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  log(message, type = 'info') {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    console.log(`${emoji[type]} ${message}`);
  }

  async runCommand(command, description) {
    return new Promise((resolve, reject) => {
      this.log(`${description}...`);
      
      const [cmd, ...args] = command.split(' ');
      const process = spawn(cmd, args, {
        stdio: 'pipe',
        shell: true
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => stdout += data.toString());
      process.stderr.on('data', (data) => stderr += data.toString());

      process.on('close', (code) => {
        if (code === 0) {
          this.passed++;
          this.log(`${description}: PASSED`, 'success');
          resolve({ code, stdout, stderr });
        } else {
          this.failed++;
          this.log(`${description}: FAILED`, 'error');
          if (stderr) {
            console.log(`Error: ${stderr.split('\n').slice(0, 3).join('\n')}`);
          }
          reject(new Error(`Command failed with code ${code}`));
        }
      });
    });
  }

  async validateSyntax() {
    // Quick TypeScript syntax check (no emit)
    try {
      await this.runCommand('npx tsc --noEmit --skipLibCheck', 'TypeScript syntax check');
      return true;
    } catch (error) {
      return false;
    }
  }

  async validateContent() {
    // Quick content validation
    try {
      await this.runCommand('npm run validate-content', 'Content validation');
      return true;
    } catch (error) {
      return false;
    }
  }

  async validateBackupSystem() {
    // Quick backup system test
    try {
      await this.runCommand('node scripts/test-backup-restore.js', 'Backup system test');
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkCriticalFiles() {
    const criticalFiles = [
      'src/App.tsx',
      'src/components/dashboard/DashboardLayout.tsx',
      'src/services/settingsBackupService.ts',
      'package.json'
    ];

    let allExist = true;
    
    for (const file of criticalFiles) {
      if (fs.existsSync(file)) {
        this.log(`Critical file ${file}: EXISTS`, 'success');
        this.passed++;
      } else {
        this.log(`Critical file ${file}: MISSING`, 'error');
        this.failed++;
        allExist = false;
      }
    }

    return allExist;
  }

  async run() {
    this.log('🔍 Pre-commit Validation Starting...', 'info');
    this.log('=====================================', 'info');

    let success = true;

    // Step 1: Check critical files
    this.log('\n📁 Checking critical files...');
    if (!await this.checkCriticalFiles()) {
      success = false;
    }

    // Step 2: Quick syntax validation
    this.log('\n🔧 TypeScript syntax validation...');
    if (!await this.validateSyntax()) {
      success = false;
    }

    // Step 3: Content validation
    this.log('\n📊 Content validation...');
    if (!await this.validateContent()) {
      success = false;
    }

    // Step 4: Backup system validation
    this.log('\n💾 Backup system validation...');
    if (!await this.validateBackupSystem()) {
      success = false;
    }

    // Results
    this.log('\n🎯 Pre-commit Results:', 'info');
    this.log(`✅ Passed: ${this.passed}`, 'success');
    this.log(`❌ Failed: ${this.failed}`, 'error');

    if (success && this.failed === 0) {
      this.log('\n🎉 Pre-commit validation passed!', 'success');
      this.log('✨ Ready to commit', 'success');
      return true;
    } else {
      this.log('\n💥 Pre-commit validation failed!', 'error');
      this.log('🔧 Please fix the issues above before committing', 'error');
      return false;
    }
  }
}

// Main execution
async function main() {
  const validator = new PreCommitValidator();
  
  try {
    const success = await validator.run();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Pre-commit validation crashed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { PreCommitValidator };