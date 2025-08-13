import React, { createContext, useContext, useState, useEffect } from 'react';
import { ResearchArticle } from '../types';

interface ResearchContextType {
  articles: ResearchArticle[];
  isLoading: boolean;
  getRelatedArticles: (habitId: string) => ResearchArticle[];
}

const ResearchContext = createContext<ResearchContextType | null>(null);

export function useResearch() {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error('useResearch must be used within a ResearchProvider');
  }
  return context;
}

interface ResearchProviderProps {
  children: React.ReactNode;
}

export function ResearchProvider({ children }: ResearchProviderProps) {
  const [articles, setArticles] = useState<ResearchArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const discoverArticles = async (): Promise<string[]> => {
    const topics = ['omega3', 'vitamin_d', 'breathing', 'meditation', 'exercise', 'sleep', 'probiotics', 'magnesium', 'zinc', 'creatine'];
    const subtopics = ['brain', 'immune', 'stress', 'depression', 'inflammation', 'cognitive', 'memory', 'focus', 'anxiety', 'recovery', 'meta'];
    const years = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];
    
    const validArticles: string[] = [];
    const testedFiles = new Set<string>();
    
    const knownArticles = [
      'breathing_stress_2023_article_json.json',
      'omega3_brain_2019_article_json.json', 
      'omega3_depression_2020_article_json.json',
      'omega3_inflammation_2021_article_json.json',
      'vitamin_d_immune_2021_article_json.json',
      'vitamin_d_meta_2019_article_json.json'
    ];

    for (const filename of knownArticles) {
      try {
        const response = await fetch(`/data/research-articles/${filename}`, { method: 'HEAD' });
        if (response.ok) {
          validArticles.push(filename);
          testedFiles.add(filename);
        }
      } catch {
        // File doesn't exist, skip it
      }
    }

    const potentialFiles: string[] = [];
    
    for (const topic of topics) {
      for (const subtopic of subtopics) {
        for (const year of years) {
          potentialFiles.push(`${topic}_${subtopic}_${year}_article_json.json`);
        }
      }
    }

    const filesToTest = potentialFiles
      .filter(f => !testedFiles.has(f))
      .slice(0, 20);

    for (const filename of filesToTest) {
      try {
        const response = await fetch(`/data/research-articles/${filename}`, { method: 'HEAD' });
        if (response.ok && !validArticles.includes(filename)) {
          validArticles.push(filename);
        }
      } catch {
        // File doesn't exist, continue
      }
    }

    return validArticles;
  };

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      
      // Try to load from enhanced_research.json first
      try {
        const response = await fetch('/data/enhanced_research.json');
        if (response.ok) {
          const researchData = await response.json();
          const loadedArticles = researchData.studies || []; // Changed from 'articles' to 'studies'
          console.log(`📚 Successfully loaded ${loadedArticles.length} research articles from enhanced_research.json`);
          
          const sortedArticles = loadedArticles.sort((a: any, b: any) => {
            const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(a.year || 0, 0, 1);
            const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(b.year || 0, 0, 1);
            return dateB.getTime() - dateA.getTime();
          });
          
          setArticles(sortedArticles);
          return;
        }
      } catch (error) {
        console.warn('Failed to load enhanced_research.json, trying individual files:', error);
      }
      
      // Fallback to individual article files
      let articleFilenames: string[];
      
      try {
        const manifestResponse = await fetch('/data/content-manifest.json');
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json();
          // Extract research article filenames from manifest
          articleFilenames = manifest.sources
            .filter((source: any) => source.type === 'research' && source.filename.includes('article'))
            .map((source: any) => source.filename);
          console.log(`📋 Found ${articleFilenames.length} articles in manifest`);
        } else {
          throw new Error('Manifest not found');
        }
      } catch {
        // Fallback to manual discovery if manifest fails
        articleFilenames = await discoverArticles();
        console.log(`🔍 Discovered ${articleFilenames.length} articles manually`);
      }
      
      const articlePromises = articleFilenames.map(async (filename: string) => {
        try {
          const response = await fetch(`/data/research-articles/${filename}`);
          if (!response.ok) throw new Error(`Failed to load ${filename}`);
          const articleData = await response.json();
          return articleData;
        } catch (error) {
          console.warn(`Failed to load article ${filename}:`, error);
          return null;
        }
      });

      const loadedArticles = (await Promise.all(articlePromises)).filter(Boolean);
      
      const sortedArticles = loadedArticles.sort((a, b) => {
        const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(a.studyDetails?.year || 0, 0, 1);
        const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(b.studyDetails?.year || 0, 0, 1);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log(`📚 Successfully loaded ${sortedArticles.length} research articles`);
      setArticles(sortedArticles);
      
    } catch (error) {
      console.error('Failed to load research articles:', error);
      setArticles([]); // Set empty array to prevent undefined state
    } finally {
      setIsLoading(false);
    }
  };

  const getRelatedArticles = (habitId: string): ResearchArticle[] => {
    return articles.filter(article => 
      article.relatedHabits?.includes(habitId) ||
      // Match by topic keywords in habit id
      habitId.toLowerCase().includes('omega3') && article.id.toLowerCase().includes('omega3') ||
      habitId.toLowerCase().includes('vitamin_d') && article.id.toLowerCase().includes('vitamin_d') ||
      habitId.toLowerCase().includes('breathing') && article.id.toLowerCase().includes('breathing')
    );
  };

  useEffect(() => {
    loadArticles();
    
    const intervalId = setInterval(() => {
      loadArticles();
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <ResearchContext.Provider value={{ articles, isLoading, getRelatedArticles }}>
      {children}
    </ResearchContext.Provider>
  );
}