/**
 * Browser-Compatible Auto Content Loader
 * 
 * Loads JSON files from public directory using fetch API.
 * Uses a content manifest to discover available files since browsers
 * cannot directly list directory contents.
 */

export interface ContentFile {
  path: string;
  filename: string;
  category: string;
  type: 'habits' | 'research' | 'custom';
  lastModified?: string;
  size?: number;
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

export interface ContentManifest {
  sources: ContentFile[];
  stats: any;
  categories: any;
  generatedAt: string;
}

export class BrowserAutoContentLoader {
  private baseUrl = '/data';
  
  private knownFiles = {
    habits: [
      'sleep-habits.json',
      'productivity-habits.json',
      'exercise-habits.json',
      'mindfulness-habits.json',
      'nutrition-habits.json'
    ],
    research: [
      // Files in research-articles directory
      'sleep-research.json',
      'exercise-research.json', 
      'productivity-research.json',
      'mindfulness-research.json',
      'nutrition-research.json'
    ],
    custom: [
      'custom-habits.json',
      'personal-research.json',
      'my-additions.json',
      'experimental-habits.json'
    ]
  };

  private legacyFiles = {
    habits: ['/data/habits.json', '/data/enhanced_habits.json'],
    research: [
      '/data/research.json', 
      '/data/research_articles.json', 
      '/data/enhanced_research.json',
      '/data/research/research.json' // Also check old research directory
    ]
  };

  async loadAllContent(): Promise<LoadedContent> {
    console.log('🔍 Auto-discovering content files...');
    
    try {
      // First try to load from manifest if available
      const manifest = await this.loadContentManifest();
      let discoveredFiles: ContentFile[];
      
      if (manifest) {
        console.log('📋 Using content manifest for file discovery');
        discoveredFiles = manifest.sources;
      } else {
        console.log('🔍 Discovering files manually (no manifest found)');
        discoveredFiles = await this.discoverContentFiles();
      }
      
      const loadedContent = await this.loadContentFromFiles(discoveredFiles);
      
      console.log(`📊 Content loaded from ${loadedContent.sources.length} files:`);
      console.log(`   📝 ${loadedContent.stats.totalHabits} habits from ${loadedContent.stats.habitsFiles} files`);
      console.log(`   📚 ${loadedContent.stats.totalResearch} research articles from ${loadedContent.stats.researchFiles} files`);
      console.log(`   ⭐ ${loadedContent.stats.customFiles} custom content files`);

      return loadedContent;
    } catch (error) {
      console.error('❌ Failed to load content:', error);
      throw error;
    }
  }

  async loadContentManifest(): Promise<ContentManifest | null> {
    try {
      const response = await fetch('/data/content-manifest.json');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('📋 No content manifest found, falling back to manual discovery');
    }
    return null;
  }

  async discoverContentFiles(): Promise<ContentFile[]> {
    const allFiles: ContentFile[] = [];
    
    // Discover habit files
    const habitFiles = await this.discoverFilesOfType('habits');
    allFiles.push(...habitFiles);

    // Discover research files  
    const researchFiles = await this.discoverFilesOfType('research');
    allFiles.push(...researchFiles);

    // Discover custom content files
    const customFiles = await this.discoverFilesOfType('custom');
    allFiles.push(...customFiles);

    // Add legacy files
    await this.addLegacyFiles(allFiles);

    return allFiles;
  }

  private async discoverFilesOfType(type: 'habits' | 'research' | 'custom'): Promise<ContentFile[]> {
    const files: ContentFile[] = [];
    const knownFiles = this.knownFiles[type];
    
    // Use correct directory path for research articles
    const directory = type === 'research' ? 'research-articles' : type;
    
    for (const filename of knownFiles) {
      const url = `${this.baseUrl}/${directory}/${filename}`;
      
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          const category = this.extractCategoryFromFilename(filename);
          
          files.push({
            path: url,
            filename,
            category,
            type,
            lastModified: response.headers.get('Last-Modified') || undefined,
            size: parseInt(response.headers.get('Content-Length') || '0')
          });
        }
      } catch (error) {
        // File doesn't exist, skip it
      }
    }

    return files;
  }

  private async addLegacyFiles(files: ContentFile[]): Promise<void> {
    // Add legacy habit files
    for (const filePath of this.legacyFiles.habits) {
      try {
        const response = await fetch(filePath, { method: 'HEAD' });
        if (response.ok) {
          const filename = filePath.split('/').pop() || 'unknown';
          files.push({
            path: filePath,
            filename,
            category: 'legacy',
            type: 'habits',
            lastModified: response.headers.get('Last-Modified') || undefined,
            size: parseInt(response.headers.get('Content-Length') || '0')
          });
        }
      } catch (error) {
        // File doesn't exist, skip
      }
    }

    // Add legacy research files
    for (const filePath of this.legacyFiles.research) {
      try {
        const response = await fetch(filePath, { method: 'HEAD' });
        if (response.ok) {
          const filename = filePath.split('/').pop() || 'unknown';
          files.push({
            path: filePath,
            filename,
            category: 'legacy',
            type: 'research',
            lastModified: response.headers.get('Last-Modified') || undefined,
            size: parseInt(response.headers.get('Content-Length') || '0')
          });
        }
      } catch (error) {
        // File doesn't exist, skip
      }
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

  private async loadFileContent(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to load ${url}: ${error}`);
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

  // Method to get available categories
  getCategories(loadedContent: LoadedContent): string[] {
    const categories = loadedContent.sources.map(file => file.category);
    return categories.filter((category, index) => categories.indexOf(category) === index);
  }

  // Method to get files by category
  getFilesByCategory(loadedContent: LoadedContent, category: string): ContentFile[] {
    return loadedContent.sources.filter(file => file.category === category);
  }

  // Method to get loading statistics
  getLoadingStats(loadedContent: LoadedContent): string {
    const { stats, sources } = loadedContent;
    
    let report = `📊 Content Loading Summary:\n`;
    report += `   Total Files: ${stats.totalFiles}\n`;
    report += `   Habits: ${stats.totalHabits} (from ${stats.habitsFiles} files)\n`;
    report += `   Research: ${stats.totalResearch} (from ${stats.researchFiles} files)\n`;
    report += `   Custom: ${stats.customFiles} files\n\n`;
    
    report += `📁 Source Files:\n`;
    const categorizedFiles = this.categorizeFiles(sources);
    Object.entries(categorizedFiles).forEach(([category, files]) => {
      report += `   ${category}:\n`;
      files.forEach((file: ContentFile) => {
        report += `     ${file.filename} (${file.type})\n`;
      });
    });
    
    return report;
  }

  private categorizeFiles(files: ContentFile[]): Record<string, ContentFile[]> {
    const categorized: Record<string, ContentFile[]> = {};
    
    files.forEach(file => {
      if (!categorized[file.category]) {
        categorized[file.category] = [];
      }
      categorized[file.category].push(file);
    });
    
    return categorized;
  }
}