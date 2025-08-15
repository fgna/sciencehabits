# Project Status Command

Generate a comprehensive project status report for ScienceHabits:

## Current Implementation Status
- Scan all source files and identify completed features
- List in-progress work based on TODOs and FIXMEs
- Identify missing functionality from requirements
- Check feature flags and experimental code

## Recent Activity Summary (Last 30 Days)
- Parse git commits and categorize changes
- Highlight major improvements and features added
- Show performance trends and optimizations
- List bug fixes and their impact

## Code Quality Metrics
- Count TypeScript errors and warnings
- Analyze code complexity (cyclomatic complexity if possible)
- Count test files and estimate coverage
- Identify technical debt areas
- Check for code duplication

## Performance Analysis
- Current bundle size and breakdown
- Lazy loading implementation status
- Database query optimization opportunities
- Memory usage patterns
- Load time metrics

## Deployment Status
- Current production version
- Netlify deployment status
- GitHub Actions CI/CD status
- Environment configurations
- Active feature flags

## Risk Assessment
- Identify potential regression points
- Highlight critical dependencies needing updates
- Note areas with insufficient test coverage
- Security vulnerabilities (if any)
- Performance bottlenecks

## Technical Debt Inventory
- Legacy code that needs refactoring
- Deprecated dependencies
- Workarounds that need proper solutions
- Missing documentation areas
- Test coverage gaps

## Next Priority Actions
Based on analysis, suggest:
1. Most critical bugs to fix
2. Quick wins for performance
3. Important features to complete
4. Technical debt to address
5. Documentation needs

## Team Metrics (if applicable)
- Recent contributor activity
- Open issues and PRs
- Code review status
- Release cadence

Format as structured markdown with clear sections, metrics, and actionable items. Include specific file references where relevant.