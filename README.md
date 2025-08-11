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

## ✨ Features

### 🎯 **Core Features**
- **Personalized Onboarding**: Goal-based habit recommendations
- **Daily Habit Tracking**: Simple, engaging completion interface
- **Progress Analytics**: Comprehensive streak and performance tracking
- **Research Integration**: Science-backed habit explanations
- **Offline Capability**: Full PWA functionality

### 🔬 **Advanced Features**
- **Modular Content System**: Dynamic habit and research loading
- **Goal-based Filtering**: Personalized content recommendations
- **Premium Analytics**: Advanced progress insights (planned)
- **Data Export**: Progress data in multiple formats (premium)
- **Cross-device Sync**: Account-based synchronization (planned)

### ♿ **Accessibility & Quality**
- **WCAG 2.1 AA Compliant**: Full accessibility support
- **Responsive Design**: Mobile-first, works on all devices
- **Performance Optimized**: Lighthouse score > 90
- **Type-Safe**: Full TypeScript implementation
- **Comprehensive Testing**: Unit, integration, E2E, and a11y tests

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
npm run cypress:open       # Interactive E2E tests
npm run cypress:run        # Headless E2E tests

# Code Quality
npm run lint               # ESLint
npm run lint:fix          # Auto-fix linting issues
npm run type-check        # TypeScript validation
npm run format            # Prettier formatting
```

## 🧪 Testing

We maintain comprehensive test coverage across multiple dimensions:

### Test Types
- **Unit Tests**: Component behavior and logic
- **Integration Tests**: Cross-component workflows
- **E2E Tests**: Complete user journeys
- **Accessibility Tests**: WCAG compliance
- **Performance Tests**: Lighthouse CI
- **Security Tests**: Dependency scanning

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

# Smoke tests
npm run test:smoke
```

### Continuous Integration

Our GitHub Actions pipeline runs:
- ✅ Linting and type checking
- ✅ Unit and integration tests
- ✅ Accessibility compliance testing
- ✅ Multi-browser E2E tests (Chrome, Firefox, Edge)
- ✅ Performance testing with Lighthouse
- ✅ Security vulnerability scanning
- ✅ Deployment to staging/production

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
│   ├── dashboard/      # Dashboard views
│   ├── onboarding/     # User onboarding flow
│   ├── habits/         # Habit management
│   ├── research/       # Research articles
│   └── analytics/      # Progress analytics
├── stores/             # Zustand state stores
├── hooks/              # Custom React hooks
├── services/           # API and data services
├── utils/              # Helper functions
├── types/              # TypeScript definitions
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
