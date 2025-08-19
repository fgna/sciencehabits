#!/usr/bin/env node

/**
 * Automatic Documentation Update Script
 * 
 * This script automatically updates README.md and CLAUDE.md when significant
 * code changes are detected. It's triggered by the post-commit git hook.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const README_FILE = path.join(PROJECT_ROOT, 'README.md');
const CLAUDE_FILE = path.join(PROJECT_ROOT, 'CLAUDE.md');
const PACKAGE_FILE = path.join(PROJECT_ROOT, 'package.json');

/**
 * Get current project statistics
 */
function getProjectStats() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf8'));
    
    // Count various file types
    const componentCount = execSync('find src/components -name "*.tsx" 2>/dev/null | wc -l', { cwd: PROJECT_ROOT }).toString().trim();
    const serviceCount = execSync('find src/services -name "*.ts" 2>/dev/null | wc -l', { cwd: PROJECT_ROOT }).toString().trim();
    const storeCount = execSync('find src/stores -name "*.ts" 2>/dev/null | wc -l', { cwd: PROJECT_ROOT }).toString().trim();
    const testCount = execSync('find src -name "*.test.ts*" 2>/dev/null | wc -l', { cwd: PROJECT_ROOT }).toString().trim();
    
    // Get git stats
    const commitCount = execSync('git rev-list --count HEAD', { cwd: PROJECT_ROOT }).toString().trim();
    const lastCommitDate = execSync('git log -1 --format=%cd --date=format:"%B %d, %Y"', { cwd: PROJECT_ROOT }).toString().trim();
    
    // Get bundle size if build exists
    let bundleSize = 'N/A';
    try {
      const buildStats = execSync('du -sh build/static/js/main*.js 2>/dev/null | cut -f1', { cwd: PROJECT_ROOT }).toString().trim();
      if (buildStats) bundleSize = buildStats;
    } catch (e) {
      // Build doesn't exist, use package.json info
    }
    
    return {
      version: packageJson.version,
      dependencies: Object.keys(packageJson.dependencies || {}).length,
      devDependencies: Object.keys(packageJson.devDependencies || {}).length,
      components: componentCount,
      services: serviceCount,
      stores: storeCount,
      tests: testCount,
      commits: commitCount,
      lastUpdate: lastCommitDate,
      bundleSize
    };
  } catch (error) {
    console.error('Error getting project stats:', error.message);
    return null;
  }
}

/**
 * Get recent commits for changelog
 */
function getRecentCommits(count = 5) {
  try {
    const commits = execSync(`git log --oneline -${count} --pretty=format:"%h %s"`, { cwd: PROJECT_ROOT })
      .toString()
      .trim()
      .split('\n')
      .map(line => {
        const [hash, ...messageParts] = line.split(' ');
        return { hash, message: messageParts.join(' ') };
      });
    
    return commits;
  } catch (error) {
    console.error('Error getting recent commits:', error.message);
    return [];
  }
}

/**
 * Update README.md with current project status
 */
function updateReadme(stats) {
  try {
    let content = fs.readFileSync(README_FILE, 'utf8');
    
    // Update project stats if there's a stats section
    const statsSection = `
## 📊 Current Project Status

**Version**: ${stats.version}  
**Components**: ${stats.components} React components  
**Services**: ${stats.services} business logic services  
**Stores**: ${stats.stores} Zustand state stores  
**Tests**: ${stats.tests} test files  
**Dependencies**: ${stats.dependencies} runtime + ${stats.devDependencies} dev dependencies  
**Total Commits**: ${stats.commits}  
**Bundle Size**: ${stats.bundleSize}  
**Last Updated**: ${stats.lastUpdate}
`;

    // Look for existing stats section and replace it
    const statsMarker = '## 📊 Current Project Status';
    const nextSectionMarker = '\n## ';
    
    const statsStart = content.indexOf(statsMarker);
    if (statsStart !== -1) {
      // Find the end of the stats section
      const afterStatsStart = statsStart + statsMarker.length;
      const nextSection = content.indexOf(nextSectionMarker, afterStatsStart);
      const statsEnd = nextSection !== -1 ? nextSection : content.length;
      
      // Replace the stats section
      content = content.slice(0, statsStart) + statsSection + content.slice(statsEnd);
    } else {
      // Add stats section before contributing section
      const contributingMarker = '## 🤝 Contributing';
      const contributingIndex = content.indexOf(contributingMarker);
      if (contributingIndex !== -1) {
        content = content.slice(0, contributingIndex) + statsSection + '\n' + content.slice(contributingIndex);
      }
    }
    
    fs.writeFileSync(README_FILE, content);
    console.log('✅ README.md updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating README.md:', error.message);
    return false;
  }
}

/**
 * Update CLAUDE.md with current session information
 */
function updateClaudeFile(stats) {
  try {
    let content = fs.readFileSync(CLAUDE_FILE, 'utf8');
    
    // Update the last updated timestamp at the bottom
    const timestampMarker = '*Last Updated:';
    const timestampIndex = content.lastIndexOf(timestampMarker);
    
    if (timestampIndex !== -1) {
      const lineEnd = content.indexOf('\n', timestampIndex);
      const newTimestamp = `*Last Updated: ${stats.lastUpdate}*`;
      content = content.slice(0, timestampIndex) + newTimestamp + content.slice(lineEnd);
    }
    
    // Update project status in session notes
    const sessionNotesMarker = '### Session Notes - MVP Release';
    const sessionIndex = content.indexOf(sessionNotesMarker);
    
    if (sessionIndex !== -1) {
      const currentStats = `
### Session Notes - MVP Release
- Development server running on port 3000
- User testing environment accessible via #user-testing
- **MVP Status**: Mobile-first, English-focused, local-storage experience
- **Current Stats**: ${stats.components} components, ${stats.services} services, ${stats.tests} tests
- **Bundle Size**: ${stats.bundleSize} optimized for mobile delivery
- **Total Commits**: ${stats.commits} commits in repository
- **Infrastructure**: Multi-language and advanced features ready for future activation
- **Current Focus**: Core habit tracking with scientific research integration`;

      const nextSectionStart = content.indexOf('\n### ', sessionIndex + 1);
      const sectionEnd = nextSectionStart !== -1 ? nextSectionStart : content.indexOf('\n---', sessionIndex);
      
      if (sectionEnd !== -1) {
        content = content.slice(0, sessionIndex) + currentStats + content.slice(sectionEnd);
      }
    }
    
    fs.writeFileSync(CLAUDE_FILE, content);
    console.log('✅ CLAUDE.md updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating CLAUDE.md:', error.message);
    return false;
  }
}

/**
 * Check if documentation update is needed
 */
function shouldUpdateDocs() {
  try {
    // Get the files changed in the last commit
    const filesChanged = execSync('git diff-tree --no-commit-id --name-only -r HEAD', { cwd: PROJECT_ROOT })
      .toString()
      .trim()
      .split('\n')
      .filter(f => f);
    
    // Check if any significant files were changed
    const significantPatterns = [
      /^src\//,              // Source code changes
      /^package\.json$/,     // Dependency changes
      /^scripts\//,          // Build script changes
      /^\.githooks\//,       // Git hook changes
      /\.tsx?$/,             // TypeScript files
    ];
    
    const hasSignificantChanges = filesChanged.some(file => 
      significantPatterns.some(pattern => pattern.test(file))
    );
    
    // Don't update if only documentation files changed
    const onlyDocsChanged = filesChanged.every(file => 
      file.match(/\.(md|txt)$/i) || 
      file.includes('README') || 
      file.includes('CLAUDE') ||
      file.includes('IMPROVEMENTS')
    );
    
    return hasSignificantChanges && !onlyDocsChanged;
  } catch (error) {
    console.error('Error checking if docs update needed:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Checking if documentation update is needed...');
  
  if (!shouldUpdateDocs()) {
    console.log('ℹ️  No significant changes detected, skipping documentation update');
    return;
  }
  
  console.log('📊 Gathering project statistics...');
  const stats = getProjectStats();
  
  if (!stats) {
    console.log('❌ Could not gather project statistics');
    return;
  }
  
  console.log('📝 Updating documentation files...');
  
  const readmeUpdated = updateReadme(stats);
  const claudeUpdated = updateClaudeFile(stats);
  
  if (readmeUpdated || claudeUpdated) {
    console.log('✅ Documentation updated successfully');
    
    // Stage the updated documentation files
    try {
      if (readmeUpdated) execSync('git add README.md', { cwd: PROJECT_ROOT });
      if (claudeUpdated) execSync('git add CLAUDE.md', { cwd: PROJECT_ROOT });
      console.log('📁 Documentation files staged for next commit');
    } catch (error) {
      console.log('⚠️  Could not stage documentation files:', error.message);
    }
  } else {
    console.log('❌ Failed to update documentation');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getProjectStats,
  getRecentCommits,
  updateReadme,
  updateClaudeFile,
  shouldUpdateDocs
};