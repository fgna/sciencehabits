# Check Regressions Command

Perform comprehensive regression analysis on the ScienceHabits project:

## Step 1: Scan for Improvement Markers
1. Find all files with "IMPROVEMENT" comments using grep
2. Check if any recent changes modified these files
3. Verify improvements are still functioning correctly
4. Report any potential regressions found

## Step 2: Validate Recent Changes
1. Compare current code against IMPROVEMENTS_LOG.md entries
2. Verify each logged improvement is still present:
   - Completion rate calculation using actual days
   - New user habit tracking after onboarding
   - UI consistency between pages
   - Analytics system functionality
   - Research article integration
3. Check for any reverted functionality
4. Test critical features mentioned in CLAUDE.md

## Step 3: Performance Regression Check
1. Review performance benchmarks in documentation
2. Check current bundle size against previous builds
3. Verify lazy loading is still implemented
4. Identify potential performance regressions

## Step 4: Feature Completeness Audit
1. Cross-reference implemented features with requirements:
   - User onboarding flow
   - Habit tracking (daily/weekly/periodic)
   - Analytics dashboard
   - Research integration
   - PWA functionality
2. Verify no features were accidentally removed
3. Check all documented integrations are working
4. Validate configuration settings match documentation

## Step 5: Critical Path Testing
1. New user signup and onboarding
2. Habit creation and tracking
3. Progress visualization
4. Analytics calculation
5. Research article viewing

## Step 6: Generate Regression Report
Create structured report with:
- ✅ Verified working improvements
- ⚠️ Potential regression risks
- 🔴 Confirmed regressions found
- 📋 Recommended verification steps
- 🔧 Suggested fixes for any issues

Execute analysis and provide detailed findings.