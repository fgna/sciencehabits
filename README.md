# 🧬 ScienceHabits

> **Science-backed habit tracking for sustainable behavior change**

[![Tests](https://github.com/sciencehabits/app/actions/workflows/test-automation.yml/badge.svg)](https://github.com/sciencehabits/app/actions/workflows/test-automation.yml)
[![Accessibility](https://img.shields.io/badge/accessibility-WCAG%202.1%20AA-green.svg)](https://www.w3.org/WAI/WCAG21/Understanding/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [Content Management System](#content-management-system)
- [User Testing Environment](#user-testing-environment)
- [Multi-Language Support](#multi-language-support)
- [Sync Architecture](#sync-architecture)
- [Contributing](#contributing)

## 🌟 Overview

ScienceHabits is a Progressive Web Application (PWA) that helps users build sustainable habits based on scientific research. The app provides personalized habit recommendations, progress tracking, and educational content to support evidence-based behavior change.

**🚀 Latest Enhancement**: Complete Content Management System with GitHub Pages-based Content API, comprehensive multi-language support, and User Data Mock Dataset Testing Environment for advanced development workflows.

**🎯 Core Philosophy**: Privacy-first, local-first architecture with optional multi-cloud sync, designed for long-term sustainable habit formation based on behavioral science.

## ✨ Key Features

### 🎯 **Core Habit Tracking**
- **Personalized Onboarding**: Goal-based habit recommendations with progressive 4-phase journey
- **Multi-Frequency Support**: Daily, weekly (3x/week), periodic (quarterly/yearly) habits
- **Smart Progress Analytics**: Frequency-aware streak and performance tracking
- **Intelligent Reminders**: Browser notifications with completion pattern analysis
- **Research Integration**: Science-backed habit explanations with contextual insights

### 🧠 **AI-Powered Intelligence**
- **Smart Scheduling System**: AI-optimized habit timing with stacking methodology
- **Adaptive Difficulty Engine**: Automatic adjustment based on performance patterns
- **Proactive Recovery System**: Detects struggling patterns and provides compassionate support
- **Contextual Research Integration**: Relevant scientific insights at optimal moments
- **Motivational Messaging AI**: Context-aware encouragement with research backing

### 🎨 **Enhanced User Experience**
- **Progressive Onboarding**: 4-phase guided setup with milestone tracking
- **Enhanced Progress Visualizations**: Interactive charts, heatmaps, and streak analytics
- **Personalization Control**: 4 levels from minimal to comprehensive AI assistance
- **Compassionate Design**: Recovery-focused rather than punishment-based approach
- **Micro-Interactions**: Gentle, purposeful feedback throughout the app

### 🔒 **Privacy & Security**
- **Hybrid Local-First Architecture**: Works offline, syncs across devices
- **End-to-End Encryption**: All data encrypted before leaving your device
- **Multi-Cloud Support**: NextCloud (privacy-first) and Google Cloud Storage
- **Device Management**: Secure multi-device synchronization
- **GDPR Compliance**: EU hosting options and privacy controls

### 🌍 **Multi-Language System**
- **4 Languages Supported**: English, German, French, Spanish
- **Immediate Publishing Strategy**: Real-time translations with admin oversight
- **Quality Control System**: Translation warnings and review workflows
- **Cultural Adaptation**: Localized formatting and terminology
- **Admin Dashboard**: Professional translation management interface

### ♿ **Accessibility & Quality**
- **WCAG 2.1 AA Compliant**: Full accessibility support with keyboard navigation
- **Performance Optimized**: Lighthouse score > 90 with optimized rendering
- **Type-Safe**: Full TypeScript implementation with strict mode
- **Comprehensive Testing**: Unit, integration, E2E, accessibility test suites
- **Responsive Design**: Mobile-first, works on all devices

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
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run test:a11y          # Accessibility tests
npm run test:integration   # Integration tests
npm run cypress:open       # Interactive E2E tests

# Code Quality
npm run lint               # ESLint
npm run type-check        # TypeScript validation
npm run validate-content  # Content validation

# Content Management
npm run fetch-content-api # Fetch from content API
npm run validate-goals    # Validate goal mappings
```

### Admin & Development Access

```bash
# Admin Dashboard
# Navigate to: #admin
# Features: Content management, translation oversight, system monitoring

# User Testing Environment  
# Navigate to: #user-testing
# Features: Mock user scenarios, behavioral analytics, journey testing

# Translation Dashboard
# Navigate to: #translation-dashboard  
# Features: Multi-language quality control, review workflows
```

## 🏗️ Architecture

### Technology Stack

**Frontend Framework**
- **React 19.1.1** - UI library with concurrent features
- **TypeScript 4.9.5** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling with Headless UI
- **Progressive Web App** - Offline capabilities and app-like experience

**State Management**
- **Zustand 5.0.7** - Lightweight state management
- **IndexedDB (Dexie 4.0.11)** - Client-side persistence
- **React Context** - Component-level state and providers

**Content Management**
- **GitHub Pages Content API** - Distributed content delivery
- **Multi-Language CMS** - Translation management and quality control
- **Content Validation Pipeline** - Automated quality assurance
- **Hybrid Architecture** - GitHub Pages + Runtime API ready for scaling

**Testing & Quality**
- **Jest + React Testing Library** - Unit/integration testing
- **Cypress** - End-to-end testing
- **jest-axe** - Accessibility testing
- **User Testing Environment** - Mock scenarios and behavioral analytics

### Project Structure

```
src/
├── components/          # React components
│   ├── admin/          # Content management system
│   │   ├── AdminDashboard.tsx      # Main CMS interface
│   │   ├── HabitsManager.tsx       # Habit content editing
│   │   ├── ResearchManager.tsx     # Research article management
│   │   ├── TranslationDashboard.tsx # Multi-language oversight
│   │   └── ContentAPIClient.ts     # GitHub Pages API integration
│   ├── testing/        # User testing environment
│   │   ├── UserTestingDashboard.tsx     # Main testing interface
│   │   ├── UserScenarioSelector.tsx     # Mock user selection
│   │   ├── UserJourneyVisualization.tsx # Analytics visualization
│   │   └── AppPreviewWithContext.tsx    # App testing with user context
│   ├── auth/           # Authentication & sync
│   ├── dashboard/      # Main user interface
│   ├── onboarding/     # User onboarding flow
│   ├── habits/         # Habit management
│   ├── analytics/      # Progress visualization
│   └── i18n/          # Multi-language components
├── services/           # Business logic
│   ├── admin/         # CMS services
│   ├── testing/       # User testing services
│   ├── i18n/         # Multi-language services (5 interconnected)
│   ├── sync/         # Cloud synchronization
│   ├── storage/      # Database operations
│   └── migration/    # Hybrid architecture preparation
├── stores/            # Zustand state stores
├── hooks/             # Custom React hooks
├── data/              # Content and localization
│   ├── locales/      # Translation files (en, de, fr, es)
│   ├── habits/       # Habit definitions
│   └── research/     # Research articles
├── types/             # TypeScript definitions
├── utils/             # Helper functions
└── tests/             # Test utilities and integration tests

.github/workflows/     # CI/CD automation
├── validate-cms-integration.yml    # CMS validation
├── deploy-admin-dashboard.yml      # Admin deployment
└── test-automation.yml            # Comprehensive testing

runtime-api-server/    # Future hybrid deployment
├── src/server.ts     # Express.js foundation
├── middleware/       # Security and performance
└── routes/          # API endpoints
```

## 🧪 Testing

### Comprehensive Test Coverage

**Test Types**
- **Unit Tests**: Component behavior and business logic
- **Integration Tests**: Cross-system communication (CMS, API, Main App)
- **E2E Tests**: Complete user journeys and workflows
- **Accessibility Tests**: WCAG 2.1 AA compliance validation
- **Performance Tests**: Lighthouse CI with render time budgets
- **Content Validation**: Automated quality assurance for content

**User Testing Environment**
- **Mock User Scenarios**: 8+ predefined user profiles (new, power, struggling, returning, consistent)
- **Behavioral Analytics**: Real-time interaction tracking and analysis
- **Journey Visualization**: Completion trends and pattern analysis
- **App Preview**: Full application testing with mock user context

### Running Tests

```bash
# Core testing
npm test                    # Unit tests
npm run test:coverage       # Coverage report
npm run test:integration    # Integration tests
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

### Continuous Integration

GitHub Actions pipeline includes:
- ✅ TypeScript compilation and linting
- ✅ Unit and integration test suites
- ✅ Accessibility compliance testing (WCAG 2.1 AA)
- ✅ Multi-browser E2E tests (Chrome, Firefox, Edge, Safari)
- ✅ Content management system validation
- ✅ Performance testing with Lighthouse (>90 score requirement)
- ✅ Security vulnerability scanning
- ✅ Multi-language content validation

## 📊 Content Management System

### Overview

ScienceHabits features a complete Content Management System built on a hybrid GitHub Pages + Runtime API architecture, designed for scalability and cost-effectiveness.

### Architecture Components

**GitHub Pages Content API**
- Distributed content delivery via GitHub Pages
- Version-controlled content with automated validation
- RESTful API endpoints for habits, research, and metadata
- Authentication and rate limiting for content access

**Admin Dashboard**
- Professional content editing interface
- Real-time preview and validation
- Multi-language content oversight
- System health monitoring and metrics

**Hybrid Migration System**
- Feature flags for gradual rollout
- Runtime API server foundation ($5/month deployment ready)
- Intelligent fallback strategies
- Performance monitoring and optimization

### Key Features

```typescript
// Content API Client
const contentAPI = new ContentAPIClient();

// Fetch habits with language support
const habits = await contentAPI.getHabits('en');

// Content validation pipeline
const validation = await contentValidator.validateContent(content);

// Translation quality monitoring
const qualityReport = qualityWarningService.generateQualityReport();
```

**Content Management Workflows**
1. **Content Creation**: Rich editing interface with preview
2. **Validation Pipeline**: Automated quality checks and validation
3. **Translation Oversight**: Multi-language quality control
4. **Deployment**: Automated deployment via GitHub Actions
5. **Monitoring**: Health checks and performance metrics

### Technical Implementation

**GitHub Actions CI/CD**
- Content validation on every commit
- Automated deployment to GitHub Pages
- Integration testing across all systems
- Performance monitoring and alerts

**Hybrid Architecture Preparation**
- Migration configuration with feature flags
- Runtime API server foundation (Express.js)
- Circuit breaker patterns for reliability
- Cache-first strategies with TTL invalidation

## 🧪 User Testing Environment

### Overview

The User Data Mock Dataset Testing Environment provides a comprehensive framework for testing application behavior with realistic user scenarios and behavioral patterns.

### Key Components

**Mock User Scenarios**
- **New Users**: Excited beginners and overwhelmed users
- **Power Users**: Advanced users with sophisticated tracking needs
- **Struggling Users**: Users with inconsistent patterns and restart attempts
- **Returning Users**: Users coming back after breaks
- **Consistent Users**: Steady users with reliable completion rates

**Testing Interface**
- **User Scenario Selector**: Browse and select predefined user profiles
- **Journey Visualization**: Visual analytics showing completion trends
- **App Preview**: Full application interface with selected user's data
- **Behavioral Analytics**: Real-time interaction tracking and analysis

### Usage Workflows

```typescript
// Enable testing mode
const { enableTestingMode, recordEvent } = useUserTesting();

// Select user scenario
enableTestingMode('struggling_user_inconsistent');

// Track interactions
recordEvent('habit_completion', { habitId: 'morning-meditation' });

// Generate analytics
const analytics = getBehaviorAnalytics();
```

**Testing Scenarios**
1. **User Experience Testing**: Navigate through different user journeys
2. **Feature Validation**: Test new features with various user types
3. **Recovery Flow Testing**: Validate motivational interventions
4. **A/B Testing**: Compare behaviors across user scenarios

### Access Points

- **Admin Panel**: Navigate to `#admin` → "User Testing"
- **Direct Access**: Navigate to `#user-testing`
- **Programmatic**: Use `useUserTesting` hook in components

## 🌍 Multi-Language Support

### Comprehensive i18n System

**Supported Languages**
- **English (en)**: Master language with complete coverage
- **German (de)**: Full localization with cultural adaptation
- **French (fr)**: Complete translation with regional formatting
- **Spanish (es)**: Comprehensive localization with cultural context

**Translation Strategy**
- **Immediate Publishing**: Real-time translations with admin oversight
- **Quality Control**: Translation warnings and review workflows
- **Cultural Adaptation**: Localized date formats and terminology
- **Claude API Integration**: Automatic translations with quality monitoring

### Technical Implementation

```typescript
// Multi-language service architecture
MultiLanguageContentManager     // Content loading and caching
LanguageDetectionService       // Browser language detection
UITranslationService          // React component translations
TranslationService            // Claude API integration
TranslationMetadataService    // Quality tracking
QualityWarningService         // Translation monitoring

// React hooks integration
const { t } = useTranslation();
const { currentLanguage, setLanguage } = useLanguage();
```

**Translation Management**
- **Admin Dashboard**: Professional translation interface
- **Quality Warnings**: Real-time quality alerts for unreviewed content
- **Review Workflows**: German research article review interface
- **Metadata Tracking**: Translation history and quality metrics

## 🔒 Hybrid Local-First Sync Architecture

### Privacy-First Design

**Core Principles**
- **Local-First**: Fully functional without internet connection
- **Privacy-First**: All data encrypted client-side using AES-GCM
- **Multi-Cloud Support**: NextCloud (privacy) and Google Cloud (convenience)
- **Device Management**: Secure multi-device synchronization

**Supported Cloud Providers**

```typescript
// NextCloud (Privacy-Focused)
interface NextCloudConfig {
  serverUrl: string;
  username: string;
  appPassword: string;  // Secure app-specific credentials
}

// Google Cloud Storage (Convenience-Focused)  
interface GoogleCloudConfig {
  projectId: string;
  keyFilename: string;  // Service account credentials
  bucketName: string;
}
```

**Security Features**
- **AES-GCM Encryption**: 256-bit keys with authenticated encryption
- **PBKDF2 Key Derivation**: 100,000 iterations for password security
- **Per-User Encryption**: Unique encryption keys per user
- **Device-Specific Keys**: Additional security layer per device

### Technical Architecture

**Authentication System**
```typescript
interface User {
  userId: string;           // PBKDF2-derived from email
  email: string;           // User identifier  
  devices: DeviceInfo[];   // Connected devices
  encryptionSalt: number[]; // Encryption key salt
  cloudProvider: 'nextcloud' | 'google-cloud' | 'none';
}
```

**Cloud Provider Architecture**
```typescript
abstract class CloudProvider {
  abstract uploadFile(path: string, data: EncryptedData): Promise<void>;
  abstract downloadFile(path: string): Promise<EncryptedData>;
  abstract checkConnection(): Promise<boolean>;
}
```

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
- **Multi-Language**: Consider i18n impact for user-facing changes

### Commit Convention

We use [Conventional Commits](https://conventionalcommits.org/):

```
feat: add user testing environment
fix: resolve content API authentication
docs: update multi-language documentation  
test: add integration tests for CMS
```

### Areas for Contribution

- **Content Management**: Enhance CMS features and workflows
- **User Testing**: Expand mock scenarios and analytics
- **Multi-Language**: Add new language support
- **Performance**: Optimize rendering and bundle size
- **Accessibility**: Improve WCAG compliance
- **Documentation**: Improve developer and user documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Research Community**: For evidence-based habit formation insights
- **Accessibility Experts**: For inclusive design guidance  
- **Translation Community**: For cultural adaptation and localization
- **Open Source Community**: For the amazing tools and libraries
- **Contributors**: For making this comprehensive system possible

---

<div align="center">
  <strong>Built with ❤️ for sustainable behavior change</strong>
  <br>
  <a href="https://sciencehabits.app">🌐 Website</a> •
  <a href="https://docs.sciencehabits.app">📚 Docs</a> •
  <a href="https://github.com/sciencehabits/app/issues">🐛 Report Bug</a> •
  <a href="https://github.com/sciencehabits/app/discussions">💬 Discussions</a>
</div>