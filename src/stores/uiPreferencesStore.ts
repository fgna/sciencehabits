import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UIPreferences {
  // Layout preferences
  layoutMode: 'simplified' | 'enhanced';
  
  // Accessibility preferences
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'normal' | 'large' | 'extra-large';
  
  // User experience preferences
  animationsEnabled: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  
  // Theme preferences
  colorScheme: 'auto' | 'light' | 'dark';
  emotionalDesign: 'standard' | 'compassionate' | 'minimal';
  
  // Interaction preferences
  touchTargetSize: 'compact' | 'standard' | 'large';
  gesturesEnabled: boolean;
  
  // Onboarding preferences
  onboardingCompleted: boolean;
  preferredOnboardingDepth: 'quick' | 'standard' | 'detailed';
  
  // Recovery-focused preferences
  compassionMessaging: boolean;
  celebrationStyle: 'subtle' | 'standard' | 'enthusiastic';
}

interface UIPreferencesStore extends UIPreferences {
  // Actions
  setLayoutMode: (mode: UIPreferences['layoutMode']) => void;
  setHighContrast: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setFontSize: (size: UIPreferences['fontSize']) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setColorScheme: (scheme: UIPreferences['colorScheme']) => void;
  setEmotionalDesign: (design: UIPreferences['emotionalDesign']) => void;
  setTouchTargetSize: (size: UIPreferences['touchTargetSize']) => void;
  setGesturesEnabled: (enabled: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setOnboardingDepth: (depth: UIPreferences['preferredOnboardingDepth']) => void;
  setCompassionMessaging: (enabled: boolean) => void;
  setCelebrationStyle: (style: UIPreferences['celebrationStyle']) => void;
  
  // Utility functions
  applyAccessibilityPreferences: () => void;
  detectSystemPreferences: () => void;
  resetToDefaults: () => void;
}

const defaultPreferences: UIPreferences = {
  layoutMode: 'simplified',
  highContrast: false,
  reducedMotion: false,
  fontSize: 'normal',
  animationsEnabled: true,
  soundEnabled: false, // Off by default for accessibility
  hapticsEnabled: true,
  colorScheme: 'auto',
  emotionalDesign: 'compassionate',
  touchTargetSize: 'standard',
  gesturesEnabled: true,
  onboardingCompleted: false,
  preferredOnboardingDepth: 'standard',
  compassionMessaging: true,
  celebrationStyle: 'standard',
};

export const useUIPreferencesStore = create<UIPreferencesStore>()(
  persist(
    (set, get) => ({
      ...defaultPreferences,

      setLayoutMode: (mode) => set({ layoutMode: mode }),

      setHighContrast: (enabled) => {
        set({ highContrast: enabled });
        get().applyAccessibilityPreferences();
      },

      setReducedMotion: (enabled) => {
        set({ reducedMotion: enabled, animationsEnabled: !enabled });
        get().applyAccessibilityPreferences();
      },

      setFontSize: (size) => {
        set({ fontSize: size });
        get().applyAccessibilityPreferences();
      },

      setAnimationsEnabled: (enabled) => {
        set({ animationsEnabled: enabled });
        // If enabling animations, respect reduced motion preference
        if (enabled && get().reducedMotion) {
          set({ animationsEnabled: false });
        }
      },

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
      
      setEmotionalDesign: (design) => set({ emotionalDesign: design }),
      
      setTouchTargetSize: (size) => {
        set({ touchTargetSize: size });
        get().applyAccessibilityPreferences();
      },
      
      setGesturesEnabled: (enabled) => set({ gesturesEnabled: enabled }),
      
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
      
      setOnboardingDepth: (depth) => set({ preferredOnboardingDepth: depth }),
      
      setCompassionMessaging: (enabled) => set({ compassionMessaging: enabled }),
      
      setCelebrationStyle: (style) => set({ celebrationStyle: style }),

      applyAccessibilityPreferences: () => {
        const preferences = get();
        const root = document.documentElement;

        // Apply high contrast
        root.classList.toggle('high-contrast', preferences.highContrast);

        // Apply font size
        root.classList.remove('font-small', 'font-normal', 'font-large', 'font-extra-large');
        root.classList.add(`font-${preferences.fontSize}`);

        // Apply touch target size
        root.classList.remove('touch-compact', 'touch-standard', 'touch-large');
        root.classList.add(`touch-${preferences.touchTargetSize}`);

        // Apply reduced motion
        if (preferences.reducedMotion) {
          root.style.setProperty('--animation-duration', '0ms');
          root.style.setProperty('--transition-duration', '0ms');
        } else {
          root.style.removeProperty('--animation-duration');
          root.style.removeProperty('--transition-duration');
        }
      },

      detectSystemPreferences: () => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

        set((state) => ({
          colorScheme: state.colorScheme === 'auto' ? (prefersDark ? 'dark' : 'light') : state.colorScheme,
          reducedMotion: prefersReducedMotion || state.reducedMotion,
          highContrast: prefersHighContrast || state.highContrast,
          animationsEnabled: !prefersReducedMotion && state.animationsEnabled,
        }));

        get().applyAccessibilityPreferences();
      },

      resetToDefaults: () => {
        set(defaultPreferences);
        get().applyAccessibilityPreferences();
      },
    }),
    {
      name: 'sciencehabits-ui-preferences',
      version: 1,
    }
  )
);

// Initialize system preferences detection on store creation
if (typeof window !== 'undefined') {
  const store = useUIPreferencesStore.getState();
  
  // Detect initial system preferences
  store.detectSystemPreferences();
  
  // Listen for system preference changes
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const contrastMediaQuery = window.matchMedia('(prefers-contrast: high)');

  darkModeMediaQuery.addEventListener('change', store.detectSystemPreferences);
  motionMediaQuery.addEventListener('change', store.detectSystemPreferences);
  contrastMediaQuery.addEventListener('change', store.detectSystemPreferences);
}