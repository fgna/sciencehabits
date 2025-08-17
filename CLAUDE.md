# CLAUDE.md - Project Memory and Context File

## Project Overview
**ScienceHabits** is a Progressive Web Application (PWA) for science-backed habit tracking and behavior change. It helps users build healthy habits based on peer-reviewed research, with features for progress tracking, analytics, and personalized recommendations.

**🌍 NEW**: Comprehensive multi-language support system with immediate publishing strategy and admin oversight.

## Current Architecture

### Technology Stack
- **Frontend Framework**: React 19.1.1 with TypeScript
- **State Management**: Zustand 5.0.7
- **Database**: Dexie (IndexedDB wrapper) 4.0.11
- **Styling**: Tailwind CSS with @tailwindcss/forms
- **UI Components**: Headless UI 2.2.7
- **Testing**: Jest, React Testing Library, Cypress
- **Build Tool**: React Scripts 5.0.1
- **Deployment**: Netlify (with SPA routing configured)

### Key Frameworks & Libraries
- **Internationalization**: react-i18next 15.6.1 + Custom i18n System
- **Multi-Language Support**: 🆕 Comprehensive i18n architecture with Claude API integration
- **Markdown Rendering**: react-markdown 10.1.0 with remark-gfm
- **Routing**: Custom SPA routing (no react-router currently active)
- **Analytics**: Custom analytics system with comprehensive tracking
- **Admin System**: Professional translation management dashboard

### Multi-Language Architecture 🆕
- **Supported Languages**: English (en), German (de), French (fr), Spanish (es)
- **Translation Strategy**: Immediate publishing with admin oversight
- **Quality Control**: Real-time quality warnings and review system
- **Cultural Adaptation**: Localized formatting, terminology, and cultural context
- **Services**: 5 interconnected i18n services with Claude API integration

## Recent Major Improvements (Last 30 Days)

### August 17, 2025 - 🔧 CRITICAL INFRASTRUCTURE: Git Hooks System
- ✅ **Comprehensive Git Hooks** - Pre-commit and pre-push validation system
- ✅ **TypeScript Error Prevention** - Blocks commits with TypeScript compilation errors
- ✅ **ESLint Integration** - Prevents critical ESLint errors from being committed
- ✅ **Build Verification** - Ensures builds succeed before commits/pushes
- ✅ **Code Quality Checks** - Detects debugger statements, console.logs, large files
- ✅ **Research Modal Fix** - Fixed "View Research & Science" showing embedded habit research
- ✅ **Type System Enhancement** - Extended Habit interface for research properties
- ✅ **Manual Validation Scripts** - Added npm scripts for manual hook execution

### August 15, 2025 - 🚀 MAJOR RELEASE: Multi-Language System
- ✅ **Comprehensive Multi-Language Support** - Full i18n system with EN/DE/FR/ES support
- ✅ **Advanced Translation Services** - Claude API integration with quality warnings
- ✅ **Professional Admin Dashboard** - Translation monitoring with real-time statistics
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

## Implementation Status

### Core Features - ✅ Complete
- User onboarding with progressive goal selection
- Habit tracking with daily/weekly/periodic frequencies
- Progress visualization and streak tracking
- Research-backed habit recommendations
- Custom habit creation
- Analytics dashboard with multiple views
- PWA functionality with offline support

### 🆕 Multi-Language Features - ✅ Complete
- Comprehensive i18n architecture with 4 language support
- Immediate publishing strategy with admin oversight
- System language detection with manual override
- Claude API integration for automatic translations
- Quality warning system for unreviewed content
- Professional admin dashboard with real-time statistics
- German research article review interface
- Cultural adaptation and localization
- React hooks for seamless language switching

### Recent Enhancements - ✅ Complete
- Enhanced analytics with time-based analysis
- Research article integration
- UI consistency improvements
- Proper completion rate calculations
- New user experience fixes
- Google Drive sync improvements

### In Progress - 🔧
- Multi-language test coverage expansion
- Admin dashboard system (backend at port 3005)
- Advanced gamification features

### Planned Features - 📋
- Additional language support (Italian, Portuguese, Japanese)
- Social features and community
- Advanced AI recommendations
- Wearable device integrations
- Team/family accounts

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

### Session Notes
- Development server running on port 3000
- Admin backend/dashboard accessible via hash routing
- **🆕 Multi-Language System**: Fully operational with admin oversight
- All critical regressions have been resolved
- Auto-documentation system actively being implemented

---

*Last Updated: August 15, 2025 at 16:00 UTC*
*Auto-maintained by Claude Code Documentation System*
*Project Status: Stable | Major Features: Complete | Multi-Language: ✅ Operational*