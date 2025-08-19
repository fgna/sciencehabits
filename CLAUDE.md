# CLAUDE.md - Project Memory and Context File

## Project Overview
**ScienceHabits MVP** is a streamlined Progressive Web Application (PWA) for science-backed habit tracking and behavior change. This mobile-first version focuses on core habit tracking functionality with clean, accessible interface and local-first data architecture.

**🚀 CURRENT STATUS**: MVP Release - Mobile-first, English-focused, local-storage experience with enterprise features removed for clarity and performance.

**🎯 MVP FOCUS**: Core habit tracking, mobile optimization, offline functionality, and scientific research integration without complex enterprise features.

## Current Architecture

### Technology Stack
- **Frontend Framework**: React 19.1.1 with TypeScript
- **State Management**: Zustand 5.0.7
- **Database**: Dexie (IndexedDB wrapper) 4.0.11
- **Styling**: Tailwind CSS with @tailwindcss/forms
- **UI Components**: Headless UI 2.2.7
- **Testing**: Jest, React Testing Library, Cypress
- **Build Tool**: React Scripts 5.0.1
- **Deployment**: Vercel (optimized for MVP delivery)

### Key Frameworks & Libraries (MVP Configuration)
- **Internationalization**: react-i18next 15.6.1 + Custom i18n System (infrastructure ready, English-focused)
- **Multi-Language Support**: 🆕 Complete i18n architecture available (currently English primary)
- **Markdown Rendering**: react-markdown 10.1.0 with remark-gfm
- **Routing**: Custom SPA routing (no react-router, hash-based navigation)
- **Analytics**: Simplified progress tracking focused on core metrics
- **Content System**: Build-time bundled content with validation pipeline

### MVP Architecture Decisions
- **Local-First**: All data stored in IndexedDB, no cloud dependencies
- **Mobile-First**: Responsive design optimized for mobile devices
- **Content Strategy**: Build-time bundling for optimal performance
- **Language Strategy**: English primary with i18n infrastructure ready
- **Feature Set**: Core habit tracking without enterprise complexity

## Recent Major Improvements (Last 30 Days)

### August 19, 2025 - 🚀 MVP RELEASE: Complete Code Cleanup
- ✅ **Mobile Carousel Optimization** - Enhanced responsive design for mobile devices
- ✅ **Fallback Content Removal** - Eliminated problematic habits without research backing
- ✅ **Error Handling Implementation** - Clear error messages for missing content
- ✅ **Mobile-First Interface** - Optimized touch interactions and responsive breakpoints
- ✅ **Content Quality Assurance** - Removed habits without proper research data

### August 18, 2025 - 🔧 ENTERPRISE FEATURE CLEANUP: MVP Focus
- ✅ **Complete MVP Cleanup** - Removed enterprise features for mobile-first architecture
- ✅ **Enhanced Analytics Removal** - Simplified to core progress tracking
- ✅ **Admin Dashboard Scope** - Moved to development-only environment
- ✅ **Cloud Sync Removal** - Established local-first MVP experience
- ✅ **Export Functionality Simplification** - Removed complex export features
- ✅ **UI Component Streamlining** - Focused on essential features only

### August 17, 2025 - 🔧 CRITICAL INFRASTRUCTURE: Git Hooks System
- ✅ **Comprehensive Git Hooks** - Pre-commit and pre-push validation system
- ✅ **TypeScript Error Prevention** - Blocks commits with TypeScript compilation errors
- ✅ **ESLint Integration** - Prevents critical ESLint errors from being committed
- ✅ **Build Verification** - Ensures builds succeed before commits/pushes
- ✅ **Code Quality Checks** - Detects debugger statements, console.logs, large files
- ✅ **Research Modal Fix** - Fixed "View Research & Science" showing embedded habit research
- ✅ **Type System Enhancement** - Extended Habit interface for research properties
- ✅ **Manual Validation Scripts** - Added npm scripts for manual hook execution

### August 15, 2025 - 🚀 INFRASTRUCTURE: Multi-Language System (Development Ready)
- ✅ **Comprehensive Multi-Language Support** - Full i18n system with EN/DE/FR/ES support
- ✅ **Advanced Translation Services** - Claude API integration with quality warnings
- ✅ **Professional Admin Dashboard** - Translation monitoring (development environment)
- ✅ **React Hooks Integration** - useLanguage and useTranslation hooks
- ✅ **Cultural Adaptation Infrastructure** - Ready for future multi-language activation
- ✅ **German Research Review Interface** - Professional translation review workflow
- ✅ **React Hooks Integration** - useLanguage and useTranslation hooks
- ✅ **Settings Integration** - Language selector with auto-detection
- ✅ **Google Drive Sync Enhancement** - Simplified sync with permissions management
- ✅ **Settings Navigation Improvements** - Enhanced access to settings across modes
- ✅ **Critical Bug Fixes** - Completion rate calculation and new user habit tracking

### August 14, 2025 - UI/UX & Infrastructure
- ✅ **Improved UI consistency** - Unified design between Today and My Habits pages
- ✅ **Fixed Netlify deployment** - Added proper SPA routing with _redirects and netlify.toml
- ✅ **Restored GitHub workflows** - Re-enabled CI/CD after fixing OAuth permissions

### August 13, 2025 - Research & Analytics
- ✅ **Enhanced research system** - Full article viewing with clean UI
- ✅ **Comprehensive analytics system** - Detailed progress tracking and visualization
- ✅ **Research article access** - Direct access from habit cards

### August 12, 2025 - Foundation Features
- ✅ **Progressive onboarding** - Improved UX for new user experience
- ✅ **Headless CMS implementation** - Multi-language support system foundation
- ✅ **Hybrid sync architecture** - Local-first with multi-cloud support
- ✅ **Recovery-first design** - Enhanced analytics and recovery features
- ✅ **Milestone badges system** - Gamification and levels

### August 11, 2025 - Initial Implementation
- ✅ **Content validation system** - Comprehensive validation and logging
- ✅ **GitHub Actions CI/CD** - Automated testing and deployment pipeline
- ✅ **Initial app creation** - Complete ScienceHabits PWA with testing framework

## Implementation Status (MVP Release)

### ✅ MVP Core Features - Complete
- **Progressive Onboarding**: Goal-based habit recommendations with 4-phase journey
- **Habit Tracking**: Daily/weekly/periodic frequencies with streak calculations
- **Mobile-First Interface**: Optimized carousel design for mobile habit browsing
- **Progress Analytics**: Simplified tracking focused on core metrics
- **Research Integration**: Science-backed habit explanations with sources
- **PWA Functionality**: Full offline support with local data storage
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation
- **Content Quality**: Eliminated habits without proper research backing

### 🏗️ Infrastructure Ready (Not Active in MVP)
- **Multi-Language System**: Complete i18n architecture (English primary)
- **Translation Management**: Professional admin dashboard (development only)
- **Advanced Analytics**: Infrastructure available, simplified for MVP
- **User Testing Environment**: Mock scenarios and behavioral analytics (dev only)
- **Content Management**: Build-time bundling with validation pipeline

### 🚫 Removed for MVP Focus
- **Enhanced Analytics**: Complex charts and enterprise reporting
- **Cloud Sync**: Multi-cloud synchronization features
- **Advanced UI Components**: Non-essential interface elements
- **Export Functionality**: Complex reporting and data export
- **Admin Dashboard**: Moved to development environment only
- **Fallback Content**: Removed habits without research data

### 📋 Future Expansion Ready
- **Multi-Language Activation**: Infrastructure complete, ready for enabling
- **Cloud Sync Restoration**: Architecture preserved for future implementation
- **Advanced Analytics**: Enterprise features available for restoration
- **Social Features**: Foundation ready for community features
- **AI Recommendations**: Architecture prepared for intelligent suggestions

## Coding Standards

### File Organization
- Components in `src/components/` with feature-based subdirectories
- **🆕 Multi-Language Services**: `src/services/i18n/` (5 interconnected services)
- **🆕 i18n Hooks**: `src/hooks/useLanguage.ts`, `src/hooks/useTranslation.ts`
- **🆕 Translation Data**: `src/data/locales/` (en.json, de.json, fr.json, es.json)
- **🆕 i18n Types**: `src/types/i18n.ts` (comprehensive TypeScript interfaces)
- Stores in `src/stores/` using Zustand
- Services in `src/services/` for business logic
- Utils in `src/utils/` for helper functions
- Types in `src/types/` for TypeScript definitions

### Code Conventions
- **Components**: Functional components with TypeScript
- **State**: Zustand stores with typed interfaces
- **Multi-Language**: React hooks (useLanguage, useTranslation) for seamless i18n
- **Styling**: Tailwind CSS classes, minimal custom CSS
- **Testing**: Component tests with React Testing Library
- **Comments**: Minimal inline comments, self-documenting code
- **Git Commits**: Conventional commits (feat:, fix:, docs:, etc.)

### Performance Standards
- Lazy loading for heavy components (including translation services)
- IndexedDB for local data persistence + translation metadata
- Optimistic UI updates
- Minimal re-renders with proper memoization
- Translation caching for performance optimization

## Known Issues

### Current Status
- ✅ **Previously Critical Issues**: All resolved as of August 15, 2025
- ✅ **Completion Rate Calculation**: Fixed to use actual usage days
- ✅ **New User Habit Tracking**: Restored proper onboarding flow
- ✅ **Admin Authentication**: Fixed IndexedDB transaction issues

### Minor Technical Debt
- Multi-language system needs comprehensive integration testing
- Some ESLint warnings in build (unused variables)
- Content validation shows 227 data inconsistencies (non-critical)
- Migration artifacts from React 18 to 19

### Workarounds
- Using `.npmrc` with `legacy-peer-deps=true` for React 19 compatibility
- Manual Netlify redirect configuration for SPA routing

## Development Guidelines

### Before Making Changes
1. Check `IMPROVEMENTS_LOG.md` for recent changes and critical files
2. Review this file for architectural decisions
3. Run `npm run validate-content` to check data integrity
4. Ensure TypeScript compilation succeeds
5. **🆕 Multi-Language Impact**: Consider translation effects for UI changes

### When Adding Features
1. Follow existing component patterns
2. Add proper TypeScript types
3. **🆕 i18n Consideration**: Use useTranslation hook for user-facing text
4. Update relevant documentation
5. Include basic tests
6. Use conventional commit messages

### Performance Considerations
- Keep bundle size minimal (current: 847KB gzipped including i18n)
- Use lazy loading for large components and translation services
- Optimize database queries and translation caching
- Cache expensive calculations and translations

### Deployment Process
1. Test locally with `npm start`
2. Build with `npm run build`
3. Commit with descriptive message
4. Push to GitHub (auto-deploys to Netlify)
5. Verify on production
6. **🆕 i18n Testing**: Test language switching and admin dashboard

## Critical Files - DO NOT MODIFY WITHOUT EXTREME CARE

### 🔒 PROTECTED SYSTEMS (High Risk of Regression)
- **🆕 Multi-Language System**: `src/services/i18n/` (5 interconnected services)
- **🆕 i18n React Hooks**: `src/hooks/useLanguage.ts`, `src/hooks/useTranslation.ts`
- **🆕 Translation Types**: `src/types/i18n.ts`
- **Core Analytics**: `src/utils/analyticsHelpers.ts` - Critical calculation logic
- **User Management**: `src/stores/userStore.ts` - User state management
- **Database Layer**: `src/services/storage/database.ts` - IndexedDB operations
- **New User Flow**: `src/components/onboarding/` - Essential for user acquisition

### Configuration Files
- `netlify.toml` - SPA routing configuration
- `public/_redirects` - Netlify redirect rules
- `.npmrc` - React 19 compatibility settings
- `tsconfig.json` - TypeScript configuration
- **🆕 Claude Code Config**: `.claude/settings.json` - Auto-documentation system
- **🆕 Git Hooks**: `.githooks/` - Pre-commit and pre-push validation scripts

### 🆕 Multi-Language Data Files
- `src/data/locales/en.json` - English UI translations (master)
- `src/data/locales/de.json` - German UI translations
- `src/data/translation-metadata.json` - Translation tracking metadata

## Environment Variables
- No critical environment variables currently required
- App works with default configuration
- Admin system runs on separate port (3005)
- **🆕 Multi-Language**: Claude API integration configured in services

## Testing Commands
```bash
npm test                 # Run all tests
npm run test:coverage    # Generate coverage report
npm run test:a11y       # Run accessibility tests
npm run cypress:open    # Open Cypress for E2E tests
npm run lighthouse      # Run Lighthouse audit
```

## Useful Development Commands
```bash
npm start               # Start development server
npm run build          # Create production build
npm run validate-content # Validate content files
npm run analyze        # Analyze bundle size
```

## 🆕 Git Hooks & Code Quality System

### Installed Git Hooks
The project now includes comprehensive git hooks that automatically validate code quality:

**Pre-commit Hook** (runs before every commit):
- ✅ TypeScript compilation validation (blocks commits with TS errors)
- ✅ ESLint critical error detection (blocks commits with critical ESLint errors)
- ✅ Content validation (ensures data integrity)
- ✅ Code quality checks (detects debugger statements, large files)
- ⚠️ Console.log detection (warns but doesn't block)
- ⚠️ TODO/FIXME detection (warns but doesn't block)
- ✅ Build verification (ensures project builds successfully)

**Pre-push Hook** (runs before every push):
- ✅ Full TypeScript build validation
- ✅ Test suite execution (if tests exist)

### Manual Validation Commands
```bash
npm run validate:typescript    # Run TypeScript validation only
npm run validate:pre-commit    # Run all pre-commit checks manually
npm run validate:pre-push      # Run all pre-push checks manually
npm run validate:all           # Run all validations
```

### Hook Setup & Management
```bash
# Initial setup (already done)
./scripts/setup-git-hooks.sh

# Emergency bypass (use sparingly)
git commit --no-verify -m "Emergency commit"
git push --no-verify
```

### Benefits
- **Zero TypeScript errors in commits** - Prevents broken code from entering repository
- **Consistent code quality** - Automated enforcement of ESLint rules
- **Build reliability** - Ensures all commits result in successful builds
- **Team productivity** - Catches issues early in development cycle
- **Documentation enforcement** - Encourages conventional commit messages

## 🆕 Multi-Language Development

### Language Support Access
- **Admin Dashboard**: Navigate to `#admin` in development
- **Translation Dashboard**: Navigate to `#translation-dashboard`
- **German Research Review**: Navigate to `#research-translation-review`
- **Settings Language Selector**: Available in Settings tab

### i18n Development Workflow
1. **Add New UI Text**: Use `t('key')` from useTranslation hook
2. **Add to Locale Files**: Update `src/data/locales/en.json` (master)
3. **Translation Generation**: Services auto-generate other languages via Claude API
4. **Quality Review**: Use admin dashboard to review and approve translations
5. **Cultural Adaptation**: Consider German formality, date formats, etc.

### i18n Service Architecture
- **MultiLanguageContentManager**: Core content loading and caching
- **LanguageDetectionService**: Browser language detection with overrides
- **UITranslationService**: React component translation management
- **TranslationService**: Claude API integration for automatic translations
- **TranslationMetadataService**: Quality tracking and metadata management
- **QualityWarningService**: Translation quality monitoring and alerts

## MANDATORY GIT WORKFLOW - FOLLOW THESE RULES EXACTLY

### Pre-Commit Process
🔧 **ALWAYS run `just precommit` first** (if justfile exists with precommit recipe)
- Check for justfile: `ls justfile Justfile 2>/dev/null`
- If exists and has precommit recipe: `just precommit`
- Wait for completion before proceeding to git operations

### Staging Rules - CRITICAL
📦 **Stage files individually using `git add <file1> <file2> ...`**
- ✅ ALLOWED: `git add src/auth.js components/Login.tsx`
- ❌ FORBIDDEN: `git add .`
- ❌ FORBIDDEN: `git add -A` 
- ❌ FORBIDDEN: `git commit -am`
- **ONLY stage changes that were explicitly edited in this session**
- **Use single quotes for files with `$` characters**: `git add 'app/routes/_protected.foo.$bar.tsx'`

### Commit Message Rules
🐛 **For compiler/linter errors**: Use "fixup" commit message format

**For all other commits**, messages must:
- Start with present-tense verb (Fix, Add, Implement, Update, Remove, etc.)
- Be 60-120 characters long
- Be a single line ending with a period
- Describe the intent of the original prompt, not implementation details
- Sound like an issue title we resolved
- **NEVER include adjectives like**: comprehensive, best practices, essential, robust, elegant
- **NEVER include Claude attribution footers**

✅ **Good examples:**
- `Fix authentication redirect loop.`
- `Add user profile validation.`
- `Implement password reset functionality.`
- `Update API error handling.`

❌ **Bad examples:**
- `Add comprehensive error handling with best practices` (too many adjectives)
- `Fixed the bug` (past tense, not descriptive)
- `Implement robust authentication system using JWT tokens and bcrypt` (implementation details)

### Commit Process - EXACT SEQUENCE
1. Echo exactly: `Ready to commit: git commit --message "<message>"`
2. **Immediately run the git commit command without asking for confirmation**
3. **If pre-commit hooks fail**:
   - Hooks may create local changes
   - Run `git add` for those new changes
   - Try commit again with same message
   - **NEVER use `git commit --no-verify`**

### Examples of Complete Workflow

**Example 1: Regular feature work**
```bash
# 1. Check for and run precommit
just precommit

# 2. Stage only the files we edited
git add src/components/UserProfile.tsx src/utils/validation.ts

# 3. Commit with proper message
Ready to commit: git commit --message "Add user profile validation."
git commit --message "Add user profile validation."
```

## Auto-Documentation System

### Implementation Status
- ✅ **Project Analysis**: Complete comprehensive analysis
- ✅ **Improvements Tracking**: Automated git history integration
- ✅ **Memory Management**: Project context and session persistence
- ✅ **Configuration**: `.claude/settings.json` with hooks and commands
- 🔧 **Current Task**: Auto-documentation system setup (in progress)

### Automated Features
- **File Modification Logging**: Automatic tracking in `.claude/activity.log`
- **Session Persistence**: Conversation and task continuity
- **Regression Prevention**: Warnings for critical file modifications
- **Quality Monitoring**: Performance and improvement impact assessment

### Session Notes - MVP Release
- Development server running on port 3000
- User testing environment accessible via #user-testing
- **MVP Status**: Mobile-first, English-focused, local-storage experience
- **Enterprise Features**: Removed for MVP clarity and performance
- **Infrastructure**: Multi-language and advanced features ready for future activation
- **Current Focus**: Core habit tracking with scientific research integration

### MVP Development Commands
```bash
# Core MVP development
npm start                    # Development server
npm run build               # Production MVP build
npm test                    # Core functionality tests
npm run validate-content    # Content quality validation

# Development environment features (not in production)
# Navigate to #user-testing for mock user scenarios
# Navigate to #admin for content management (dev only)
```

### MVP Critical Files - Handle with Care
- **🔒 CORE MVP COMPONENTS**:
  - `src/components/habits/HabitsCarousel.tsx` - Mobile-optimized habit interface
  - `src/components/dashboard/SimplifiedDashboard.tsx` - Main user interface
  - `src/components/onboarding/` - User onboarding flow
  - `src/data/loader.ts` - Content loading with error handling
  - `src/data/bundled/` - Build-time content system

- **🛠️ INFRASTRUCTURE (Ready for Future)**:
  - `src/services/i18n/` - Multi-language system (infrastructure)
  - `src/components/testing/` - User testing environment (dev only)
  - `src/components/admin/` - Content management (dev only)

---

*Last Updated: August 19, 2025 at 04:00 UTC*
*Auto-maintained by Claude Code Documentation System*
*Project Status: MVP Release | Core Features: ✅ Complete | Mobile-First: ✅ Optimized*