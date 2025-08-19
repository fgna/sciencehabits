import { db } from '../services/storage/database';
import { Habit, ResearchStudy } from '../types';
import { createDefaultFrequency, createDefaultReminders } from '../utils/frequencyHelpers';
import { bundledContentService } from '../services/BundledContentService';

export async function loadInitialData() {
  try {
    console.log('🎯 Loading initial data using BundledContentService...');
    
    // Load habits from bundled content
    try {
      console.log('📋 Loading habits from bundled content...');
      const habitsResult = await bundledContentService.getAllHabits();
      
      if (habitsResult.success && habitsResult.data.length > 0) {
        // Convert bundled content format to database format
        const databaseHabits: Habit[] = habitsResult.data.map(bundledHabit => ({
          id: bundledHabit.id,
          title: bundledHabit.title,
          description: bundledHabit.description,
          timeMinutes: bundledHabit.timeMinutes,
          category: bundledHabit.category,
          goalTags: bundledHabit.goalTags || [bundledHabit.category],
          lifestyleTags: ['professional', 'parent', 'student'], // Default to all lifestyles
          timeTags: ['flexible'], // Default to flexible timing
          instructions: Array.isArray(bundledHabit.instructions) 
            ? bundledHabit.instructions.join('\n') 
            : bundledHabit.instructions || bundledHabit.description,
          researchIds: bundledHabit.sources || [],
          isCustom: false,
          difficulty: bundledHabit.difficulty,
          equipment: bundledHabit.equipment || 'none',
          effectivenessScore: bundledHabit.effectivenessScore,
          frequency: createDefaultFrequency(),
          reminders: createDefaultReminders()
        }));
        
        await db.habits.bulkAdd(databaseHabits);
        console.log(`✅ Loaded ${databaseHabits.length} habits from bundled content (${habitsResult.source})`);
      } else {
        throw new Error(`Bundled content service failed: ${habitsResult.error || 'Unknown error'}`);
      }
    } catch (bundledContentError) {
      console.warn('Could not load habits from bundled content, trying public folder:', bundledContentError);
      
      // Fallback to public folder
      try {
        const habitsResponse = await fetch('/data/habits.json');
        if (habitsResponse.ok) {
          const habitsData = await habitsResponse.json();
          // Handle both old format (array) and new format (object with habits property)
          const habits = Array.isArray(habitsData) ? habitsData : habitsData.habits;
          if (habits && Array.isArray(habits)) {
            await db.habits.bulkAdd(habits);
            console.log(`Loaded ${habits.length} habits from JSON file`);
          } else {
            throw new Error('Invalid habits data structure');
          }
        } else {
          throw new Error('Failed to fetch habits.json');
        }
      } catch (habitsError) {
        console.error('❌ CRITICAL: Could not load habits.json:', habitsError);
        throw new Error('Failed to load habit data from all sources. Please check your content files and try again.');
      }
    }
    
    // Load research studies from bundled content
    try {
      console.log('📚 Loading research from bundled content...');
      const researchResult = await bundledContentService.getResearch();
      
      if (researchResult.success && researchResult.data.length > 0) {
        const databaseResearch: ResearchStudy[] = researchResult.data.map(bundledResearch => ({
          id: bundledResearch.id,
          title: bundledResearch.title,
          authors: bundledResearch.authors,
          year: bundledResearch.year,
          summary: bundledResearch.summary,
          finding: bundledResearch.finding || bundledResearch.summary,
          sampleSize: bundledResearch.sampleSize || 100,
          studyType: bundledResearch.studyType || 'systematic_review',
          fullCitation: bundledResearch.fullCitation || `${bundledResearch.authors} (${bundledResearch.year}). ${bundledResearch.title}. ${bundledResearch.journal}.`,
          journal: bundledResearch.journal,
          category: bundledResearch.category,
          credibilityTier: (bundledResearch.credibilityTier as 'high' | 'medium' | 'low') || 'medium'
        }));
        
        await db.research.bulkAdd(databaseResearch);
        console.log(`✅ Loaded ${databaseResearch.length} research studies from bundled content (${researchResult.source})`);
      } else {
        throw new Error('Bundled content returned no research data');
      }
    } catch (researchError) {
      console.error('❌ CRITICAL: Could not load research from bundled content:', researchError);
      throw new Error('Failed to load research data from bundled content. Please check your content files and try again.');
    }
    
    console.log('Initial data loaded successfully');
  } catch (error) {
    console.error('❌ FATAL ERROR: Failed to load initial data from all sources:', error);
    
    // Instead of loading fallback data, provide clear error information
    throw new Error(`Content loading failed: ${error instanceof Error ? error.message : 'Unknown error'}. The application requires valid habit and research data to function properly.`);
  }
}

export async function resetDatabase() {
  try {
    // Clear all data
    await db.habits.clear();
    await db.research.clear();
    await db.progress.clear();
    await db.users.clear();
    
    // Reload initial data
    await loadInitialData();
    
    console.log('Database reset completed');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

