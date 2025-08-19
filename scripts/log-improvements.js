#!/usr/bin/env node

/**
 * Automatic Improvement Logging Script
 * 
 * This script analyzes git commits and automatically logs significant improvements
 * to the IMPROVEMENTS.md file. It's triggered by the post-commit git hook.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const IMPROVEMENTS_FILE = path.join(PROJECT_ROOT, 'IMPROVEMENTS.md');

/**
 * Get the latest commit information
 */
function getLatestCommit() {
  try {
    const commitHash = execSync('git rev-parse HEAD', { cwd: PROJECT_ROOT }).toString().trim();
    const commitMessage = execSync('git log -1 --pretty=%B', { cwd: PROJECT_ROOT }).toString().trim();
    const commitDate = execSync('git log -1 --pretty=%cd --date=format:"%B %d, %Y at %H:%M UTC"', { cwd: PROJECT_ROOT }).toString().trim();
    const commitAuthor = execSync('git log -1 --pretty=%an', { cwd: PROJECT_ROOT }).toString().trim();
    const filesChanged = execSync('git diff-tree --no-commit-id --name-only -r HEAD', { cwd: PROJECT_ROOT }).toString().trim().split('\n').filter(f => f);
    
    return {
      hash: commitHash.substring(0, 8),
      message: commitMessage,
      date: commitDate,
      author: commitAuthor,
      files: filesChanged
    };
  } catch (error) {
    console.error('Error getting commit information:', error.message);
    return null;
  }
}

/**
 * Analyze commit to determine if it's significant enough to log
 */
function isSignificantCommit(commit) {
  if (!commit || !commit.files.length) return false;

  // Skip if only documentation files changed
  const nonDocFiles = commit.files.filter(file => 
    !file.match(/\.(md|txt)$/i) && 
    !file.includes('README') && 
    !file.includes('CLAUDE.md') &&
    !file.includes('IMPROVEMENTS.md')
  );

  if (nonDocFiles.length === 0) return false;

  // Check for significant patterns
  const significantPatterns = [
    /^(feat|fix|perf|refactor):/i,  // Conventional commit types
    /src\/components\//,             // Component changes
    /src\/services\//,               // Service changes
    /src\/stores\//,                 // Store changes
    /package\.json$/,                // Dependency changes
    /\.tsx?$/,                       // TypeScript files
    /scripts\//,                     // Build script changes
    /\.githooks\//                   // Git hook changes
  ];

  // Check commit message patterns
  if (significantPatterns.some(pattern => pattern.test(commit.message))) {
    return true;
  }

  // Check file patterns
  if (commit.files.some(file => significantPatterns.some(pattern => pattern.test(file)))) {
    return true;
  }

  // Check for volume of changes (5+ files or key directories)
  if (commit.files.length >= 5) return true;

  return false;
}

/**
 * Categorize the type of change
 */
function categorizeChange(commit) {
  const message = commit.message.toLowerCase();
  const files = commit.files.join(' ').toLowerCase();

  if (message.includes('feat:') || message.includes('feature')) return 'Feature Enhancement';
  if (message.includes('fix:') || message.includes('bug')) return 'Bug Fix';
  if (message.includes('perf:') || message.includes('performance')) return 'Performance Optimization';
  if (message.includes('refactor:') || message.includes('refactor')) return 'Code Refactoring';
  if (message.includes('test:') || message.includes('testing')) return 'Testing Improvements';
  if (message.includes('docs:') || message.includes('documentation')) return 'Documentation Update';
  if (message.includes('mobile') || message.includes('responsive')) return 'Mobile Enhancement';
  if (files.includes('component')) return 'Component Update';
  if (files.includes('service')) return 'Service Enhancement';
  if (files.includes('store')) return 'State Management';
  if (files.includes('hook') || files.includes('script')) return 'Infrastructure Enhancement';
  
  return 'General Improvement';
}

/**
 * Determine impact level
 */
function getImpactLevel(commit) {
  const filesCount = commit.files.length;
  const message = commit.message.toLowerCase();
  
  // High impact indicators
  if (message.includes('breaking') || message.includes('major') || 
      message.includes('mvp') || message.includes('release') ||
      filesCount >= 10) {
    return 'High';
  }
  
  // Medium impact indicators
  if (message.includes('feat:') || message.includes('perf:') ||
      message.includes('component') || message.includes('service') ||
      filesCount >= 5) {
    return 'Medium';
  }
  
  return 'Low';
}

/**
 * Generate improvement entry
 */
function generateImprovementEntry(commit) {
  const category = categorizeChange(commit);
  const impact = getImpactLevel(commit);
  
  // Clean up commit message (remove conventional commit prefix if present)
  const cleanMessage = commit.message.replace(/^(feat|fix|docs|style|refactor|test|chore):\s*/i, '');
  
  const entry = `
### 🚀 **${commit.date}** - ${category}

**Commit**: ${commit.hash} - ${cleanMessage}  
**Type**: ${category}  
**Impact**: ${impact}  
**Author**: ${commit.author}

**Files Modified:**
${commit.files.map(file => `- \`${file}\``).join('\n')}

**Changes Made:**
- ✅ ${cleanMessage}

**Technical Details:**
- Modified ${commit.files.length} file${commit.files.length !== 1 ? 's' : ''}
- Commit hash: \`${commit.hash}\`
- Impact level: ${impact}

**Benefits:**
- Enhanced project functionality and maintainability
- Improved code quality and user experience

---
`;

  return entry;
}

/**
 * Update IMPROVEMENTS.md file
 */
function updateImprovementsFile(entry) {
  try {
    let content = fs.readFileSync(IMPROVEMENTS_FILE, 'utf8');
    
    // Find the insertion point (after "## 🔄 Recent Improvements" section)
    const insertionMarker = '## 🔄 Recent Improvements\n';
    const insertionIndex = content.indexOf(insertionMarker);
    
    if (insertionIndex === -1) {
      console.error('Could not find insertion point in IMPROVEMENTS.md');
      return false;
    }
    
    // Insert the new entry after the marker
    const insertionPoint = insertionIndex + insertionMarker.length;
    const updatedContent = content.slice(0, insertionPoint) + entry + content.slice(insertionPoint);
    
    fs.writeFileSync(IMPROVEMENTS_FILE, updatedContent);
    console.log('✅ IMPROVEMENTS.md updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating IMPROVEMENTS.md:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Analyzing latest commit for improvement logging...');
  
  const commit = getLatestCommit();
  if (!commit) {
    console.log('❌ Could not get commit information');
    return;
  }
  
  console.log(`📋 Commit: ${commit.hash} - ${commit.message}`);
  console.log(`📁 Files changed: ${commit.files.length}`);
  
  if (!isSignificantCommit(commit)) {
    console.log('ℹ️  Commit not significant enough for improvement logging');
    return;
  }
  
  console.log('📝 Generating improvement entry...');
  const entry = generateImprovementEntry(commit);
  
  if (updateImprovementsFile(entry)) {
    console.log('✅ Improvement logged successfully');
  } else {
    console.log('❌ Failed to log improvement');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getLatestCommit,
  isSignificantCommit,
  categorizeChange,
  getImpactLevel,
  generateImprovementEntry,
  updateImprovementsFile
};