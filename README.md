# 🧬 ScienceHabits MVP

> **Mobile-first, science-backed habit tracking for sustainable behavior change**

[![Tests](https://github.com/sciencehabits/app/actions/workflows/test-automation.yml/badge.svg)](https://github.com/sciencehabits/app/actions/workflows/test-automation.yml)
[![Accessibility](https://img.shields.io/badge/accessibility-WCAG%202.1%20AA-green.svg)](https://www.w3.org/WAI/WCAG21/Understanding/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [MVP Features](#mvp-features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [Content System](#content-system)
- [User Testing Environment](#user-testing-environment)
- [Multi-Language Support](#multi-language-support)
- [Contributing](#contributing)

## 🌟 Overview

ScienceHabits MVP is a streamlined Progressive Web Application (PWA) that helps users build sustainable habits based on scientific research. This mobile-first version focuses on core habit tracking functionality with a clean, accessible interface.

**🚀 Current Status**: MVP Release - Mobile-first, English-focused, local-storage experience
**🎯 Core Philosophy**: Privacy-first, offline-capable, science-backed habit formation
**📱 Target Platform**: Mobile devices with responsive design for desktop

## ✨ MVP Features

### 🎯 **Core Habit Tracking**
- **Progressive Onboarding**: Goal-based habit recommendations with 4-phase journey
- **Multi-Frequency Support**: Daily, weekly (3x/week), periodic habits
- **Smart Progress Analytics**: Streak tracking and completion rate calculations
- **Research Integration**: Science-backed habit explanations with research sources
- **Mobile-First Interface**: Optimized carousel design for mobile habit browsing

### 📊 **Progress Analytics**
- **Mobile Analytics Dashboard**: Touch-friendly charts and visualizations
- **Streak Tracking**: Real-time streak calculations with recovery support
- **Completion Insights**: Weekly and monthly progress summaries
- **Recovery Focus**: Compassionate design for missed habits

### 🎨 **User Experience**
- **Mobile-Optimized Carousel**: Swipe-friendly habit browsing
- **Responsive Design**: Works seamlessly across mobile and desktop
- **Clean Interface**: Minimal design focused on essential features
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation
- **Offline Support**: Full PWA functionality without internet

### 🔒 **Privacy & Data**
- **Local-First**: All data stored locally in IndexedDB
- **No Cloud Dependencies**: Fully functional without external services
- **Privacy-Focused**: No tracking, analytics, or external data sharing
- **Import/Export**: JSON backup and restore functionality

### 🌍 **Multi-Language Infrastructure**
- **Core Languages**: English (primary), German, French, Spanish
- **Infrastructure Ready**: Complete i18n system for future expansion
- **Cultural Adaptation**: Localized formatting and terminology
- **Translation Management**: Professional admin dashboard (dev only)

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Git** for version control

### Installation

```bash
# Clone the repository
git clone https://github.com/sciencehabits/app.git
cd sciencehabits

# Install dependencies
npm install

# Start development server
npm start
```

The app will be available at `http://localhost:3000`.

### Development Commands

```bash
# Development
npm start                    # Start dev server
npm run build               # Production build
npm run preview             # Preview production build

# Testing
npm test                    # Run unit tests
npm run test:coverage       # Coverage report
npm run test:a11y          # Accessibility tests
npm run cypress:open       # Interactive E2E tests

# Code Quality
npm run lint               # ESLint
npm run type-check        # TypeScript validation
npm run validate-content  # Content validation

# Content Management
npm run bundle-content     # Bundle content for production
npm run validate-goals     # Validate goal mappings
```

### User Testing Environment

```bash
# Navigate to: #user-testing
# Features: Mock user scenarios, behavioral analytics, journey testing
# Note: Development environment only, not included in production build
```

## 🏗️ Architecture

### Technology Stack

**Frontend Framework**
- **React 19.1.1** - UI library with concurrent features
- **TypeScript 4.9.5** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling with responsive design
- **Progressive Web App** - Offline capabilities and app-like experience

**State Management**
- **Zustand 5.0.7** - Lightweight state management
- **IndexedDB (Dexie 4.0.11)** - Client-side persistence
- **React Context** - Component-level state and providers

**Content System**
- **Bundled Content Strategy** - Build-time content bundling
- **Multi-Language CMS** - Translation management (dev environment)
- **Content Validation Pipeline** - Automated quality assurance
- **GitHub Pages Ready** - Static content delivery optimized

**Testing & Quality**
- **Jest + React Testing Library** - Unit/integration testing
- **Cypress** - End-to-end testing
- **jest-axe** - Accessibility testing
- **User Testing Environment** - Mock scenarios and analytics

### Project Structure

```
src/
├── components/          # React components
│   ├── dashboard/      # Main user interface
│   ├── onboarding/     # User onboarding flow
│   ├── habits/         # Habit management and carousel
│   ├── analytics/      # Progress visualization
│   ├── testing/        # User testing environment (dev only)
│   └── ui/            # Reusable UI components
├── services/           # Business logic
│   ├── storage/       # IndexedDB operations
│   ├── i18n/         # Multi-language services
│   └── BundledContentService.ts # Content loading
├── stores/            # Zustand state stores
├── hooks/             # Custom React hooks
├── data/              # Content and localization
│   ├── bundled/      # Build-time bundled content
│   ├── locales/      # Translation files (en, de, fr, es)
│   └── goalTaxonomy.json # Goal definitions
├── types/             # TypeScript definitions
├── utils/             # Helper functions
└── tests/             # Test utilities and integration tests
```

## 🧪 Testing

### Test Coverage

**Test Types**
- **Unit Tests**: Component behavior and business logic
- **Integration Tests**: Cross-component communication
- **E2E Tests**: Complete user journeys
- **Accessibility Tests**: WCAG 2.1 AA compliance validation
- **Content Validation**: Automated quality assurance

**User Testing Environment**
- **Mock User Scenarios**: 8+ predefined user profiles
- **Behavioral Analytics**: Real-time interaction tracking
- **Journey Visualization**: Completion trends and patterns
- **App Preview**: Full application testing with mock context

### Running Tests

```bash
# Core testing
npm test                    # Unit tests
npm run test:coverage       # Coverage report
npm run test:a11y          # Accessibility compliance

# End-to-end testing
npm run cypress:open        # Interactive E2E tests
npm run cypress:run         # Headless E2E tests

# Content validation
npm run validate-content    # Content quality checks
npm run validate-goals      # Goal mapping validation

# User testing environment
# Navigate to #user-testing for interactive testing
```

## 📊 Content System

### Content Architecture

**Bundled Content Strategy**
- Build-time content bundling for optimal performance
- Version-controlled content with automated validation
- Offline-first content delivery
- Multi-language content support

**Content Types**
- **Habits**: Science-backed habit definitions with research sources
- **Research**: Scientific articles and studies
- **Locales**: Translation files for multi-language support
- **Goal Taxonomy**: Structured goal categories and mappings

**Content Management**
```typescript
// Content access
const bundledContentService = new BundledContentService();
const habits = await bundledContentService.getAllHabits();
const research = await bundledContentService.getResearch();

// Content validation
npm run validate-content    // Automated quality checks
```

**Content Validation Pipeline**
- Automated content structure validation
- Research reference verification
- Translation completeness checks
- Goal mapping consistency validation

## 🧪 User Testing Environment

### Overview

The User Testing Environment provides a framework for testing application behavior with realistic user scenarios and behavioral patterns.

**Key Features**
- **Mock User Scenarios**: Predefined user profiles with realistic data
- **Journey Visualization**: Visual analytics showing completion trends
- **App Preview**: Full application interface with selected user context
- **Behavioral Analytics**: Real-time interaction tracking

**Usage**
```typescript
// Access testing environment
// Navigate to #user-testing

// Available scenarios:
- New users (excited beginners, overwhelmed users)
- Power users (advanced tracking needs)
- Struggling users (inconsistent patterns)
- Returning users (coming back after breaks)
- Consistent users (steady completion rates)
```

**Note**: User testing environment is available in development mode only and not included in production builds.

## 🌍 Multi-Language Support

### Current Implementation

**Supported Languages**
- **English (en)**: Primary language with complete coverage
- **German (de)**: Full localization infrastructure ready
- **French (fr)**: Complete translation framework
- **Spanish (es)**: Comprehensive localization support

**MVP Configuration**
- **Default Language**: English
- **Infrastructure**: Complete i18n system implemented
- **Future Ready**: Easy expansion to additional languages
- **Cultural Adaptation**: Localized formatting and terminology

### Technical Implementation

```typescript
// Multi-language service architecture (ready for activation)
MultiLanguageContentManager     // Content loading and caching
LanguageDetectionService       // Browser language detection
UITranslationService          // React component translations
TranslationService            // Automatic translation integration
TranslationMetadataService    // Quality tracking
QualityWarningService         // Translation monitoring

// React hooks integration
const { t } = useTranslation();
const { currentLanguage, setLanguage } = useLanguage();
```

**MVP Status**: English-focused with multi-language infrastructure ready for future activation.

## 🤝 Contributing

We welcome contributions! Please see our development workflow:

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** changes with comprehensive tests
4. **Run** the full test suite (`npm test && npm run test:integration`)
5. **Validate** content if applicable (`npm run validate-content`)
6. **Commit** with conventional commits (`git commit -m 'feat: add amazing feature'`)
7. **Push** to your branch (`git push origin feature/amazing-feature`)
8. **Open** a Pull Request with detailed description

### Code Quality Standards

- **Test Coverage**: Maintain >80% coverage across all test types
- **Accessibility**: WCAG 2.1 AA compliance required
- **Performance**: Lighthouse score >90 required
- **Type Safety**: No TypeScript errors allowed
- **Content Quality**: All content must pass validation pipeline
- **Mobile-First**: All features must work optimally on mobile

### Commit Convention

We use [Conventional Commits](https://conventionalcommits.org/):

```
feat: add mobile carousel optimization
fix: resolve habit toggle functionality
docs: update MVP documentation
test: add mobile-specific integration tests
```

### Recent MVP Changes

Based on recent git commits, the following enterprise features have been removed:
- **Enhanced Analytics**: Simplified to core progress tracking
- **Admin Dashboard**: Moved to development-only environment
- **Cloud Sync**: Removed for local-first MVP experience
- **Advanced UI Components**: Streamlined to essential features
- **Export Functionality**: Simplified to basic JSON backup
- **Fallback Habits**: Removed to ensure content quality

### Areas for Contribution

- **Mobile Optimization**: Enhance touch interactions and responsive design
- **Content Quality**: Improve habit definitions and research integration
- **Performance**: Optimize rendering and bundle size
- **Accessibility**: Improve WCAG compliance
- **Testing**: Expand test coverage and user scenarios
- **Documentation**: Improve user and developer documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Research Community**: For evidence-based habit formation insights
- **Accessibility Experts**: For inclusive design guidance
- **Mobile UX Community**: For mobile-first design patterns
- **Open Source Community**: For the amazing tools and libraries
- **Contributors**: For helping create this focused MVP experience

---

<div align="center">
  <strong>Built with ❤️ for sustainable behavior change</strong>
  <br>
  <em>MVP focused on mobile-first, science-backed habit tracking</em>
  <br><br>
  <a href="https://sciencehabits.vercel.app">🌐 Live MVP</a> •
  <a href="#user-testing-environment">🧪 User Testing</a> •
  <a href="https://github.com/sciencehabits/app/issues">🐛 Report Bug</a> •
  <a href="https://github.com/sciencehabits/app/discussions">💬 Discussions</a>
</div>