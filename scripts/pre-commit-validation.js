#!/usr/bin/env node

/**
 * Pre-commit validation hook
 * 
 * Runs comprehensive validation before allowing commits:
 * - TypeScript compilation
 * - Goal-based recommendations validation
 * - System tests (optional)
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Running pre-commit validation...\n');

let exitCode = 0;

try {
  // Run the comprehensive validation pipeline
  console.log('📋 Running CI/CD validation pipeline...');
  execSync('node scripts/validate-goal-recommendations.js', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('\n✅ Pre-commit validation passed!');
  console.log('   Ready to commit changes.');
  
} catch (error) {
  console.error('\n❌ Pre-commit validation failed!');
  console.error('   Please fix the issues above before committing.');
  console.error('   Commit has been blocked to prevent broken code.');
  exitCode = 1;
}

process.exit(exitCode);