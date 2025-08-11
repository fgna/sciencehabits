#!/usr/bin/env node

/**
 * Content Report Generation Script
 * 
 * Generates comprehensive reports about content validation status,
 * inconsistencies, and recommendations for content creators.
 */

const path = require('path');
const fs = require('fs').promises;
const { SimpleContentValidator } = require('./validate-content.js');

class ContentReportGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '../logs');
  }

  async generateAllReports() {
    console.log('📋 Generating comprehensive content reports...');
    
    const validator = new SimpleContentValidator();
    const result = await validator.validateAllContent();
    
    // Ensure output directory exists
    await this.ensureOutputDir();
    
    // Generate reports
    await this.generateValidationSummary(result);
    await this.generateInconsistencyReport(result);
    await this.generateContentQualityReport(result);
    await this.generateMarkdownReport(result);
    
    console.log('✅ All reports generated successfully');
    console.log(`📁 Reports available in: ${this.outputDir}`);
  }

  async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.warn('Could not create logs directory:', error.message);
    }
  }

  async generateValidationSummary(result) {
    const summary = {
      generatedAt: new Date().toISOString(),
      buildId: process.env.BUILD_ID || process.env.NODE_ENV || 'development',
      success: result.success,
      totals: result.summary?.totals || {
        habitsProcessed: 0,
        researchProcessed: 0,
        criticalErrors: result.errors.length,
        inconsistencies: result.inconsistencies.length,
        warnings: result.warnings.length
      },
      inconsistencyBreakdown: this.categorizeIssues(result.inconsistencies),
      errorBreakdown: this.categorizeIssues(result.errors),
      warningBreakdown: this.categorizeIssues(result.warnings),
      topIssues: this.getTopIssues(result.inconsistencies),
      recommendations: result.summary?.recommendations || []
    };

    const filePath = path.join(this.outputDir, 'validation-summary.json');
    await fs.writeFile(filePath, JSON.stringify(summary, null, 2));
    console.log('📊 Generated validation-summary.json');
  }

  async generateInconsistencyReport(result) {
    const report = {
      generatedAt: new Date().toISOString(),
      missingResearch: result.inconsistencies
        .filter(i => i.type === 'MISSING_RESEARCH')
        .map(i => ({
          habitId: i.habitId,
          habitTitle: i.details?.habitTitle || 'Unknown',
          missingIds: i.details?.missingIds || [],
          recommendation: 'Add missing research articles or remove invalid references'
        })),
      orphanedResearch: result.inconsistencies
        .filter(i => i.type === 'ORPHANED_RESEARCH')
        .map(i => ({
          researchId: i.researchId,
          title: i.details?.title || 'Unknown',
          recommendation: 'Link research to relevant habits'
        })),
      goalTagIssues: result.inconsistencies
        .filter(i => i.type === 'INVALID_GOAL_TAGS' || i.type === 'MISSING_GOAL_TAGS')
        .map(i => ({
          habitId: i.habitId,
          habitTitle: i.details?.habitTitle || 'Unknown',
          issue: i.type,
          invalidTags: i.details?.invalidTags || [],
          recommendation: 'Use valid goal tags from the approved list'
        })),
      duplicateIds: result.errors
        .filter(e => e.type === 'DUPLICATE_IDS')
        .map(e => ({
          type: e.details?.duplicates ? 'multiple' : 'unknown',
          duplicateIds: e.details?.duplicates || [],
          recommendation: 'Ensure all IDs are unique across the system'
        }))
    };

    const filePath = path.join(this.outputDir, 'data-inconsistencies.json');
    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
    console.log('🔍 Generated data-inconsistencies.json');
  }

  async generateContentQualityReport(result) {
    const qualityReport = {
      generatedAt: new Date().toISOString(),
      contentQuality: {
        habitsWithoutInstructions: result.warnings
          .filter(w => w.type === 'INCOMPLETE_INSTRUCTIONS')
          .map(w => ({
            habitId: w.habitId,
            habitTitle: w.details?.habitTitle || 'Unknown',
            recommendation: 'Add detailed, actionable instructions'
          })),
        researchWithInsufficientSummary: result.warnings
          .filter(w => w.type === 'INSUFFICIENT_SUMMARY')
          .map(w => ({
            researchId: w.researchId,
            title: w.details?.title || 'Unknown',
            recommendation: 'Expand summary to at least 50 characters'
          })),
        outdatedResearch: result.warnings
          .filter(w => w.type === 'OUTDATED_RESEARCH')
          .map(w => ({
            researchId: w.researchId,
            title: w.details?.title || 'Unknown',
            year: w.details?.year,
            recommendation: 'Consider updating with more recent research'
          }))
      },
      qualityScores: {
        overallScore: this.calculateQualityScore(result),
        habitsWithCompleteData: this.countCompleteHabits(result),
        researchWithCompleteData: this.countCompleteResearch(result)
      },
      improvementPriorities: this.generateImprovementPriorities(result)
    };

    const filePath = path.join(this.outputDir, 'content-quality-report.json');
    await fs.writeFile(filePath, JSON.stringify(qualityReport, null, 2));
    console.log('📝 Generated content-quality-report.json');
  }

  async generateMarkdownReport(result) {
    const timestamp = new Date().toLocaleString();
    const totals = result.summary?.totals || { habitsProcessed: 0, researchProcessed: 0, criticalErrors: 0, inconsistencies: 0, warnings: 0 };
    
    let markdown = `# Content Validation Report

**Generated:** ${timestamp}  
**Status:** ${result.success ? '✅ PASSED' : '❌ FAILED'}

## Summary

| Metric | Count |
|--------|-------|
| Habits Processed | ${totals.habitsProcessed} |
| Research Articles | ${totals.researchProcessed} |
| Critical Errors | ${totals.criticalErrors} |
| Data Inconsistencies | ${totals.inconsistencies} |
| Content Warnings | ${totals.warnings} |

`;

    if (result.errors.length > 0) {
      markdown += `## 🚨 Critical Errors

These issues must be fixed before deployment:

`;
      result.errors.forEach(error => {
        markdown += `- **${error.type}**: ${error.message}\n`;
      });
      markdown += '\n';
    }

    if (result.inconsistencies.length > 0) {
      markdown += `## ⚠️ Data Inconsistencies

These issues allow the app to continue but should be addressed:

`;
      result.inconsistencies.slice(0, 10).forEach(inconsistency => {
        markdown += `- **${inconsistency.type}**: ${inconsistency.message}\n`;
      });
      
      if (result.inconsistencies.length > 10) {
        markdown += `\n*... and ${result.inconsistencies.length - 10} more inconsistencies*\n`;
      }
      markdown += '\n';
    }

    if (result.warnings.length > 0) {
      markdown += `## 💡 Content Quality Warnings

Suggestions for improving content quality:

`;
      result.warnings.slice(0, 5).forEach(warning => {
        markdown += `- **${warning.type}**: ${warning.message}\n`;
      });
      
      if (result.warnings.length > 5) {
        markdown += `\n*... and ${result.warnings.length - 5} more warnings*\n`;
      }
      markdown += '\n';
    }

    if (result.summary?.recommendations) {
      markdown += `## 🎯 Recommendations

`;
      result.summary.recommendations.forEach(rec => {
        markdown += `${rec}\n\n`;
      });
    }

    markdown += `## Next Steps

1. **Fix Critical Errors**: Address any critical errors that prevent deployment
2. **Review Inconsistencies**: Update content to resolve data inconsistencies
3. **Improve Quality**: Address content quality warnings for better user experience
4. **Monitor Regularly**: Run validation checks regularly to catch issues early

---

*Report generated by ScienceHabits Content Validation System*
`;

    const filePath = path.join(this.outputDir, 'content-validation-report.md');
    await fs.writeFile(filePath, markdown);
    console.log('📄 Generated content-validation-report.md');
  }

  categorizeIssues(issues) {
    const breakdown = {};
    issues.forEach(issue => {
      breakdown[issue.type] = (breakdown[issue.type] || 0) + 1;
    });
    return breakdown;
  }

  getTopIssues(inconsistencies) {
    const breakdown = this.categorizeIssues(inconsistencies);
    return Object.entries(breakdown)
      .map(([type, count]) => ({
        type,
        count,
        impact: this.getImpactForType(type)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  getImpactForType(type) {
    const impactMap = {
      'MISSING_RESEARCH': 'Habits display without research evidence',
      'ORPHANED_RESEARCH': 'Research not discoverable through habits',
      'INVALID_GOAL_TAGS': 'Incorrect habit recommendations',
      'MISSING_GOAL_TAGS': 'Habits not shown in goal-based filters',
      'DUPLICATE_IDS': 'Data conflicts and unpredictable behavior'
    };
    return impactMap[type] || 'Unknown impact';
  }

  calculateQualityScore(result) {
    const totals = result.summary?.totals || { habitsProcessed: 0, researchProcessed: 0, criticalErrors: 0, inconsistencies: 0, warnings: 0 };
    const totalItems = totals.habitsProcessed + totals.researchProcessed;
    
    if (totalItems === 0) return 100;
    
    const totalIssues = totals.criticalErrors + totals.inconsistencies + (totals.warnings * 0.5);
    const score = Math.max(0, Math.round(100 - (totalIssues / totalItems) * 100));
    
    return score;
  }

  countCompleteHabits(result) {
    // Simplified calculation - in a real implementation, this would analyze the actual data
    const totals = result.summary?.totals || { habitsProcessed: 0 };
    const incompleteHabits = result.inconsistencies.filter(i => 
      i.type === 'MISSING_RESEARCH' || i.type === 'MISSING_GOAL_TAGS' || i.type === 'INVALID_GOAL_TAGS'
    ).length;
    
    return Math.max(0, totals.habitsProcessed - incompleteHabits);
  }

  countCompleteResearch(result) {
    const totals = result.summary?.totals || { researchProcessed: 0 };
    const incompleteResearch = result.warnings.filter(w => 
      w.type === 'INSUFFICIENT_SUMMARY' || w.type === 'OUTDATED_RESEARCH'
    ).length;
    
    return Math.max(0, totals.researchProcessed - incompleteResearch);
  }

  generateImprovementPriorities(result) {
    const priorities = [];
    
    if (result.errors.length > 0) {
      priorities.push({
        priority: 'HIGH',
        category: 'Critical Errors',
        count: result.errors.length,
        action: 'Must fix before deployment'
      });
    }

    const missingResearchCount = result.inconsistencies.filter(i => i.type === 'MISSING_RESEARCH').length;
    if (missingResearchCount > 0) {
      priorities.push({
        priority: 'MEDIUM',
        category: 'Missing Research',
        count: missingResearchCount,
        action: 'Add research articles to support habit claims'
      });
    }

    const qualityWarningsCount = result.warnings.filter(w => 
      w.type === 'INCOMPLETE_INSTRUCTIONS' || w.type === 'INSUFFICIENT_SUMMARY'
    ).length;
    
    if (qualityWarningsCount > 0) {
      priorities.push({
        priority: 'LOW',
        category: 'Content Quality',
        count: qualityWarningsCount,
        action: 'Improve content completeness and quality'
      });
    }

    return priorities;
  }
}

// Main execution
async function main() {
  try {
    const generator = new ContentReportGenerator();
    await generator.generateAllReports();
    
    console.log('\n🎉 Content reporting completed successfully!');
    
  } catch (error) {
    console.error('💥 Report generation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { ContentReportGenerator };