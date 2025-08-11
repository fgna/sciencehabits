# ScienceHabits - Developer Documentation

## Overview

ScienceHabits is a React-based Progressive Web App (PWA) for science-backed habit tracking. The app provides users with evidence-based habit recommendations, progress tracking, and research insights to build sustainable behavioral changes.

## Core Features

### 🎯 Goal-Based Personalization
- Users select from predefined goals during onboarding
- Habits are recommended based on selected goals
- Research articles are filtered by user goals for personalized content

### 📊 Habit Tracking
- Daily habit completion tracking with streak counters
- Visual progress indicators and completion percentages
- Support for both science-backed and custom habits
- Collapsible instructions and research details for each habit

### 📚 Research Integration
- Curated research articles linked to habits
- Goal-based filtering of research content
- Evidence levels and study details for transparency
- Direct navigation from habit cards to related research

### 📈 Progress Analytics
- Completion streaks and statistics
- Daily, weekly, and monthly progress views
- Visual charts and progress indicators

## Architecture

### Tech Stack
- **Frontend**: React 18.2.0 with TypeScript 4.9.5
- **State Management**: Zustand for global state
- **Data Persistence**: IndexedDB with Dexie
- **Styling**: Tailwind CSS
- **Build Tool**: Create React App with Webpack
- **PWA**: Service workers for offline functionality

### Key Design Patterns
- **Component-based architecture** with shared UI components
- **Custom hooks** for date management and current time
- **Context providers** for research data management
- **Event-driven navigation** between tabs using custom events

## Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components (Button, Card, etc.)
│   ├── dashboard/       # Main app views (Today, Progress, etc.)
│   ├── habits/          # Habit management components
│   ├── onboarding/      # User setup flow
│   ├── profile/         # User profile management
│   ├── analytics/       # Progress tracking views
│   └── research/        # Research articles display
├── stores/              # Zustand state management
│   ├── userStore.ts     # User data, habits, progress
│   └── habitStore.ts    # Habit CRUD operations
├── contexts/            # React contexts
│   └── ResearchContext.tsx  # Research articles management
├── hooks/               # Custom React hooks
│   └── useCurrentDate.ts    # Date/time utilities
├── data/                # Static data files
│   ├── habits.json      # Basic habit definitions
│   ├── enhanced_habits.json  # Enhanced habit data
│   ├── research_articles.json  # Research content
│   └── goals.json       # Goal definitions and tiers
├── types/               # TypeScript interfaces
└── utils/               # Utility functions
```

## Data Models

### User Interface
```typescript
interface User {
  id: string;
  name?: string;
  goals: string[];
  dailyMinutes: number;
  preferredTime: 'morning' | 'lunch' | 'evening' | 'flexible';
  lifestyle: 'professional' | 'parent' | 'student';
  language: 'en' | 'de';
  trial: { hasUsedTrial: boolean; isActive: boolean; };
  isPremium: boolean;
}
```

### Habit Interface
```typescript
interface Habit {
  id: string;
  title: string;
  description: string;
  timeMinutes: number;
  category: string;
  goalTags: string[];
  instructions: string;
  researchIds: string[];
  isCustom: boolean;
  difficulty: 'trivial' | 'easy' | 'moderate' | 'beginner' | 'intermediate' | 'advanced';
  // Enhanced fields
  effectivenessScore?: number;
  evidenceStrength?: 'very_high' | 'high' | 'moderate' | 'low';
  whyEffective?: string;
  cost?: string;
}
```

### Progress Tracking
```typescript
interface Progress {
  id: string; // composite: userId:habitId
  userId: string;
  habitId: string;
  dateStarted: string;
  completions: string[]; // ISO date strings
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}
```

## Key Features Implementation

### 1. Goal-Based System
- **Configuration**: `src/data/goals.json` defines available goals with premium tiers
- **Onboarding**: Users select goals during setup, stored in user profile
- **Filtering**: Habits and research filtered based on user's selected goals
- **Premium Features**: Advanced goals require premium subscription

### 2. Habit Recommendations
- **Basic Habits**: Defined in `src/data/habits.json` with basic fields
- **Enhanced Habits**: Extended data in `src/data/enhanced_habits.json` with effectiveness scores, costs, suppliers
- **Matching Logic**: Habits shown based on goal tags alignment with user goals
- **Custom Habits**: Users can create personalized habits via forms

### 3. Progress Tracking
- **Daily Completion**: Click-to-complete interface with immediate visual feedback
- **Streak Calculation**: Automatic streak computation with longest streak tracking
- **Persistence**: All progress stored locally in IndexedDB for offline access
- **Visual Indicators**: Progress bars, completion percentages, and streak counters

### 4. Research Integration
- **Article Database**: Curated research articles in `src/data/research_articles.json`
- **Habit Linking**: Articles linked to habits via `relatedHabits` field
- **Goal Filtering**: Articles filtered by user goals for personalized research
- **Navigation**: Direct links from habit details to related research articles

## State Management

### UserStore (Zustand)
- **User Profile**: Authentication, goals, preferences
- **User Habits**: List of active habits for current user
- **Progress Data**: All completion tracking and statistics
- **CRUD Operations**: Add/remove habits, update progress

### HabitStore (Zustand)
- **Custom Habits**: User-created habit management
- **Edit Operations**: Modify custom habit properties
- **Validation**: Form validation and error handling

### ResearchContext
- **Article Loading**: Fetch and cache research articles
- **Filtering Logic**: Goal-based and search-based filtering
- **Related Articles**: Find articles related to specific habits

## Navigation & User Flow

### App Structure
1. **Onboarding**: Goal selection, lifestyle setup, habit recommendations
2. **Dashboard**: 4-tab interface (Today, My Habits, Progress, Research)
3. **Today Tab**: Daily habit checklist with completion tracking
4. **My Habits**: Full habit library with create/edit capabilities
5. **Progress Tab**: Analytics, streaks, and historical data
6. **Research Tab**: Filtered articles with goal-based personalization

### Inter-Component Communication
- **Custom Events**: Navigation between tabs using `window.dispatchEvent`
- **Shared State**: Global state via Zustand stores
- **Context Providers**: Research data shared via React context

## Data Persistence

### IndexedDB Storage
- **User Data**: Profile, preferences, goals
- **Habits**: Both system and custom habits
- **Progress**: All completion tracking data
- **Offline Support**: Full functionality without network connection

### Data Migration
- Automatic schema updates for backward compatibility
- User data preserved across app updates
- Fallback to default data if corruption detected

## Development Guidelines

### Component Structure
- **Functional Components**: All components use React hooks
- **TypeScript**: Strict typing for all props and state
- **Modular Design**: Small, focused components with single responsibilities
- **Reusable UI**: Shared components in `src/components/ui/`

### State Management Patterns
- **Local State**: Component-specific state with `useState`
- **Global State**: Shared data via Zustand stores
- **Derived State**: Computed values using selectors
- **Side Effects**: API calls and persistence in store actions

### Styling Approach
- **Tailwind CSS**: Utility-first styling throughout
- **Component Variants**: Consistent button, card, and form styles
- **Responsive Design**: Mobile-first with desktop enhancements
- **Dark Mode**: Not implemented yet, but prepared with CSS variables

## Performance Considerations

### Optimization Strategies
- **Code Splitting**: Route-based lazy loading (not yet implemented)
- **Memoization**: React.memo for expensive renders
- **Efficient Filtering**: Optimized goal-based filtering logic
- **Local Storage**: IndexedDB for fast data access

### Bundle Size
- Current production build: ~500KB gzipped
- Main dependencies: React, Zustand, Dexie, Tailwind
- Future optimization: Tree shaking, code splitting by route

## Testing Strategy

### Current State
- **Manual Testing**: Extensive user flow testing
- **Browser Testing**: Chrome, Firefox, Safari compatibility
- **Mobile Testing**: iOS and Android PWA installation

### Recommended Additions
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: User flow automation
- **E2E Tests**: Cypress for critical paths
- **Accessibility Testing**: Screen reader compatibility

## Deployment & Build

### Build Process
```bash
npm run build          # Production build
npm run start          # Development server
npm run test           # Run tests (when added)
```

### PWA Features
- **Service Worker**: Automatic caching for offline use
- **Installable**: Add to home screen on mobile devices
- **Responsive**: Works across all device sizes
- **Fast Loading**: Optimized assets and lazy loading

### Environment Setup
- **Node.js**: 16+ required
- **Package Manager**: npm (package-lock.json committed)
- **Browser Requirements**: Modern browsers with ES2018+ support

## Common Development Tasks

### Adding New Goals
1. Update `src/data/goals.json` with new goal definition
2. Add goal to premium/free tier as needed
3. Update habit `goalTags` to include new goal
4. Test onboarding flow with new goal

### Creating New Habits
1. Add to `src/data/habits.json` (basic) or `src/data/enhanced_habits.json`
2. Set appropriate `goalTags` for recommendation logic
3. Add research articles with matching `relatedHabits` field
4. Test habit appears for correct user goals

### Adding Research Articles
1. Add article to `src/data/research_articles.json`
2. Set `relatedHabits` field to link with habits
3. Add appropriate tags and category for goal filtering
4. Verify article appears in research tab and habit details

### Modifying UI Components
1. Update shared components in `src/components/ui/`
2. Use TypeScript interfaces for all props
3. Follow existing Tailwind CSS patterns
4. Test responsive design on multiple screen sizes

## Known Issues & Technical Debt

### Current Limitations
- **No Authentication**: Uses localStorage user ID (suitable for MVP)
- **No Backend**: All data stored locally (limitation for multi-device sync)
- **No Tests**: Manual testing only (needs test suite)
- **Limited Error Handling**: Basic error states (needs improvement)

### Future Enhancements
- **Backend Integration**: User accounts, cloud sync
- **Social Features**: Sharing, community challenges
- **Advanced Analytics**: Detailed progress insights
- **Notifications**: Reminder system for habits
- **Export Features**: Data export, progress reports

## Getting Started as a New Developer

### Setup Instructions
1. **Clone Repository**: `git clone [repository-url]`
2. **Install Dependencies**: `npm install`
3. **Start Development**: `npm start`
4. **Open Browser**: Navigate to `http://localhost:3000`

### Understanding the Codebase
1. **Start with Types**: Review `src/types/index.ts` for data models
2. **Explore Components**: Look at `src/components/dashboard/TodayView.tsx` for main interface
3. **Study State Management**: Examine `src/stores/userStore.ts` for data flow
4. **Review Data Structure**: Check JSON files in `src/data/` for content format

### Development Workflow
1. **Feature Branch**: Create feature branches from main
2. **Component Development**: Build new features as isolated components
3. **Type Safety**: Ensure all code passes TypeScript checks
4. **Manual Testing**: Test user flows before committing
5. **Code Review**: Review changes for performance and maintainability

## Support & Resources

### Documentation
- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Zustand**: https://github.com/pmndrs/zustand
- **Dexie**: https://dexie.org/

### Architecture Decisions
- **PWA Choice**: Offline-first design for habit tracking reliability
- **No Backend**: Simplified deployment and privacy (user data stays local)
- **IndexedDB**: Robust storage for complex data relationships
- **Goal-Based Design**: Personalization without algorithmic complexity

This app represents a complete habit tracking solution with research integration, built for scalability and user privacy. The architecture supports both individual use and future expansion to multi-user scenarios.