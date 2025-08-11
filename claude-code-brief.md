# ScienceHabits - Claude Code Development Brief

*Progressive Web App for Science-Backed Habit Coaching*

## 🎯 QUICK START FOR CLAUDE CODE

### Project Setup Command
```bash
npm create react-app sciencehabits --template typescript
cd sciencehabits
npm install @tailwindcss/forms @headlessui/react zustand dexie react-i18next
```

### Key Files to Create First
1. `src/types/index.ts` - All TypeScript interfaces
2. `src/services/storage/database.ts` - IndexedDB setup
3. `src/data/habits.json` - Initial habit data
4. `src/components/ui/` - Reusable components

---

## 📋 DEVELOPMENT CHECKLIST

### Phase 1: Foundation (Week 1-2)
- [ ] **Setup**: React + TypeScript + Tailwind configuration
- [ ] **Database**: IndexedDB schema and initial data loading
- [ ] **Types**: Complete TypeScript interfaces
- [ ] **UI Foundation**: Layout, navigation, basic components
- [ ] **Onboarding Flow**: User setup and habit recommendations

### Phase 2: Core Features (Week 3-4)
- [ ] **Habit Tracking**: Daily check-ins and progress display
- [ ] **Custom Habits**: Creation form and storage
- [ ] **Research Integration**: Study citations and summaries
- [ ] **Dashboard**: Main interface and today view

### Phase 3: Premium Features (Week 5-6)
- [ ] **AI Integration**: Mistral API for custom goals
- [ ] **Trial System**: Feature gating and conversion flow
- [ ] **Premium UI**: Upgrade prompts and billing prep

### Phase 4: Polish (Week 7-8)
- [ ] **PWA**: Service worker and offline functionality
- [ ] **Performance**: Optimization and error handling
- [ ] **Content**: Populate research database
- [ ] **Testing**: User flows and edge cases

---

## 🏗️ TECHNICAL ARCHITECTURE

### Core Stack
```typescript
// Required dependencies
{
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.3.0",
  "zustand": "^4.4.0",
  "dexie": "^3.2.0",
  "react-i18next": "^13.0.0"
}
```

### File Structure
```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── onboarding/      # Setup flow components
│   ├── habits/          # Habit-related components
│   └── dashboard/       # Main app interface
├── services/
│   ├── storage/         # IndexedDB and data management
│   ├── ai/             # Mistral API integration
│   └── analytics/       # Usage tracking (privacy-first)
├── stores/             # Zustand state management
├── types/              # TypeScript definitions
├── data/               # JSON data files
├── hooks/              # Custom React hooks
└── utils/              # Helper functions
```

### Data Models (Copy-Paste Ready)
```typescript
// src/types/index.ts
export interface User {
  id: string;
  createdAt: string;
  goals: string[];
  dailyMinutes: number;
  preferredTime: 'morning' | 'lunch' | 'evening' | 'flexible';
  lifestyle: 'professional' | 'parent' | 'student';
  language: 'en' | 'de';
  trial: {
    hasUsedTrial: boolean;
    isActive: boolean;
    startDate?: string;
    endDate?: string;
  };
  isPremium: boolean;
}

export interface Habit {
  id: string;
  title: string;
  description: string;
  timeMinutes: number;
  category: 'stress' | 'productivity' | 'health' | 'energy' | 'sleep';
  goalTags: string[];
  lifestyleTags: string[];
  timeTags: string[];
  instructions: string;
  researchIds: string[];
  isCustom: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: 'none' | 'minimal' | 'equipment';
}

export interface Progress {
  userId: string;
  habitId: string;
  dateStarted: string;
  completions: string[];
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}

export interface ResearchStudy {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  summary: string;
  finding: string;
  sampleSize: number;
  studyType: string;
  category: string;
  habitCategories: string[];
  credibilityTier: 'high' | 'medium' | 'low';
  fullCitation: string;
}
```

---

## 🔧 IMPLEMENTATION PRIORITIES

### Critical Path Features
1. **User Onboarding** (Essential for MVP)
2. **Habit Recommendations** (Rules-based, no AI needed initially)
3. **Progress Tracking** (Core value proposition)
4. **Custom Habits** (Differentiation from competitors)
5. **Research Display** (Trust and credibility)

### Nice-to-Have Features
- AI custom goals (Premium feature)
- Advanced analytics
- Social sharing
- Export functionality

### Must-Have Quality Standards
- **Performance**: <3s initial load, <1s navigation
- **Reliability**: Works offline, data persistence
- **Privacy**: Local storage, no tracking
- **Accessibility**: WCAG 2.1 AA compliance

---

## 📊 SAMPLE DATA STRUCTURE

### Initial Habits (Copy-Paste Ready)
```json
// src/data/habits.json
[
  {
    "id": "breathing_5min",
    "title": "5-Minute Deep Breathing",
    "description": "Calm your nervous system with evidence-based breathing exercises",
    "timeMinutes": 5,
    "category": "stress",
    "goalTags": ["reduce_stress", "increase_focus"],
    "lifestyleTags": ["professional", "parent", "student"],
    "timeTags": ["morning", "lunch", "evening", "flexible"],
    "instructions": "1. Sit comfortably with feet flat on floor\n2. Breathe in for 4 counts\n3. Hold for 4 counts\n4. Exhale for 6 counts\n5. Repeat for 5 minutes",
    "researchIds": ["study_001", "study_002"],
    "isCustom": false,
    "difficulty": "beginner",
    "equipment": "none"
  },
  {
    "id": "gratitude_2min",
    "title": "2-Minute Gratitude Practice",
    "description": "Boost mood and life satisfaction with daily gratitude",
    "timeMinutes": 2,
    "category": "productivity",
    "goalTags": ["improve_mood", "reduce_stress"],
    "lifestyleTags": ["professional", "parent", "student"],
    "timeTags": ["morning", "evening"],
    "instructions": "1. Think of 3 specific things you're grateful for today\n2. Write them down or say them aloud\n3. Focus on why each matters to you\n4. Notice the feeling of appreciation",
    "researchIds": ["study_003"],
    "isCustom": false,
    "difficulty": "beginner",
    "equipment": "none"
  }
]
```

### Sample Research Studies
```json
// src/data/research.json
[
  {
    "id": "study_001",
    "title": "Effects of Deep Breathing on Stress and Anxiety",
    "authors": "Zaccaro, A. et al.",
    "year": 2018,
    "journal": "Frontiers in Psychology",
    "summary": "Deep breathing exercises significantly reduce stress hormones and anxiety levels in just 5 minutes.",
    "finding": "Cortisol levels decreased by 23% after 5-minute breathing session",
    "sampleSize": 120,
    "studyType": "randomized_controlled_trial",
    "category": "stress_management",
    "habitCategories": ["stress"],
    "credibilityTier": "high",
    "fullCitation": "Zaccaro, A., Piarulli, A., Laurino, M., et al. (2018). How breath-control can change your life: a systematic review on psycho-physiological correlates of slow breathing. Frontiers in Psychology, 9, 353."
  }
]
```

---

## 🚀 MVP SUCCESS CRITERIA

### User Experience
- [ ] User can complete onboarding in <2 minutes
- [ ] Receives 3 relevant habit recommendations
- [ ] Can track progress for 1 week successfully
- [ ] Understands research backing for each habit

### Technical Performance
- [ ] App loads in <3 seconds on mobile
- [ ] Works offline after initial load
- [ ] No data loss during session
- [ ] Responsive on all screen sizes

### Business Validation
- [ ] 70%+ onboarding completion rate
- [ ] 60%+ daily habit completion rate
- [ ] 50%+ 7-day retention rate
- [ ] Clear path to premium features

---

## 💡 DEVELOPMENT TIPS FOR CLAUDE CODE

### Start With
1. Create the TypeScript interfaces first
2. Set up IndexedDB schema and test data loading
3. Build the onboarding flow (highest user impact)
4. Implement habit recommendation logic (rules-based)

### Focus On
- **Simple, working features** over complex ones
- **Local data storage** for privacy compliance
- **Mobile-first responsive design**
- **Clear user feedback** for all actions

### Avoid
- Complex state management initially
- External API dependencies for core features
- Over-engineering the data layer
- Feature creep in MVP phase

### Testing Strategy
- Manual testing on mobile devices
- Local storage persistence across sessions
- Offline functionality
- Form validation and error states

---

## 📱 PWA REQUIREMENTS

### Essential PWA Features
```json
// public/manifest.json
{
  "name": "ScienceHabits",
  "short_name": "ScienceHabits",
  "description": "Science-backed habits for your real life",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a202c",
  "theme_color": "#667eea",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker Goals
- Cache app shell for offline access
- Background sync for habit completions
- Push notifications for habit reminders (optional)

---

## 🎨 UI/UX GUIDELINES

### Design System
- **Colors**: Tailwind's blue and purple palette
- **Typography**: Inter font family
- **Components**: Headless UI for accessibility
- **Spacing**: Consistent 4px grid system

### Key User Flows
1. **First-time user**: Setup → Recommendations → First habit completion
2. **Daily user**: Quick check-in → Progress view → Tomorrow's habits
3. **Exploring user**: Research view → Custom habit creation → Trial signup

### Mobile-First Design
- Touch-friendly buttons (minimum 44px)
- Thumb-accessible navigation
- Clear visual hierarchy
- Minimal text input requirements

---

## Ready to Start Development!

**Next Action**: Begin with TypeScript interfaces and IndexedDB setup, then move to the onboarding flow. This brief provides everything needed for Claude Code to build a production-ready MVP.

**Questions for Claude Code**: Focus on clarifying any technical implementation details or requesting specific code examples for complex features.

