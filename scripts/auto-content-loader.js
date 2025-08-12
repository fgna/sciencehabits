#!/usr/bin/env node

/**
 * Node.js Auto Content Loader
 * 
 * Discovers and loads all JSON content files from:
 * - src/data/habits/ 
 * - src/data/research/
 * - src/data/content-custom/
 * - Legacy files (habits.json, research_articles.json, etc.)
 */

const fs = require('fs').promises;
const path = require('path');

class NodeAutoContentLoader {
  constructor() {
    // Use public directory for runtime-discoverable files
    this.publicDataDir = path.join(__dirname, '../public/data');
    this.srcDataDir = path.join(__dirname, '../src/data');
    
    this.contentDirectories = {
      habits: path.join(this.publicDataDir, 'habits'),
      research: path.join(this.publicDataDir, 'research-articles'), // Updated path for research articles
      custom: path.join(this.publicDataDir, 'content-custom')
    };
    
    this.legacyFiles = {
      habits: [
        path.join(this.srcDataDir, 'habits.json'),
        path.join(this.srcDataDir, 'enhanced_habits.json')
      ],
      research: [
        path.join(this.srcDataDir, 'research.json'),
        path.join(this.srcDataDir, 'research_articles.json'),
        path.join(this.srcDataDir, 'enhanced_research.json'),
        path.join(this.publicDataDir, 'research', 'research.json') // Also check old research directory
      ]
    };
  }

  async loadAllContent() {
    console.log('🔍 Auto-discovering content files...');
    
    const discoveredFiles = await this.discoverAllFiles();
    const loadedContent = await this.loadContentFromFiles(discoveredFiles);
    
    console.log(`📊 Content loaded from ${loadedContent.sources.length} files:`);
    console.log(`   📝 ${loadedContent.stats.totalHabits} habits from ${loadedContent.stats.habitsFiles} files`);
    console.log(`   📚 ${loadedContent.stats.totalResearch} research articles from ${loadedContent.stats.researchFiles} files`);
    console.log(`   ⭐ ${loadedContent.stats.customFiles} custom content files`);
    
    return loadedContent;
  }

  async discoverAllFiles() {
    const allFiles = [];
    
    // Discover modular content files
    for (const [type, dirPath] of Object.entries(this.contentDirectories)) {
      try {
        const files = await this.discoverFilesInDirectory(dirPath, type);
        allFiles.push(...files);
        if (files.length > 0) {
          console.log(`📁 Found ${files.length} ${type} files: ${files.map(f => f.filename).join(', ')}`);
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn(`⚠️ Error scanning ${type} directory:`, error.message);
        }
      }
    }
    
    // Add legacy files
    await this.addLegacyFiles(allFiles);
    
    return allFiles;
  }

  async discoverFilesInDirectory(dirPath, type) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dirPath);
      
      for (const filename of entries) {
        if (filename.endsWith('.json') && filename !== 'index.json') { // Skip index files
          const filePath = path.join(dirPath, filename);
          const stats = await fs.stat(filePath);
          
          const category = this.extractCategoryFromFilename(filename);
          
          files.push({
            path: filePath,
            filename,
            category,
            type,
            lastModified: stats.mtime.toISOString(),
            size: stats.size
          });
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`📁 Directory ${dirPath} doesn't exist yet (will be created when you add files)`);
      } else {
        throw error;
      }
    }
    
    return files;
  }

  async addLegacyFiles(allFiles) {
    // Add legacy habit files
    for (const filePath of this.legacyFiles.habits) {
      try {
        const stats = await fs.stat(filePath);
        const filename = path.basename(filePath);
        allFiles.push({
          path: filePath,
          filename,
          category: 'legacy',
          type: 'habits',
          lastModified: stats.mtime.toISOString(),
          size: stats.size
        });
      } catch (error) {
        // File doesn't exist, skip
      }
    }

    // Add legacy research files
    for (const filePath of this.legacyFiles.research) {
      try {
        const stats = await fs.stat(filePath);
        const filename = path.basename(filePath);
        allFiles.push({
          path: filePath,
          filename,
          category: 'legacy',
          type: 'research',
          lastModified: stats.mtime.toISOString(),
          size: stats.size
        });
      } catch (error) {
        // File doesn't exist, skip
      }
    }
  }

  extractCategoryFromFilename(filename) {
    // Extract category from filename patterns like 'sleep-habits.json' -> 'sleep'
    const basename = filename.replace('.json', '');
    const parts = basename.split('-');
    
    if (parts.length > 1) {
      // Return everything except the last part (habits/research)
      return parts.slice(0, -1).join('-');
    }
    
    return 'general';
  }

  async loadContentFromFiles(files) {
    const allHabits = [];
    const allResearch = [];
    const habitIdMap = new Map();
    const researchIdMap = new Map();
    
    let habitsFiles = 0;
    let researchFiles = 0;
    let customFiles = 0;

    for (const file of files) {
      try {
        console.log(`📂 Loading ${file.filename} (${file.category}) - ${Math.round(file.size / 1024)}KB`);
        
        const content = JSON.parse(await fs.readFile(file.path, 'utf8'));
        
        if (file.type === 'habits') {
          const habits = this.extractHabitsFromContent(content, file);
          this.deduplicateAndMerge(habits, habitIdMap, allHabits);
          habitsFiles++;
          console.log(`   ✅ Loaded ${habits.length} habits`);
        } else if (file.type === 'research') {
          const research = this.extractResearchFromContent(content, file);
          this.deduplicateAndMerge(research, researchIdMap, allResearch);
          researchFiles++;
          console.log(`   ✅ Loaded ${research.length} research articles`);
        } else if (file.type === 'custom') {
          const customContent = this.extractCustomContent(content, file);
          let totalLoaded = 0;
          if (customContent.habits) {
            this.deduplicateAndMerge(customContent.habits, habitIdMap, allHabits);
            totalLoaded += customContent.habits.length;
          }
          if (customContent.research) {
            this.deduplicateAndMerge(customContent.research, researchIdMap, allResearch);
            totalLoaded += customContent.research.length;
          }
          customFiles++;
          console.log(`   ✅ Loaded ${totalLoaded} items`);
        }
      } catch (error) {
        console.error(`❌ Failed to load ${file.filename}:`, error.message);
      }
    }

    return {
      habits: allHabits,
      research: allResearch,
      sources: files,
      stats: {
        totalFiles: files.length,
        habitsFiles,
        researchFiles,
        customFiles,
        totalHabits: allHabits.length,
        totalResearch: allResearch.length
      }
    };
  }

  extractHabitsFromContent(content, file) {
    // Handle different JSON structures
    if (Array.isArray(content)) {
      return content;
    }
    
    if (content.habits && Array.isArray(content.habits)) {
      return content.habits;
    }
    
    if (content.data && Array.isArray(content.data)) {
      return content.data;
    }

    console.warn(`⚠️ Unknown habits format in ${file.filename}, expected array or {habits: []} or {data: []}`);
    return [];
  }

  extractResearchFromContent(content, file) {
    // For research-articles directory, each file is typically a single article
    if (file.type === 'research' && file.path.includes('research-articles')) {
      // If it's a single article object, wrap it in an array
      if (content && typeof content === 'object' && !Array.isArray(content) && content.id) {
        return [content];
      }
    }
    
    // Handle different JSON structures for collections
    if (Array.isArray(content)) {
      return content;
    }
    
    if (content.research && Array.isArray(content.research)) {
      return content.research;
    }
    
    if (content.articles && Array.isArray(content.articles)) {
      return content.articles;
    }
    
    if (content.studies && Array.isArray(content.studies)) {
      return content.studies;
    }
    
    if (content.data && Array.isArray(content.data)) {
      return content.data;
    }
    
    // If it's a single article object, wrap it in an array
    if (content && typeof content === 'object' && content.id) {
      return [content];
    }

    console.warn(`⚠️ Unknown research format in ${file.filename}, expected article object or array`);
    return [];
  }

  extractCustomContent(content, file) {
    const result = {};
    
    // Custom files can contain both habits and research
    if (content.habits && Array.isArray(content.habits)) {
      result.habits = content.habits;
    }
    
    if (content.research && Array.isArray(content.research)) {
      result.research = content.research;
    }
    
    // If it's just an array, try to determine type from filename
    if (Array.isArray(content)) {
      if (file.filename.includes('habit')) {
        result.habits = content;
      } else if (file.filename.includes('research')) {
        result.research = content;
      } else {
        // For ambiguous custom files, put in both
        console.log(`   📝 Ambiguous custom file, treating as habits`);
        result.habits = content;
      }
    }
    
    return result;
  }

  deduplicateAndMerge(items, idMap, targetArray) {
    let duplicates = 0;
    let merged = 0;
    
    for (const item of items) {
      if (item && item.id) {
        if (!idMap.has(item.id)) {
          idMap.set(item.id, item);
          targetArray.push(item);
        } else {
          // Item already exists, merge properties
          const existing = idMap.get(item.id);
          const mergedItem = this.mergeItems(existing, item);
          idMap.set(item.id, mergedItem);
          
          // Update in target array
          const index = targetArray.findIndex(i => i.id === item.id);
          if (index !== -1) {
            targetArray[index] = mergedItem;
            merged++;
          }
          duplicates++;
        }
      } else {
        console.warn(`   ⚠️ Item without ID found, skipping`);
      }
    }
    
    if (duplicates > 0) {
      console.log(`   🔄 Merged ${merged} duplicates (${duplicates} total duplicates found)`);
    }
  }

  mergeItems(existing, newItem) {
    // Merge strategy: new item properties override existing ones
    // But preserve arrays by merging unique values
    const merged = { ...existing };
    
    for (const [key, value] of Object.entries(newItem)) {
      if (Array.isArray(value) && Array.isArray(existing[key])) {
        // Merge arrays, keeping unique values
        merged[key] = [...new Set([...existing[key], ...value])];
      } else {
        // Override with new value
        merged[key] = value;
      }
    }
    
    // Add source tracking
    merged._sources = [...(existing._sources || []), newItem._source || 'unknown'];
    
    return merged;
  }

  async generateContentManifest(loadedContent) {
    const manifest = {
      generatedAt: new Date().toISOString(),
      stats: loadedContent.stats,
      sources: loadedContent.sources.map(file => ({
        filename: file.filename,
        category: file.category,
        type: file.type,
        lastModified: file.lastModified,
        size: file.size
      })),
      categories: this.getCategoriesBreakdown(loadedContent.sources),
      namingConventions: {
        habits: "category-habits.json (e.g., sleep-habits.json)",
        research: "category-research.json (e.g., sleep-research.json)", 
        custom: "anything.json or category-habits/research.json"
      },
      examples: {
        habits: "src/data/habits/sleep-habits.json",
        research: "src/data/research/exercise-research.json",
        custom: "src/data/content-custom/my-personal-habits.json"
      }
    };

    const manifestPath = path.join(this.publicDataDir, 'content-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`📋 Content manifest saved to: ${manifestPath}`);
    
    return manifest;
  }

  getCategoriesBreakdown(sources) {
    const categories = {};
    
    sources.forEach(file => {
      if (!categories[file.category]) {
        categories[file.category] = { habits: 0, research: 0, custom: 0 };
      }
      categories[file.category][file.type]++;
    });
    
    return categories;
  }

  validateFileNamingConventions(files) {
    const issues = [];
    const validPatterns = {
      habits: /^[a-z-]+-habits\.json$/,
      research: /^[a-z-]+-research\.json$/,
      custom: /^[a-z-]+.*\.json$/ // More flexible for custom files
    };

    for (const file of files) {
      if (file.category === 'legacy') continue; // Skip legacy files
      
      const pattern = validPatterns[file.type];
      if (pattern && !pattern.test(file.filename)) {
        issues.push({
          file: file.filename,
          type: file.type,
          issue: `Doesn't follow ${file.type} naming convention`,
          suggestion: file.type === 'habits' ? 'Use format: category-habits.json' :
                     file.type === 'research' ? 'Use format: category-research.json' :
                     'Use descriptive filename ending in .json'
        });
      }
    }

    if (issues.length > 0) {
      console.log('\n⚠️ Naming Convention Issues:');
      issues.forEach(issue => {
        console.log(`   ${issue.file}: ${issue.issue}`);
        console.log(`   💡 ${issue.suggestion}`);
      });
    }

    return { valid: issues.length === 0, issues };
  }
}

// Export for use in other scripts
module.exports = { NodeAutoContentLoader };

// Run directly if called as main script
if (require.main === module) {
  async function main() {
    const loader = new NodeAutoContentLoader();
    
    try {
      const content = await loader.loadAllContent();
      await loader.generateContentManifest(content);
      
      console.log('\n✅ Auto content loading completed successfully!');
      console.log(`📁 Total: ${content.stats.totalHabits} habits, ${content.stats.totalResearch} research articles`);
      
      // Validate naming conventions
      const validation = loader.validateFileNamingConventions(content.sources);
      if (validation.valid) {
        console.log('✅ All files follow naming conventions');
      }
      
    } catch (error) {
      console.error('❌ Auto content loading failed:', error);
      process.exit(1);
    }
  }

  main();
}