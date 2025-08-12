/**
 * Automatic Content Discovery and Loading System
 * 
 * Automatically discovers and loads JSON files from specified directories:
 * - src/data/habits/ - Habit files by category
 * - src/data/research/ - Research files by category
 * - src/data/content-custom/ - Personal/custom additions
 */

export interface ContentFile {
  path: string;
  filename: string;
  category: string;
  type: 'habits' | 'research' | 'custom';
  lastModified?: string;
}

export interface LoadedContent {
  habits: any[];
  research: any[];
  sources: ContentFile[];
  stats: {
    totalFiles: number;
    habitsFiles: number;
    researchFiles: number;
    customFiles: number;
    totalHabits: number;
    totalResearch: number;
  };
}

export class AutoContentLoader {
  private contentDirectories = {
    habits: 'src/data/habits/',
    research: 'src/data/research/', 
    custom: 'src/data/content-custom/'
  };

  private legacyFiles = {
    habits: ['src/data/habits.json', 'src/data/enhanced_habits.json'],
    research: ['src/data/research.json', 'src/data/research_articles.json', 'src/data/enhanced_research.json']
  };

  async loadAllContent(): Promise<LoadedContent> {
    console.log('🔍 Auto-discovering content files...');
    
    const discoveredFiles = await this.discoverContentFiles();
    const loadedContent = await this.loadContentFromFiles(discoveredFiles);
    
    console.log(`📊 Content loaded from ${loadedContent.sources.length} files:`);
    console.log(`   📝 ${loadedContent.stats.totalHabits} habits from ${loadedContent.stats.habitsFiles} files`);
    console.log(`   📚 ${loadedContent.stats.totalResearch} research articles from ${loadedContent.stats.researchFiles} files`);
    console.log(`   ⭐ ${loadedContent.stats.customFiles} custom content files`);

    return loadedContent;
  }

  async discoverContentFiles(): Promise<ContentFile[]> {
    const allFiles: ContentFile[] = [];
    
    // Discover habit files
    const habitFiles = await this.discoverFilesInDirectory('habits');
    allFiles.push(...habitFiles);

    // Discover research files  
    const researchFiles = await this.discoverFilesInDirectory('research');
    allFiles.push(...researchFiles);

    // Discover custom content files
    const customFiles = await this.discoverFilesInDirectory('custom');
    allFiles.push(...customFiles);

    // Add legacy files if they exist
    await this.addLegacyFiles(allFiles);

    return allFiles;
  }

  private async discoverFilesInDirectory(type: 'habits' | 'research' | 'custom'): Promise<ContentFile[]> {
    const files: ContentFile[] = [];
    const dirPath = this.contentDirectories[type];

    try {
      // In a browser environment, we can't directly read directories
      // This would need to be pre-generated at build time or use a different approach
      // For now, let's simulate with known files and provide a pattern for extension

      const knownFiles = await this.getKnownFilesForType(type);
      
      for (const filename of knownFiles) {
        const filePath = `${dirPath}${filename}`;
        const category = this.extractCategoryFromFilename(filename);
        
        files.push({
          path: filePath,
          filename,
          category,
          type,
          lastModified: new Date().toISOString()
        });
      }
    } catch (error) {
      console.warn(`⚠️ Could not discover files in ${dirPath}:`, error);
    }

    return files;
  }

  private async getKnownFilesForType(type: 'habits' | 'research' | 'custom'): Promise<string[]> {
    // In a real implementation, this would scan the actual directory
    // For now, we'll check for existence of specific files we know about
    const knownFiles: Record<string, string[]> = {
      habits: [
        'sleep-habits.json',
        'productivity-habits.json', 
        'exercise-habits.json',
        'mindfulness-habits.json',
        'nutrition-habits.json'
      ],
      research: [
        'sleep-research.json',
        'exercise-research.json',
        'productivity-research.json',
        'mindfulness-research.json',
        'nutrition-research.json'
      ],
      custom: [
        'custom-habits.json',
        'personal-research.json',
        'experimental-habits.json'
      ]
    };

    const filesToCheck = knownFiles[type] || [];
    const existingFiles: string[] = [];

    for (const filename of filesToCheck) {
      try {
        // Try to import the file to see if it exists
        const filePath = `../../data/${type === 'custom' ? 'content-custom' : type}/${filename}`;
        await this.checkFileExists(filePath);
        existingFiles.push(filename);
      } catch (error) {
        // File doesn't exist, skip it
      }
    }

    return existingFiles;
  }

  private async checkFileExists(importPath: string): Promise<boolean> {
    try {
      // In a real implementation, this would check file existence
      // For now, we'll simulate by trying to import
      await import(importPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  private extractCategoryFromFilename(filename: string): string {
    // Extract category from filename patterns like 'sleep-habits.json' -> 'sleep'
    const basename = filename.replace('.json', '');
    const parts = basename.split('-');
    
    if (parts.length > 1) {
      // Return everything except the last part (habits/research)
      return parts.slice(0, -1).join('-');
    }
    
    return 'general';
  }

  private async addLegacyFiles(files: ContentFile[]): Promise<void> {
    // Add legacy habit files
    for (const filePath of this.legacyFiles.habits) {
      try {
        await this.checkFileExists(filePath);
        const filename = filePath.split('/').pop() || 'unknown';
        files.push({
          path: filePath,
          filename,
          category: 'legacy',
          type: 'habits'
        });
      } catch (error) {
        // File doesn't exist, skip
      }
    }

    // Add legacy research files
    for (const filePath of this.legacyFiles.research) {
      try {
        await this.checkFileExists(filePath);
        const filename = filePath.split('/').pop() || 'unknown';
        files.push({
          path: filePath,
          filename,
          category: 'legacy',
          type: 'research'
        });
      } catch (error) {
        // File doesn't exist, skip
      }
    }
  }

  private async loadContentFromFiles(files: ContentFile[]): Promise<LoadedContent> {
    const allHabits: any[] = [];
    const allResearch: any[] = [];
    const habitIdMap = new Map();
    const researchIdMap = new Map();
    
    let habitsFiles = 0;
    let researchFiles = 0;
    let customFiles = 0;

    for (const file of files) {
      try {
        console.log(`📂 Loading ${file.filename} (${file.category})`);
        
        const content = await this.loadFileContent(file.path);
        
        if (file.type === 'habits') {
          const habits = this.extractHabitsFromContent(content, file);
          this.deduplicateAndMerge(habits, habitIdMap, allHabits);
          habitsFiles++;
        } else if (file.type === 'research') {
          const research = this.extractResearchFromContent(content, file);
          this.deduplicateAndMerge(research, researchIdMap, allResearch);
          researchFiles++;
        } else if (file.type === 'custom') {
          const customContent = this.extractCustomContent(content, file);
          if (customContent.habits) {
            this.deduplicateAndMerge(customContent.habits, habitIdMap, allHabits);
          }
          if (customContent.research) {
            this.deduplicateAndMerge(customContent.research, researchIdMap, allResearch);
          }
          customFiles++;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load ${file.filename}:`, error);
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

  private async loadFileContent(filePath: string): Promise<any> {
    try {
      // Dynamic import for JSON files
      const module = await import(filePath);
      return module.default || module;
    } catch (error) {
      throw new Error(`Failed to load ${filePath}: ${error}`);
    }
  }

  private extractHabitsFromContent(content: any, file: ContentFile): any[] {
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

    console.warn(`⚠️ Unknown habits format in ${file.filename}`);
    return [];
  }

  private extractResearchFromContent(content: any, file: ContentFile): any[] {
    // Handle different JSON structures
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

    console.warn(`⚠️ Unknown research format in ${file.filename}`);
    return [];
  }

  private extractCustomContent(content: any, file: ContentFile): { habits?: any[], research?: any[] } {
    const result: { habits?: any[], research?: any[] } = {};
    
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
        // Default to habits for unknown arrays in custom files
        result.habits = content;
      }
    }
    
    return result;
  }

  private deduplicateAndMerge(items: any[], idMap: Map<string, any>, targetArray: any[]): void {
    for (const item of items) {
      if (item && item.id) {
        if (!idMap.has(item.id)) {
          idMap.set(item.id, item);
          targetArray.push(item);
        } else {
          // Item already exists, potentially merge or update
          const existing = idMap.get(item.id);
          const merged = this.mergeItems(existing, item);
          idMap.set(item.id, merged);
          
          // Update in target array
          const index = targetArray.findIndex(i => i.id === item.id);
          if (index !== -1) {
            targetArray[index] = merged;
          }
        }
      }
    }
  }

  private mergeItems(existing: any, newItem: any): any {
    // Merge strategy: new item properties override existing ones
    // But preserve arrays by merging unique values
    const merged = { ...existing };
    
    for (const [key, value] of Object.entries(newItem)) {
      if (Array.isArray(value) && Array.isArray(existing[key])) {
        // Merge arrays, keeping unique values
        const combined = [...existing[key], ...value];
        merged[key] = combined.filter((item, index) => combined.indexOf(item) === index);
      } else {
        // Override with new value
        merged[key] = value;
      }
    }
    
    return merged;
  }

  // Method to get content loading statistics
  getLoadingStats(loadedContent: LoadedContent): string {
    const { stats, sources } = loadedContent;
    
    let report = `📊 Content Loading Summary:\n`;
    report += `   Total Files: ${stats.totalFiles}\n`;
    report += `   Habits: ${stats.totalHabits} (from ${stats.habitsFiles} files)\n`;
    report += `   Research: ${stats.totalResearch} (from ${stats.researchFiles} files)\n`;
    report += `   Custom: ${stats.customFiles} files\n\n`;
    
    report += `📁 Source Files:\n`;
    sources.forEach(file => {
      report += `   ${file.type}/${file.filename} (${file.category})\n`;
    });
    
    return report;
  }

  // Method to validate that discovered files follow expected patterns
  validateFileNamingConvention(files: ContentFile[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const validPatterns = {
      habits: /^[a-z-]+-habits\.json$/,
      research: /^[a-z-]+-research\.json$/,
      custom: /^[a-z-]+(habits|research)?\.json$/
    };

    for (const file of files) {
      if (file.category === 'legacy') continue; // Skip legacy files
      
      const pattern = validPatterns[file.type];
      if (pattern && !pattern.test(file.filename)) {
        issues.push(`${file.filename}: doesn't follow ${file.type} naming convention`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}