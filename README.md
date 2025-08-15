# 🧬 ScienceHabits

> **Science-backed habit tracking for sustainable behavior change**

[![Tests](https://github.com/sciencehabits/app/actions/workflows/test-automation.yml/badge.svg)](https://github.com/sciencehabits/app/actions/workflows/test-automation.yml)
[![Accessibility](https://img.shields.io/badge/accessibility-WCAG%202.1%20AA-green.svg)](https://www.w3.org/WAI/WCAG21/Understanding/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Architecture](#architecture)

## 🌟 Overview

ScienceHabits is a Progressive Web Application (PWA) that helps users build sustainable habits based on scientific research. The app provides personalized habit recommendations, progress tracking, and educational content to support evidence-based behavior change.

**🎉 Latest Enhancement**: Comprehensive UX transformation featuring AI-powered adaptive systems, compassionate recovery support, intelligent scheduling, and personalized user experience with 4-tier personalization options. Built on a hybrid local-first architecture with multi-cloud sync support and comprehensive accessibility compliance.

**🚀 Recent Updates**: TypeScript compilation fully stabilized, SmartDailyDashboard enhanced with robust error handling and empty state management, all UI/UX components successfully integrated and tested.

## ✨ Features

### 🎯 **Core Features**
- **Personalized Onboarding**: Goal-based habit recommendations
- **Multi-Frequency Habit Tracking**: Daily, weekly (3x/week), periodic (quarterly/yearly) habits
- **Smart Progress Analytics**: Frequency-aware streak and performance tracking
- **Intelligent Reminders**: Browser notifications with completion pattern analysis
- **Research Integration**: Science-backed habit explanations
- **Hybrid Local-First Architecture**: Works offline, syncs across devices
- **Multi-Cloud Sync**: NextCloud (privacy-first) and Google Cloud Storage support
- **End-to-End Encryption**: All data encrypted before leaving your device

### 🧠 **AI-Powered Intelligence**
- **Smart Scheduling System**: AI-optimized habit timing with stacking methodology
- **Adaptive Difficulty Engine**: Automatic adjustment based on performance patterns
- **Proactive Recovery System**: Detects struggling patterns and provides compassionate support
- **Contextual Research Integration**: Relevant scientific insights at optimal moments
- **Motivational Messaging AI**: Context-aware encouragement with research backing
- **Predictive Analytics**: Performance trend analysis and optimization suggestions

### 🎨 **Enhanced User Experience**
- **Progressive Onboarding Journey**: 4-phase guided setup with milestone tracking
- **Enhanced Progress Visualizations**: Interactive charts, heatmaps, and streak analytics
- **Personalization Depth Control**: 4 levels from minimal to comprehensive AI assistance
- **Compassionate Design Philosophy**: Recovery-focused rather than punishment-based
- **Micro-Interactions & Animations**: Gentle, purposeful feedback throughout the app
- **Enhanced Habit Cards**: Rich contextual information and adaptive recommendations

### 🔬 **Advanced Features**
- **Non-Daily Habit Support**: Weekly goals, periodic habits, custom frequencies
- **Intelligent Reminder System**: Context-aware notifications based on user patterns
- **Multi-Device Sync**: Secure synchronization across all your devices
- **Device Management**: View, rename, and manage connected devices
- **Privacy-First Design**: GDPR-compliant with EU hosting options (NextCloud)
- **Connection Testing**: Comprehensive cloud provider validation
- **Modular Content System**: Dynamic habit and research loading
- **Goal-based Filtering**: Personalized content recommendations
- **Advanced Weekly Tracking**: Session counting for flexible weekly goals (e.g., "3 times per week")
- **Recovery-Specific Suggestions**: Micro-habits and bridge activities for getting back on track

### ♿ **Accessibility & Quality**
- **WCAG 2.1 AA Compliant**: Full accessibility support with comprehensive keyboard navigation
- **Responsive Design**: Mobile-first, works on all devices
- **Performance Optimized**: Lighthouse score > 90 with optimized component rendering
- **Type-Safe**: Full TypeScript implementation with strict mode
- **Comprehensive Testing**: Unit, integration, E2E, accessibility, and UX test suites
- **Inclusive Design**: Color-blind friendly palette and screen reader optimized
- **Performance Budgets**: <100ms render times, <16ms interaction delays

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

### Key Features Available
- **AI-Powered Smart Scheduling**: Optimal habit timing with stacking suggestions and fallback empty states
- **Adaptive Difficulty System**: Automatic adjustment based on your success patterns
- **Proactive Recovery Support**: Compassionate assistance when you're struggling
- **Enhanced Progress Visualization**: Interactive charts, heatmaps, and analytics
- **4-Tier Personalization**: Choose your AI assistance level (minimal to comprehensive)
- **Progressive Onboarding**: Guided 4-phase journey to habit mastery with progress tracking
- **Robust Error Handling**: Graceful degradation with helpful user guidance
- **Multi-frequency habit creation**: Daily, weekly goals, periodic habits
- **Smart reminders**: Context-aware browser notifications
- **Weekly goal tracking**: Session-based progress (e.g., "3/5 this week")
- **Research integration**: Science-backed explanations with contextual insights
- **Multi-device sync**: Secure synchronization across devices
- **Privacy-first design**: All data encrypted client-side
- **Cloud provider options**: NextCloud or Google Cloud Storage
- **Offline support**: Full PWA capabilities with local-first architecture
- **Comprehensive accessibility**: WCAG 2.1 AA compliant with keyboard navigation

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
npm run cypress:open       # Interactive E2E tests
npm run cypress:run        # Headless E2E tests

# Code Quality
npm run lint               # ESLint
npm run lint:fix          # Auto-fix linting issues
npm run type-check        # TypeScript validation
npm run format            # Prettier formatting

# UX Testing
npm run test:ux           # Comprehensive UX test suite
npm run test:performance  # Performance benchmarks

# Sync System Development
# Note: Cloud provider testing requires valid credentials
# Use local-only mode for development without cloud setup
```

### Sync System Development

**Local Development (No Cloud Required)**
- The app works fully offline in local-only mode
- All sync features can be developed and tested locally
- User authentication and device management work without cloud providers

**Cloud Provider Testing**
- **NextCloud**: Requires a NextCloud instance and app password
- **Google Cloud**: Requires Google Cloud project with Storage API enabled
- **Connection Testing**: Use the built-in connection tester component

**Environment Setup**
```bash
# The app automatically detects and works in offline mode
# No additional setup required for local development

# For cloud testing, you'll need:
# - NextCloud instance with WebDAV access
# - Google Cloud project with Storage API and service account
# - Valid credentials for authentication testing
```

## 🧪 Testing

We maintain comprehensive test coverage across multiple dimensions:

### Test Types
- **Unit Tests**: Component behavior and logic
- **Integration Tests**: Cross-component workflows
- **E2E Tests**: Complete user journeys
- **Accessibility Tests**: WCAG 2.1 AA compliance
- **UX Tests**: Usability, performance, and visual regression
- **Performance Tests**: Lighthouse CI with render time budgets
- **Security Tests**: Dependency scanning and encryption validation
- **AI System Tests**: Adaptive algorithms and recommendation quality

### Running Tests

```bash
# Quick test suite
npm test

# Full test suite with coverage
npm run test:coverage

# Accessibility compliance
npm run test:a11y

# End-to-end testing
npm run cypress:run

# UX and performance testing
npm run test:ux

# Smoke tests
npm run test:smoke
```

### Continuous Integration

Our GitHub Actions pipeline runs:
- ✅ Linting and type checking
- ✅ Unit and integration tests
- ✅ Accessibility compliance testing (WCAG 2.1 AA)
- ✅ UX test suite (usability, performance, visual regression)
- ✅ Multi-browser E2E tests (Chrome, Firefox, Edge, Safari)
- ✅ Performance testing with Lighthouse (>90 score requirement)
- ✅ AI system validation (adaptive algorithms, personalization)
- ✅ Security vulnerability scanning
- ✅ Deployment to staging/production

## 🎯 Comprehensive UX Enhancement System

### Overview

ScienceHabits features a complete UX transformation that implements AI-powered adaptive systems, compassionate recovery support, and intelligent personalization. The system learns from user behavior to provide increasingly relevant support and guidance.

### 🧠 AI-Powered Adaptive Intelligence

**Smart Scheduling Engine**
- Analyzes completion patterns to suggest optimal habit timing
- Implements habit stacking methodology for better consistency
- Learns from user preferences and environmental factors
- Provides contextual hints and timing recommendations
- Graceful handling of empty states with helpful onboarding guidance

**Adaptive Difficulty System**
- Monitors completion rates and consistency patterns
- Automatically suggests difficulty adjustments based on performance
- Implements research-backed 70-80% success rate targeting
- Provides clear reasoning for all recommendations

**Proactive Recovery Detection**
- Identifies struggling patterns before they become problematic
- Detects streak breaks, completion declines, and motivation drops
- Triggers compassionate support messages and micro-habit suggestions
- Offers evidence-based recovery strategies

### 🎨 Enhanced User Experience Design

**Progressive Onboarding Journey**
```
Phase 1: Foundation Setup (10 min)
├── Profile completion with goal alignment
├── First habit creation with smart suggestions
├── Initial completion experience
└── Personalization preference setup

Phase 2: Learning & Discovery (15 min)
├── Research library exploration
├── Smart scheduling trial
├── Progress visualization understanding
└── Category exploration

Phase 3: Expanding Practice (20 min)
├── Multi-habit routine building
├── Habit stacking implementation
├── Difficulty optimization
└── Recovery system experience

Phase 4: Mastery & Optimization (25 min)
├── Consistency achievement (7+ days)
├── Advanced analytics review
├── Community engagement
└── Advanced feature exploration
```

**Enhanced Progress Visualization**
- **Streak Visualization**: Interactive charts showing habit formation patterns
- **Completion Heatmap**: GitHub-style activity visualization with intensity levels
- **Category Analytics**: Performance breakdown by habit categories
- **Trend Analysis**: Pattern recognition and future performance prediction

**Personalization Depth Control**
- **Minimal**: Basic tracking with static recommendations
- **Balanced**: Smart suggestions with moderate data collection
- **Adaptive**: AI-powered personalization with dynamic learning
- **Comprehensive**: Full optimization with research participation

### 🤗 Compassionate Design Philosophy

**Recovery-Focused Approach**
- Self-compassion messaging during difficult periods
- Micro-habit suggestions for gentle re-engagement
- Bridge activities to reconnect with dormant habits
- Research-backed explanations for why setbacks are normal

**Emotional Design System**
- Warm, encouraging color palette (compassion, progress, recovery themes)
- Gentle micro-interactions that provide positive feedback
- Celebration animations for achievements and milestones
- Understanding tone in all messaging and copy

**Motivational Messaging AI**
- Context-aware encouragement based on time of day and user state
- Personalized messages that adapt to individual success patterns
- Research-backed insights delivered at optimal moments
- Celebration of small wins and progress acknowledgment

### 🛠️ Technical Implementation

**AI Services Architecture**
```typescript
// Smart Scheduling Service
interface SmartSchedule {
  stacks: HabitStack[];
  contextualHints: ContextualHint[];
  adaptiveRecommendations: AdaptiveRecommendation[];
  optimalTimings: TimeSlot[];
}

// Adaptive Difficulty Engine
interface DifficultyAdjustment {
  habitId: string;
  currentDifficulty: DifficultyLevel;
  recommendedDifficulty: DifficultyLevel;
  confidence: number;
  reasoning: string;
  suggestedChanges: DifficultyChange[];
}

// Recovery System
interface RecoveryPlan {
  triggers: RecoveryTrigger[];
  recommendations: RecoveryRecommendation[];
  supportMessage: string;
  emotionalTone: 'gentle' | 'encouraging' | 'understanding';
  estimatedRecoveryTime: number;
}
```

**Performance Optimization**
- Component render times <100ms
- Interaction delays <16ms (60fps)
- Lazy loading for enhanced components
- Optimized state management with Zustand
- TypeScript compilation errors fully resolved for faster development cycles

**Accessibility Implementation**
- WCAG 2.1 AA compliance with automated testing
- Comprehensive keyboard navigation support
- Screen reader optimization with proper ARIA labels
- Color contrast validation (4.5:1 ratio minimum)
- Focus management and skip links

### 📊 UX Testing & Quality Assurance

**Comprehensive Test Suite**
- **Accessibility Tests**: Keyboard navigation, screen reader compatibility, color contrast
- **Usability Tests**: Task completion, user flow validation, error handling
- **Performance Tests**: Render times, interaction responsiveness, memory usage
- **Visual Tests**: Design consistency, responsive behavior, animation quality
- **Integration Tests**: AI system workflows, personalization effectiveness

**Quality Metrics**
- 15+ automated UX test cases covering all enhancement areas
- Performance budgets enforced in CI/CD pipeline
- Accessibility validation with jest-axe and manual testing
- User journey validation across all personalization levels

## 🔒 Hybrid Local-First Sync Architecture

### Overview

ScienceHabits implements a privacy-first, local-first architecture that works seamlessly offline while providing optional multi-device synchronization through encrypted cloud storage.

### Key Principles

**🔐 Privacy First**
- All data is encrypted client-side using AES-GCM encryption
- Privacy-preserving user IDs generated via PBKDF2
- No plaintext data ever leaves your device
- EU-compliant hosting options available

**📱 Local First**
- Fully functional without internet connection
- Data stored locally in IndexedDB with Dexie
- Instant responses and offline capability
- Sync when connected, work when disconnected

**🌍 Multi-Cloud Support**
- **NextCloud**: Self-hosted or managed, maximum privacy control
- **Google Cloud Storage**: Use your existing infrastructure
- **Local Only**: Complete offline mode for maximum privacy

### Supported Cloud Providers

#### NextCloud (Privacy-Focused)
- **Complete data control**: Self-host or choose GDPR-compliant providers
- **EU hosting available**: Meet European data protection requirements
- **Open source transparency**: No vendor lock-in
- **WebDAV protocol**: Standard, reliable synchronization
- **App password authentication**: Secure, dedicated credentials

#### Google Cloud Storage (Convenience-Focused)
- **High reliability**: Google's global infrastructure
- **Easy setup**: Use existing Google Cloud projects
- **OAuth2 integration**: Secure authentication flow
- **Global availability**: Fast sync worldwide
- **Cost-effective**: Pay only for storage used

### Security & Encryption

**Client-Side Encryption**
```typescript
// All data encrypted before cloud storage
interface EncryptedData {
  data: number[];           // AES-GCM encrypted content
  iv: number[];            // Initialization vector
  timestamp: number;       // Encryption timestamp
  context: string;         // Data type context
  version: string;         // Encryption version
}
```

**Key Features**
- **AES-GCM encryption**: 256-bit keys with authenticated encryption
- **PBKDF2 key derivation**: 100,000 iterations for password security
- **Per-user encryption**: Each user has unique encryption keys
- **Backup key generation**: Recovery options for lost passwords
- **Device-specific keys**: Additional security layer per device

### Device Management

**Multi-Device Support**
- Automatic device registration and identification
- Device naming and management interface
- Cross-device habit synchronization
- Device activity tracking and management

**Device Types Supported**
- **Desktop**: Windows, macOS, Linux
- **Mobile**: iOS Safari, Android Chrome
- **Tablet**: iPad, Android tablets
- **Progressive Web App**: Install on any platform

### Connection Testing

**Comprehensive Validation**
- **Connection test**: Network connectivity and server accessibility
- **Authentication test**: Credentials validation and permissions
- **File operations test**: Upload, download, and delete operations
- **Storage quota check**: Available space and usage monitoring

### Technical Implementation

**Authentication System**
```typescript
interface User {
  userId: string;           // PBKDF2-derived from email
  email: string;           // User identifier
  emailHash: string;       // Privacy-preserving lookup
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
  abstract listFiles(directory: string): Promise<FileMetadata[]>;
  abstract checkConnection(): Promise<boolean>;
  abstract authenticate(): Promise<boolean>;
}
```

**File Structure**
```
User Data/
├── habits/              # Habit definitions and settings
├── progress/            # Completion data and analytics
├── reminders/           # Notification preferences
├── research/            # Saved articles and notes
├── goals/              # User goals and preferences
└── devices/            # Device management data
```

## 📊 Non-Daily Habit Tracking System

### Overview

ScienceHabits supports sophisticated habit tracking beyond daily routines, enabling users to track habits with various frequencies and patterns:

### Supported Habit Types

**🗓️ Daily Habits**
- Traditional daily habits (default behavior)
- Streak tracking and completion analytics
- Time-based reminders with user preference learning

**📅 Weekly Goals** 
- Flexible weekly targets (e.g., "3 times per week")
- Session counting with preferred days
- Smart distribution across the week
- Progress visualization and deficit tracking

**📆 Periodic Habits**
- Quarterly habits (every 3 months)
- Yearly habits (annual goals)
- Custom interval support
- Due date tracking and overdue notifications

### Technical Implementation

**Database Schema (Dexie v3)**
```typescript
interface HabitFrequency {
  type: 'daily' | 'weekly' | 'periodic' | 'custom';
  weeklyTarget?: {
    sessionsPerWeek: number;
    preferredDays?: string[];
    allowFlexibleDays?: boolean;
  };
  periodicTarget?: {
    interval: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    intervalCount: number;
    nextDueDate?: string;
  };
}
```

**Intelligent Reminder System**
- Completion pattern analysis for personalized timing
- Frequency-aware notification scheduling
- Priority-based reminders (urgent for weekly goals near deadline)
- Browser notification integration with permission management

**Progress Tracking**
- Weekly progress objects with session counting
- Frequency-aware streak calculations
- Goal completion percentage tracking
- Historical trend analysis

## 🏗️ Architecture

### Technology Stack

**Frontend Framework**
- **React 19.1.1** - UI library with concurrent features
- **TypeScript 4.9.5** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling (via Headless UI)

**State Management**
- **Zustand** - Lightweight state management
- **IndexedDB (Dexie)** - Client-side persistence
- **React Context** - Component-level state

**Testing & Quality**
- **Jest + React Testing Library** - Unit/integration testing
- **Cypress** - End-to-end testing
- **jest-axe** - Accessibility testing
- **ESLint + Prettier** - Code quality

**Build & Deployment**
- **React Scripts** - Build tooling
- **GitHub Actions** - CI/CD pipeline
- **PWA** - Progressive Web App capabilities

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── auth/           # Authentication & sync UI
│   │   ├── OnboardingFlow.tsx      # Complete user onboarding
│   │   ├── CloudProviderSelector.tsx # Provider selection
│   │   ├── DeviceManagement.tsx    # Multi-device management
│   │   └── ConnectionTester.tsx    # Cloud connection testing
│   ├── dashboard/      # Dashboard views
│   │   └── SmartDailyDashboard.tsx  # AI-powered daily interface
│   ├── onboarding/     # User onboarding flow
│   │   ├── ProgressiveGoalSelector.tsx    # Goal-based recommendations
│   │   ├── PersonalizationPreview.tsx     # Habit preview system
│   │   └── OnboardingProgressTracker.tsx  # 4-phase progress tracking
│   ├── habits/         # Enhanced habit management
│   │   └── EnhancedHabitCard.tsx    # Rich contextual habit cards
│   ├── research/       # Research articles
│   ├── analytics/      # Progress analytics
│   ├── reminders/      # Reminder system UI
│   ├── visualization/  # Enhanced progress visualization
│   │   └── EnhancedProgressVisualization.tsx # Interactive charts & heatmaps
│   ├── progress/       # Progress communication
│   │   └── EnhancedProgressCommunication.tsx # Narrative progress stories
│   ├── motivation/     # Motivational messaging
│   │   └── MotivationalMessagingSystem.tsx   # AI-powered encouragement
│   ├── personalization/ # Personalization controls
│   │   └── PersonalizationDepthSettings.tsx  # 4-tier customization
│   ├── recovery/       # Recovery support system
│   │   └── [recovery components]     # Compassionate support interfaces
│   └── testing/        # UX testing suite
│       └── UXTestSuite.tsx          # Comprehensive test interface
├── stores/             # Zustand state stores
├── hooks/              # Custom React hooks
├── services/           # API and data services
│   ├── auth/           # Authentication services
│   │   ├── UserAuthentication.ts   # User auth & sessions
│   │   └── DeviceManager.ts        # Multi-device management
│   ├── sync/           # Cloud synchronization
│   │   ├── CloudProvider.ts        # Abstract base class
│   │   ├── NextCloudProvider.ts    # NextCloud WebDAV client
│   │   ├── GoogleCloudProvider.ts  # Google Cloud Storage client
│   │   ├── CloudProviderFactory.ts # Provider instantiation
│   │   └── E2EEncryption.ts        # Client-side encryption
│   ├── storage/        # Database and persistence
│   ├── reminderService # Notification system
│   ├── smartSchedulingService.ts       # AI-powered scheduling
│   ├── adaptiveDifficultyService.ts    # Difficulty optimization
│   ├── contextualResearchService.ts    # Research insights
│   ├── recoveryService.ts              # Proactive recovery
│   └── recoveryHabitSuggestionService.ts # Recovery habits
├── contexts/           # React context providers
├── utils/              # Helper functions
│   ├── frequencyHelpers     # Non-daily habit logic
│   ├── weeklyGoalHelpers    # Weekly tracking
│   └── reminderHelpers      # Intelligent notifications
├── types/              # TypeScript definitions
│   └── sync.ts         # Sync system type definitions
├── data/               # Static data files
└── __tests__/          # Test utilities and fixtures

cypress/                # E2E tests
├── e2e/               # End-to-end scenarios
├── support/           # Custom commands
└── fixtures/          # Test data

.github/workflows/     # CI/CD automation
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes with tests
4. **Run** the test suite (`npm test`)
5. **Commit** with conventional commits (`git commit -m 'feat: add amazing feature'`)
6. **Push** to your branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Commit Convention

We use [Conventional Commits](https://conventionalcommits.org/):

```
feat: add new habit tracking feature
fix: resolve progress calculation bug
docs: update API documentation
test: add unit tests for habit store
```

### Code Quality Standards

- **Test Coverage**: Maintain >80% coverage
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Lighthouse score >90
- **Type Safety**: No TypeScript errors
- **Linting**: ESLint rules must pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Research Community**: For evidence-based habit formation insights
- **Accessibility Experts**: For inclusive design guidance
- **Open Source Community**: For the amazing tools and libraries
- **Contributors**: For making this project possible

---

<div align="center">
  <strong>Built with ❤️ for sustainable behavior change</strong>
  <br>
  <a href="https://sciencehabits.app">🌐 Website</a> •
  <a href="https://docs.sciencehabits.app">📚 Docs</a> •
  <a href="https://github.com/sciencehabits/app/issues">🐛 Report Bug</a> •
  <a href="https://github.com/sciencehabits/app/discussions">💬 Discussions</a>
</div>
🤖 Android APK Pipeline Ready!
🤖 Android APK Pipeline Ready!
✅ Ready for deployment
