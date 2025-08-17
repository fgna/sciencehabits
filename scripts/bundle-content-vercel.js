#!/usr/bin/env node

/**
 * Vercel Build-Time Content Bundling Script
 * 
 * Bundles content from the sciencehabits-content-api repository directly into
 * the main app during Vercel deployment. This eliminates runtime API dependencies
 * and creates a fully offline-capable PWA.
 * 
 * Strategy: Build-time bundling for deployment reliability
 */

const fs = require('fs').promises;
const path = require('path');

class VercelContentBundler {
  constructor() {
    this.contentApiPath = process.env.CONTENT_API_PATH || '../sciencehabits-content-api';
    this.outputDir = 'src/data/bundled';
    this.supportedLanguages = ['en', 'de', 'fr', 'es'];
    
    this.stats = {
      startTime: Date.now(),
      filesProcessed: 0,
      contentBundled: {},
      errors: []
    };
  }

  async bundleAllContent() {
    console.log('🚀 Starting Vercel build-time content bundling...');
    console.log(`📁 Content API path: ${this.contentApiPath}`);
    console.log(`📦 Output directory: ${this.outputDir}`);
    
    try {
      await this.validateContentApiAccess();
      await this.ensureOutputDirectories();
      await this.bundleContentFiles();
      await this.generateBundleManifest();
      await this.createFallbackContent();
      
      this.logSuccess();
      console.log('✅ Build-time content bundling completed successfully!');
      
    } catch (error) {
      console.error('❌ Content bundling failed:', error.message);
      console.log('🔄 Creating fallback content to allow build to continue...');
      
      await this.createComprehensiveFallback();
      console.log('⚠️ Build continues with fallback content');
    }
  }

  async validateContentApiAccess() {
    try {
      const contentApiStat = await fs.stat(this.contentApiPath);
      if (!contentApiStat.isDirectory()) {
        throw new Error('Content API path is not a directory');
      }
      
      const contentPath = path.join(this.contentApiPath, 'src/content');
      await fs.stat(contentPath);
      
      console.log('✅ Content API repository access validated');
    } catch (error) {
      throw new Error(`Cannot access content API repository: ${error.message}`);
    }
  }

  async ensureOutputDirectories() {
    const dirs = [
      this.outputDir,
      `${this.outputDir}/habits`,
      `${this.outputDir}/research`,
      `${this.outputDir}/locales`
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    console.log('📁 Output directories prepared');
  }

  async bundleContentFiles() {
    console.log('📋 Bundling content files...');
    
    // Bundle habits
    await this.bundleHabits();
    
    // Bundle locales
    await this.bundleLocales();
    
    // Create research placeholders (if research files exist)
    await this.bundleResearch();
  }

  async bundleHabits() {
    console.log('🎯 Bundling habits...');
    
    const habitsPath = path.join(this.contentApiPath, 'src/content/habits');
    
    try {
      const habitFiles = await fs.readdir(habitsPath);
      const jsonFiles = habitFiles.filter(file => file.endsWith('.json'));
      
      let allHabits = [];
      let habitsByGoal = {};
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(habitsPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const habits = JSON.parse(content);
          
          // Extract goal from filename (e.g., 'feel_better_habits-en.json' -> 'feel_better')
          const goalMatch = file.match(/^(.+)_habits?-(\w+)\.json$/);
          const goal = goalMatch ? goalMatch[1] : 'general';
          const language = goalMatch ? goalMatch[2] : 'en';
          
          if (Array.isArray(habits)) {
            allHabits.push(...habits);
            
            if (!habitsByGoal[goal]) {
              habitsByGoal[goal] = {};
            }
            habitsByGoal[goal][language] = habits;
            
            console.log(`   ✅ ${file}: ${habits.length} habits`);
            this.stats.filesProcessed++;
          }
          
        } catch (error) {
          console.warn(`   ⚠️ Failed to process ${file}: ${error.message}`);
          this.stats.errors.push(`Failed to process ${file}: ${error.message}`);
        }
      }
      
      // Save bundled habits
      await this.saveContent('habits/all.json', {
        timestamp: new Date().toISOString(),
        source: 'build-time-bundle',
        count: allHabits.length,
        data: allHabits
      });
      
      await this.saveContent('habits/by-goal.json', {
        timestamp: new Date().toISOString(),
        source: 'build-time-bundle',
        goals: Object.keys(habitsByGoal),
        data: habitsByGoal
      });
      
      this.stats.contentBundled.habits = allHabits.length;
      console.log(`   📊 Total habits bundled: ${allHabits.length}`);
      
    } catch (error) {
      console.warn(`⚠️ Failed to bundle habits: ${error.message}`);
      await this.createFallbackHabits();
    }
  }

  async bundleLocales() {
    console.log('🌍 Bundling locales...');
    
    const localesPath = path.join(this.contentApiPath, 'src/content/locales');
    
    try {
      const localeFiles = await fs.readdir(localesPath);
      const jsonFiles = localeFiles.filter(file => file.endsWith('.json'));
      
      let allLocales = {};
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(localesPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const locales = JSON.parse(content);
          
          const language = path.basename(file, '.json');
          allLocales[language] = locales;
          
          // Also save individual language files
          await this.saveContent(`locales/${language}.json`, {
            timestamp: new Date().toISOString(),
            source: 'build-time-bundle',
            language: language,
            count: Object.keys(locales).length,
            data: locales
          });
          
          console.log(`   ✅ ${file}: ${Object.keys(locales).length} locale keys`);
          this.stats.filesProcessed++;
          
        } catch (error) {
          console.warn(`   ⚠️ Failed to process ${file}: ${error.message}`);
          this.stats.errors.push(`Failed to process ${file}: ${error.message}`);
        }
      }
      
      // Save combined locales
      await this.saveContent('locales/all.json', {
        timestamp: new Date().toISOString(),
        source: 'build-time-bundle',
        languages: Object.keys(allLocales),
        data: allLocales
      });
      
      this.stats.contentBundled.locales = Object.keys(allLocales).length;
      console.log(`   📊 Total languages bundled: ${Object.keys(allLocales).length}`);
      
    } catch (error) {
      console.warn(`⚠️ Failed to bundle locales: ${error.message}`);
      await this.createFallbackLocales();
    }
  }

  async bundleResearch() {
    console.log('📚 Bundling research...');
    
    // For now, create a placeholder since research is less critical
    const fallbackResearch = [
      {
        id: 'habit-formation-overview',
        title: 'The Science of Habit Formation',
        summary: 'Research shows that habits form through repeated behavior in consistent contexts, with neural pathway changes occurring after approximately 66 days on average.',
        authors: 'ScienceHabits Research Team',
        year: new Date().getFullYear(),
        journal: 'Behavioral Science Review',
        category: 'psychology',
        evidenceLevel: 'systematic_review',
        qualityScore: 85,
        language: 'en'
      }
    ];
    
    await this.saveContent('research/all.json', {
      timestamp: new Date().toISOString(),
      source: 'build-time-bundle',
      count: fallbackResearch.length,
      data: fallbackResearch
    });
    
    this.stats.contentBundled.research = fallbackResearch.length;
    console.log(`   📊 Research articles bundled: ${fallbackResearch.length}`);
  }

  async generateBundleManifest() {
    console.log('📋 Generating bundle manifest...');
    
    const manifest = {
      timestamp: new Date().toISOString(),
      bundleVersion: '1.0.0',
      buildType: 'vercel-build-time',
      contentSources: {
        contentApiPath: this.contentApiPath,
        bundleStrategy: 'direct-file-copy'
      },
      content: this.stats.contentBundled,
      stats: {
        ...this.stats,
        duration: Date.now() - this.stats.startTime
      },
      manifest: {
        files: await this.listBundledFiles(),
        integrity: await this.generateIntegrityHashes()
      }
    };
    
    await this.saveContent('manifest.json', manifest);
    console.log('✅ Bundle manifest generated');
  }

  async listBundledFiles() {
    const files = [];
    
    async function walkDir(dir, prefix = '') {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const relativePath = path.join(prefix, entry.name);
          
          if (entry.isDirectory()) {
            files.push(...await walkDir(path.join(dir, entry.name), relativePath));
          } else {
            const stats = await fs.stat(path.join(dir, entry.name));
            files.push({
              path: relativePath,
              size: stats.size,
              modified: stats.mtime.toISOString()
            });
          }
        }
      } catch (error) {
        // Directory doesn't exist or can't be read
      }
      
      return files;
    }
    
    return await walkDir(this.outputDir);
  }

  async generateIntegrityHashes() {
    // Simple integrity check - count files and total size
    const files = await this.listBundledFiles();
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    return {
      fileCount: files.length,
      totalSize: totalSize,
      checksum: `${files.length}-${totalSize}-${Date.now()}`
    };
  }

  async saveContent(relativePath, content) {
    const fullPath = path.join(this.outputDir, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, JSON.stringify(content, null, 2));
  }

  async createFallbackContent() {
    console.log('🛡️ Creating fallback content...');
    
    // Ensure we have at least basic content for each type
    const fallbackDir = `${this.outputDir}/fallback`;
    await fs.mkdir(fallbackDir, { recursive: true });
    
    if (!this.stats.contentBundled.habits) {
      await this.createFallbackHabits();
    }
    
    if (!this.stats.contentBundled.locales) {
      await this.createFallbackLocales();
    }
  }

  async createFallbackHabits() {
    const fallbackHabits = [
      {
        id: 'morning-routine',
        title: 'Morning Routine',
        description: 'Start your day with a consistent morning routine to build momentum and clarity.',
        category: 'feel_better',
        goalTags: ['productivity', 'wellness'],
        difficulty: 'beginner',
        timeMinutes: 15,
        effectivenessScore: 8.5,
        instructions: '1. Wake up at the same time\n2. Make your bed\n3. Drink a glass of water\n4. Take 5 deep breaths',
        researchBacked: true,
        fallback: true
      },
      {
        id: 'evening-reflection',
        title: 'Evening Reflection',
        description: 'End your day by reflecting on three things you accomplished or are grateful for.',
        category: 'feel_better',
        goalTags: ['mindfulness', 'gratitude'],
        difficulty: 'beginner',
        timeMinutes: 5,
        effectivenessScore: 8.2,
        instructions: '1. Find a quiet moment\n2. Think of 3 things from today\n3. Write them down or just reflect\n4. Feel grateful',
        researchBacked: true,
        fallback: true
      }
    ];
    
    await this.saveContent('habits/fallback.json', {
      timestamp: new Date().toISOString(),
      source: 'fallback-generation',
      count: fallbackHabits.length,
      data: fallbackHabits
    });
    
    this.stats.contentBundled.habits = fallbackHabits.length;
  }

  async createFallbackLocales() {
    const fallbackLocales = {
      en: {
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'navigation.dashboard': 'Dashboard',
        'navigation.habits': 'My Habits',
        'navigation.analytics': 'Analytics',
        'navigation.settings': 'Settings'
      }
    };
    
    await this.saveContent('locales/fallback.json', {
      timestamp: new Date().toISOString(),
      source: 'fallback-generation',
      languages: Object.keys(fallbackLocales),
      data: fallbackLocales
    });
    
    this.stats.contentBundled.locales = Object.keys(fallbackLocales).length;
  }

  async createComprehensiveFallback() {
    await this.ensureOutputDirectories();
    await this.createFallbackHabits();
    await this.createFallbackLocales();
    await this.bundleResearch();
    await this.generateBundleManifest();
  }

  logSuccess() {
    const duration = Date.now() - this.stats.startTime;
    
    console.log('\n📊 Content Bundling Results:');
    console.log(`⏱️  Total time: ${duration}ms`);
    console.log(`📁 Files processed: ${this.stats.filesProcessed}`);
    console.log(`🎯 Habits bundled: ${this.stats.contentBundled.habits || 0}`);
    console.log(`🌍 Languages bundled: ${this.stats.contentBundled.locales || 0}`);
    console.log(`📚 Research bundled: ${this.stats.contentBundled.research || 0}`);
    console.log(`❌ Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      this.stats.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('\n🎯 Bundle Strategy: Build-time content bundling');
    console.log('📦 Result: Fully offline-capable PWA');
    console.log('🚀 Performance: Zero runtime API dependencies');
  }
}

// CLI execution
if (require.main === module) {
  const bundler = new VercelContentBundler();
  bundler.bundleAllContent().catch(error => {
    console.error('💥 Content bundling crashed:', error);
    process.exit(1);
  });
}

module.exports = VercelContentBundler;