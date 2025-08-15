# Update Documentation Command

## Purpose
Systematically refresh and update all project documentation files to maintain accuracy and consistency.

## Usage
This command ensures all documentation stays synchronized with current project state, code changes, and improvements.

## Process

### 1. Analyze Current Project State
```bash
# Get project information
git status
git log --oneline -10
npm list --depth=0
find src -name "*.ts" -o -name "*.tsx" | wc -l
```

### 2. Review Code Changes
- Scan for new files and significant modifications
- Identify new features, components, or services
- Check for deprecated or removed functionality
- Analyze performance improvements or regressions

### 3. Update Core Documentation Files

#### CLAUDE.md Updates
- **Recent Improvements**: Add latest significant changes
- **Implementation Status**: Update feature completion status
- **Technology Stack**: Verify current dependencies and versions
- **Critical Files**: Add new important files or remove obsolete ones
- **Known Issues**: Update resolved issues and add new ones
- **Performance Standards**: Update metrics and benchmarks

#### IMPROVEMENTS_LOG.md Updates
- **Recent Changes Table**: Add new entries with proper categorization
- **Detailed Improvements**: Document significant features or fixes
- **File Modification Tracking**: Update most-modified files list
- **Performance Impact**: Add performance metrics for new changes
- **Testing Status**: Update test coverage information

#### README.md Updates (if exists)
- Update feature list and descriptions
- Refresh installation and setup instructions
- Update screenshots or demos if UI changed
- Verify command examples and scripts

### 4. Synchronize Documentation Consistency

#### Cross-Reference Check
- Ensure CLAUDE.md and IMPROVEMENTS_LOG.md consistency
- Verify package.json scripts match documented commands
- Check that all critical files are properly documented
- Validate that performance metrics are current

#### Link Validation
- Check internal documentation links
- Verify external links are still valid
- Update API documentation references
- Ensure file path references are accurate

### 5. Update Auto-Documentation System

#### Settings Validation
- Verify `.claude/settings.json` is current
- Update command descriptions if needed
- Check hook configurations are working
- Validate memory and session settings

#### Command Files
- Update this and other command files as needed
- Add new commands for new features
- Remove or update obsolete command references
- Ensure examples are current and working

### 6. Code Documentation Markers

#### Add/Update Improvement Markers
```typescript
// IMPROVEMENT IMPLEMENTED: 2025-08-15 - Multi-language system
// DO NOT REVERT: Critical for international user support
```

#### Update File Headers
```typescript
/**
 * [Component/Service Name]
 * 
 * [Brief Description]
 * Last Updated: [Date]
 * Critical: [Yes/No]
 */
```

### 7. Validation and Quality Check

#### Documentation Completeness
- [ ] All new features documented
- [ ] All critical files listed and described
- [ ] Performance impacts noted
- [ ] Known issues current and accurate
- [ ] Installation/setup instructions current

#### Consistency Check
- [ ] Terminology used consistently
- [ ] File paths and references accurate
- [ ] Version numbers match package.json
- [ ] Git workflow documentation current
- [ ] Command examples work correctly

### 8. Generate Update Summary

Create summary of documentation changes:
```markdown
## Documentation Update Summary - [Date]

### Files Updated:
- CLAUDE.md: [brief description of changes]
- IMPROVEMENTS_LOG.md: [brief description of changes]
- README.md: [brief description of changes]

### New Documentation:
- [List any new documentation added]

### Removed/Deprecated:
- [List any obsolete documentation removed]

### Validation Status:
- [ ] All links verified
- [ ] Code examples tested
- [ ] File references validated
- [ ] Cross-references synchronized
```

## Quality Standards

### Documentation Requirements
- **Accuracy**: All information reflects current project state
- **Completeness**: No significant features or changes undocumented
- **Clarity**: Documentation is clear and actionable
- **Discoverability**: Important information is easy to find
- **Maintainability**: Documentation structure supports easy updates

### Performance Documentation
- Include specific metrics where measurable
- Note bundle size impacts for significant changes
- Document load time implications
- Track memory usage for new features

### Future-Proofing
- Use relative dates and version references
- Include context for decision-making
- Document workarounds with expiration conditions
- Maintain changelog format consistency

## Example Usage

```bash
# Full documentation refresh workflow
echo "🔄 UPDATING: Project documentation refresh initiated"
echo "Analyzing: Git history, package changes, file modifications"
echo "Updating: CLAUDE.md, IMPROVEMENTS_LOG.md, command files"
echo "Validating: Links, references, consistency, completeness"
echo "Result: All documentation synchronized with current project state"
```

## Automation Opportunities

### Git Hooks Integration
- Pre-commit: Validate documentation references
- Post-commit: Auto-update file modification tracking
- Pre-push: Ensure critical documentation is current

### Continuous Integration
- Automated link checking
- Documentation completeness validation
- Cross-reference consistency checking
- Performance metric tracking