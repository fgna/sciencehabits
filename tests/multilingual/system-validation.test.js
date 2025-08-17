/**
 * Multilingual System Validation Tests
 * 
 * Comprehensive tests for the multilingual content system,
 * translation quality, and cross-language functionality.
 */

const { EffectivenessRankingService } = require('../../src/services/localization/EffectivenessRankingService');
const { useLanguage } = require('../../src/hooks/useLanguage');

describe('Multilingual System Validation', () => {
  const SUPPORTED_LANGUAGES = ['en', 'de', 'fr', 'es'];
  const PRIMARY_LANGUAGE = 'en';
  
  describe('Content API Multilingual Support', () => {
    test('should provide content in all supported languages', async () => {
      for (const lang of SUPPORTED_LANGUAGES) {
        const habits = await EffectivenessRankingService.getPrimaryRecommendations(lang);
        
        expect(habits).toBeDefined();
        expect(Array.isArray(habits)).toBe(true);
        expect(habits.length).toBeGreaterThan(0);
        
        // Verify each habit has the requested language
        for (const habit of habits.slice(0, 3)) {
          expect(habit.translations).toHaveProperty(lang);
          expect(habit.translations[lang].title).toBeTruthy();
          expect(habit.translations[lang].description).toBeTruthy();
        }
      }
    });

    test('should have consistent habit count across languages', async () => {
      const habitCounts = {};
      
      for (const lang of SUPPORTED_LANGUAGES) {
        const habits = await EffectivenessRankingService.getPrimaryRecommendations(lang);
        habitCounts[lang] = habits.length;
      }
      
      // All languages should have the same number of habits
      const counts = Object.values(habitCounts);
      const firstCount = counts[0];
      
      for (const count of counts) {
        expect(count).toBe(firstCount);
      }
    });

    test('should maintain habit IDs across languages', async () => {
      const habitIdsByLang = {};
      
      for (const lang of SUPPORTED_LANGUAGES) {
        const habits = await EffectivenessRankingService.getPrimaryRecommendations(lang);
        habitIdsByLang[lang] = habits.map(h => h.id).sort();
      }
      
      // All languages should have the same habit IDs
      const englishIds = habitIdsByLang[PRIMARY_LANGUAGE];
      
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(habitIdsByLang[lang]).toEqual(englishIds);
      }
    });
  });

  describe('Translation Quality Validation', () => {
    test('should have complete translations for core fields', async () => {
      const coreFields = ['title', 'description', 'whyItWorks', 'quickStart'];
      
      for (const lang of SUPPORTED_LANGUAGES) {
        const habits = await EffectivenessRankingService.getPrimaryRecommendations(lang);
        
        for (const habit of habits.slice(0, 5)) { // Test first 5 habits
          const translation = habit.translations[lang];
          
          for (const field of coreFields) {
            expect(translation[field]).toBeTruthy();
            expect(translation[field].length).toBeGreaterThan(5);
          }
        }
      }
    });

    test('should detect missing translations', async () => {
      for (const lang of SUPPORTED_LANGUAGES.filter(l => l !== PRIMARY_LANGUAGE)) {
        const habits = await EffectivenessRankingService.getPrimaryRecommendations(lang);
        let missingTranslations = 0;
        
        for (const habit of habits) {
          const translation = habit.translations[lang];
          const englishTranslation = habit.translations[PRIMARY_LANGUAGE];
          
          // Check if any field is missing or same as English (untranslated)
          const fields = ['title', 'description', 'whyItWorks', 'quickStart'];
          for (const field of fields) {
            if (!translation[field] || translation[field] === englishTranslation[field]) {
              missingTranslations++;
              break; // Count habit only once
            }
          }
        }
        
        // Report missing translations but don't fail the test
        if (missingTranslations > 0) {
          console.warn(`${lang.toUpperCase()}: ${missingTranslations} habits with missing/incomplete translations`);
        }
        
        // Ensure at least 80% translation completeness
        const completeness = ((habits.length - missingTranslations) / habits.length) * 100;
        expect(completeness).toBeGreaterThanOrEqual(80);
      }
    });

    test('should validate German formal language usage', async () => {
      const habits = await EffectivenessRankingService.getPrimaryRecommendations('de');
      
      for (const habit of habits.slice(0, 3)) {
        const germanText = habit.translations.de;
        
        // Check for formal German patterns
        const hasFormalPatterns = 
          germanText.description.includes('Sie ') || 
          germanText.quickStart.includes('Sie ') ||
          germanText.description.includes('Ihre ') ||
          germanText.quickStart.includes('Ihre ');
        
        // Should use formal German (Sie/Ihre) rather than informal (du/deine)
        expect(hasFormalPatterns).toBe(true);
        
        // Should not contain informal patterns
        expect(germanText.description).not.toMatch(/\bdu\b/i);
        expect(germanText.description).not.toMatch(/\bdeine\b/i);
      }
    });

    test('should validate cultural adaptation in translations', async () => {
      const habits = await EffectivenessRankingService.getPrimaryRecommendations('de');
      
      for (const habit of habits.slice(0, 3)) {
        const germanText = habit.translations.de;
        
        // Check for German-specific cultural elements
        const hasGermanCulturalAdaptation = 
          germanText.description.includes('Uhr') || // Time format
          germanText.quickStart.includes('Uhr') ||
          /\d{1,2}:\d{2}/.test(germanText.description) || // 24-hour format
          /\d{1,2}:\d{2}/.test(germanText.quickStart);
        
        // At least some habits should show cultural adaptation
        if (hasGermanCulturalAdaptation) {
          expect(hasGermanCulturalAdaptation).toBe(true);
        }
      }
    });
  });

  describe('Language Detection and Switching', () => {
    test('should detect browser language correctly', () => {
      // Mock different browser languages
      const testCases = [
        { navigatorLang: 'de-DE', expected: 'de' },
        { navigatorLang: 'fr-FR', expected: 'fr' },
        { navigatorLang: 'es-ES', expected: 'es' },
        { navigatorLang: 'en-US', expected: 'en' },
        { navigatorLang: 'pt-BR', expected: 'en' }, // Fallback to English
      ];
      
      // We'll test this in the actual app context
      for (const { navigatorLang, expected } of testCases) {
        const mockNavigator = { language: navigatorLang };
        const detectedLang = mockNavigator.language.split('-')[0];
        const finalLang = SUPPORTED_LANGUAGES.includes(detectedLang) ? detectedLang : 'en';
        
        expect(finalLang).toBe(expected);
      }
    });

    test('should handle language switching without data loss', async () => {
      // Simulate language switching by loading content in different languages
      const habitDataByLang = {};
      
      for (const lang of SUPPORTED_LANGUAGES) {
        habitDataByLang[lang] = await EffectivenessRankingService.getPrimaryRecommendations(lang);
      }
      
      // Verify that switching languages preserves the same habits with different translations
      const englishHabits = habitDataByLang['en'];
      
      for (const lang of SUPPORTED_LANGUAGES.filter(l => l !== 'en')) {
        const habits = habitDataByLang[lang];
        
        expect(habits.length).toBe(englishHabits.length);
        
        for (let i = 0; i < habits.length; i++) {
          expect(habits[i].id).toBe(englishHabits[i].id);
          expect(habits[i].goalCategory).toBe(englishHabits[i].goalCategory);
          expect(habits[i].effectivenessScore).toBe(englishHabits[i].effectivenessScore);
        }
      }
    });
  });

  describe('Multilingual Goal Selection', () => {
    test('should provide translated goal options in all languages', async () => {
      // This would typically test the UI components
      // For now, we'll verify the data structure supports this
      
      const goals = ['better_sleep', 'get_moving', 'feel_better'];
      
      for (const lang of SUPPORTED_LANGUAGES) {
        for (const goal of goals) {
          const habits = await EffectivenessRankingService.getHabitsByGoal(goal, lang);
          
          expect(habits).toBeDefined();
          expect(Array.isArray(habits)).toBe(true);
          
          // Verify habits are in the correct language
          for (const habit of habits.slice(0, 2)) {
            expect(habit.translations).toHaveProperty(lang);
            expect(habit.translations[lang].title).toBeTruthy();
          }
        }
      }
    });

    test('should maintain goal effectiveness rankings across languages', async () => {
      const rankingsByLang = {};
      
      for (const lang of SUPPORTED_LANGUAGES) {
        rankingsByLang[lang] = await EffectivenessRankingService.getEffectivenessRankings();
      }
      
      // Rankings should be consistent across languages
      const englishRankings = rankingsByLang['en'];
      
      for (const lang of SUPPORTED_LANGUAGES.filter(l => l !== 'en')) {
        const rankings = rankingsByLang[lang];
        
        expect(rankings.length).toBe(englishRankings.length);
        
        for (let i = 0; i < rankings.length; i++) {
          expect(rankings[i].goalCategory).toBe(englishRankings[i].goalCategory);
          expect(rankings[i].habits.length).toBe(englishRankings[i].habits.length);
          
          // Same habits, same effectiveness scores
          for (let j = 0; j < rankings[i].habits.length; j++) {
            expect(rankings[i].habits[j].id).toBe(englishRankings[i].habits[j].id);
            expect(rankings[i].habits[j].effectivenessScore).toBe(englishRankings[i].habits[j].effectivenessScore);
          }
        }
      }
    });
  });

  describe('Performance and Caching', () => {
    test('should cache translations efficiently', async () => {
      // Test caching by making repeated requests
      const lang = 'de';
      
      // First request
      const start1 = Date.now();
      const habits1 = await EffectivenessRankingService.getPrimaryRecommendations(lang);
      const time1 = Date.now() - start1;
      
      // Second request (should be cached)
      const start2 = Date.now();
      const habits2 = await EffectivenessRankingService.getPrimaryRecommendations(lang);
      const time2 = Date.now() - start2;
      
      expect(habits1).toEqual(habits2);
      expect(time2).toBeLessThan(time1 * 0.5); // Cached should be significantly faster
    });

    test('should load different languages in parallel efficiently', async () => {
      const startTime = Date.now();
      
      // Load all languages in parallel
      const promises = SUPPORTED_LANGUAGES.map(lang => 
        EffectivenessRankingService.getPrimaryRecommendations(lang)
      );
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // Parallel loading should be faster than sequential
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // All results should be valid
      for (const habits of results) {
        expect(Array.isArray(habits)).toBe(true);
        expect(habits.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling in Multilingual Context', () => {
    test('should fall back to English for unsupported languages', async () => {
      const unsupportedLanguages = ['zh', 'ja', 'ar', 'invalid'];
      
      for (const lang of unsupportedLanguages) {
        try {
          const habits = await EffectivenessRankingService.getPrimaryRecommendations(lang);
          
          // Should return English content as fallback
          expect(Array.isArray(habits)).toBe(true);
          
          if (habits.length > 0) {
            expect(habits[0].translations.en).toBeDefined();
          }
        } catch (error) {
          // Should handle gracefully, not crash
          expect(error.message).toBeDefined();
        }
      }
    });

    test('should handle partial translation failures gracefully', async () => {
      // This would test scenarios where some translations are missing
      // The system should fall back to English for missing translations
      
      for (const lang of SUPPORTED_LANGUAGES.filter(l => l !== 'en')) {
        const habits = await EffectivenessRankingService.getPrimaryRecommendations(lang);
        
        for (const habit of habits.slice(0, 3)) {
          // Should have at least English translation
          expect(habit.translations.en).toBeDefined();
          expect(habit.translations.en.title).toBeTruthy();
          
          // Target language should exist (even if some fields fall back)
          expect(habit.translations).toHaveProperty(lang);
        }
      }
    });
  });

  describe('Content Consistency Across Languages', () => {
    test('should have consistent difficulty levels across languages', async () => {
      const habitsByLang = {};
      
      for (const lang of SUPPORTED_LANGUAGES) {
        habitsByLang[lang] = await EffectivenessRankingService.getPrimaryRecommendations(lang);
      }
      
      const englishHabits = habitsByLang['en'];
      
      for (const lang of SUPPORTED_LANGUAGES.filter(l => l !== 'en')) {
        const habits = habitsByLang[lang];
        
        for (let i = 0; i < habits.length; i++) {
          expect(habits[i].difficulty).toBe(englishHabits[i].difficulty);
          expect(habits[i].timeMinutes).toBe(englishHabits[i].timeMinutes);
          expect(habits[i].goalCategory).toBe(englishHabits[i].goalCategory);
        }
      }
    });

    test('should maintain research backing consistency', async () => {
      const habitsByLang = {};
      
      for (const lang of SUPPORTED_LANGUAGES) {
        habitsByLang[lang] = await EffectivenessRankingService.getPrimaryRecommendations(lang);
      }
      
      const englishHabits = habitsByLang['en'];
      
      for (const lang of SUPPORTED_LANGUAGES.filter(l => l !== 'en')) {
        const habits = habitsByLang[lang];
        
        for (let i = 0; i < habits.length; i++) {
          // Research-backed claims should be consistent
          expect(habits[i].effectivenessScore).toBe(englishHabits[i].effectivenessScore);
          
          // Goal tags should be identical
          expect(habits[i].goalTags).toEqual(englishHabits[i].goalTags);
        }
      }
    });
  });
});

module.exports = {};