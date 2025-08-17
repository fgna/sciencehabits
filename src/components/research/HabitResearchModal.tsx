import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Modal } from '../ui/Modal';
import { ResearchArticleCard } from '../ui/ResearchArticleCard';
import { useResearch } from '../../contexts/ResearchContext';
import { useUserStore } from '../../stores/userStore';
import { researchEngagementService } from '../../services/analytics/ResearchEngagementService';
import { ResearchArticle } from '../../types';

// Helper functions for creating research content from habit data
function createResearchContentFromHabit(habit: any): string {
  let content = `# Research Supporting "${habit.title}"\n\n`;
  
  if (habit.researchSummary) {
    content += `## Research Summary\n\n${habit.researchSummary}\n\n`;
  }
  
  if (habit.whyEffective) {
    content += `## Why This Habit Works\n\n${habit.whyEffective}\n\n`;
  }
  
  if (habit.sources && habit.sources.length > 0) {
    content += `## Scientific Sources\n\n`;
    habit.sources.forEach((source: string, index: number) => {
      content += `${index + 1}. ${source}\n\n`;
    });
  }
  
  if (habit.progressionTips && habit.progressionTips.length > 0) {
    content += `## Implementation Tips\n\n`;
    habit.progressionTips.forEach((tip: string) => {
      content += `- ${tip}\n`;
    });
    content += `\n`;
  }
  
  return content;
}

function extractJournalFromSource(source: string): string {
  // Try to extract journal name from citation
  const journalMatch = source.match(/\.\s*([A-Z][^,]+),\s*\d+/);
  return journalMatch ? journalMatch[1] : 'Scientific Publication';
}

function extractYearFromSource(source: string): number {
  // Try to extract year from citation
  const yearMatch = source.match(/\((\d{4})\)/);
  return yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
}

interface HabitResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitId: string;
  habitTitle: string;
  researchIds: string[];
}

export function HabitResearchModal({ 
  isOpen, 
  onClose, 
  habitId, 
  habitTitle, 
  researchIds 
}: HabitResearchModalProps) {
  const { articles } = useResearch();
  const { currentUser, userHabits } = useUserStore();
  const [fullArticleView, setFullArticleView] = useState<{article: any, isOpen: boolean}>({
    article: null,
    isOpen: false
  });
  const [viewStartTime, setViewStartTime] = useState<number | null>(null);

  // Filter articles based on the habit's research IDs
  // Support both exact matches and partial matches (with/without _article suffix)
  let relatedArticles = articles.filter(article => 
    researchIds.some(researchId => 
      article.id === researchId || 
      article.id === `${researchId}_article` ||
      researchId === `${article.id}_article` ||
      article.id.startsWith(researchId) ||
      researchId.startsWith(article.id.replace('_article', ''))
    )
  );

  // Handle synthetic research articles for habits with embedded research data
  const syntheticArticles: ResearchArticle[] = researchIds
    .filter(id => id.endsWith('_research'))
    .map(id => {
      const habitIdFromResearch = id.replace('_research', '');
      const habit = userHabits.find(h => h.id === habitIdFromResearch);
      
      if (habit && habit.researchBacked && (habit.researchSummary || habit.sources || habit.whyEffective)) {
        return {
          id: id,
          studyId: id,
          title: `Research Supporting "${habit.title}"`,
          subtitle: habit.researchSummary || 'Scientific backing for this habit',
          category: habit.category,
          tags: [],
          readingTime: 5,
          difficulty: 'beginner' as const,
          language: 'en',
          publishedDate: new Date().toISOString().split('T')[0],
          author: 'ScienceHabits Research Team',
          relatedHabits: [habit.id],
          keyTakeaways: habit.progressionTips || [],
          studyDetails: {
            journal: habit.sources && habit.sources.length > 0 ? extractJournalFromSource(habit.sources[0]) : 'Research Journal',
            year: habit.sources && habit.sources.length > 0 ? extractYearFromSource(habit.sources[0]) : new Date().getFullYear(),
            sampleSize: 0,
            studyType: 'review',
            evidenceLevel: 'Level 3',
            statisticalSignificance: 'N/A'
          },
          content: createResearchContentFromHabit(habit)
        };
      }
      return null;
    })
    .filter(Boolean) as ResearchArticle[];

  // Combine real articles with synthetic articles
  relatedArticles = [...relatedArticles, ...syntheticArticles];

  // Track modal opening
  useEffect(() => {
    if (isOpen && currentUser && relatedArticles.length > 0) {
      // Track that user opened research modal for this habit
      relatedArticles.forEach(article => {
        researchEngagementService.trackResearchView(currentUser.id, article.id, habitId);
      });
      setViewStartTime(Date.now());
    }
  }, [isOpen, currentUser, habitId, relatedArticles]);

  const handleReadFullArticle = (article: any) => {
    setFullArticleView({ article, isOpen: true });
    
    // Track full article opening
    if (currentUser) {
      researchEngagementService.trackArticleOpen(currentUser.id, article.id, habitId);
    }
  };

  const handleCloseFullArticle = () => {
    // Track reading time if article was open
    if (fullArticleView.article && currentUser && viewStartTime) {
      const durationMs = Date.now() - viewStartTime;
      researchEngagementService.trackReadingTime(currentUser.id, fullArticleView.article.id, durationMs);
    }
    
    setFullArticleView({ article: null, isOpen: false });
  };

  // Debug logging
  console.log('🔬 Research matching debug:', {
    habitTitle,
    researchIds,
    totalArticles: articles.length,
    articleIds: articles.map(a => a.id),
    matchedArticles: relatedArticles.length,
    matchedIds: relatedArticles.map(a => a.id)
  });

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Research for {habitTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-semibold"
          >
            ✕
          </button>
        </div>
        {relatedArticles.length > 0 ? (
          <div className="space-y-6">
            <p className="text-gray-700 mb-6">
              Scientific research supporting the effectiveness of this habit:
            </p>
            
            {relatedArticles.map((article) => (
              <ResearchArticleCard
                key={article.id}
                article={article}
                onReadFullArticle={handleReadFullArticle}
              />
            ))}
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Research-Backed Benefits</h4>
                  <p className="text-sm text-blue-800">
                    This habit is supported by peer-reviewed scientific research. The studies shown above 
                    provide evidence for its effectiveness and help explain why this practice works.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Research Articles Found</h3>
            <p className="text-gray-600">
              Research articles for this habit are being curated. Check back soon for scientific backing.
            </p>
          </div>
        )}
      </div>
    </Modal>

    {/* Full Article Modal */}
    {fullArticleView.isOpen && fullArticleView.article && (
      <Modal isOpen={true} onClose={handleCloseFullArticle} size="xl">
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {fullArticleView.article.title}
              </h2>
              {fullArticleView.article.subtitle && (
                <p className="text-lg text-gray-600">{fullArticleView.article.subtitle}</p>
              )}
            </div>
            <button
              onClick={handleCloseFullArticle}
              className="text-gray-400 hover:text-gray-600 text-xl font-semibold"
            >
              ✕
            </button>
          </div>

          {/* Original Paper Link */}
          {fullArticleView.article.studyDetails && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-900">📄 Original Research Paper</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {fullArticleView.article.studyDetails.journal} • {fullArticleView.article.studyDetails.year}
                    {fullArticleView.article.studyDetails.sampleSize && 
                      ` • ${fullArticleView.article.studyDetails.sampleSize.toLocaleString()} participants`
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Create a DOI search URL based on the journal and year
                      const journal = fullArticleView.article.studyDetails.journal;
                      const year = fullArticleView.article.studyDetails.year;
                      const searchQuery = encodeURIComponent(`${journal} ${year} thermal environment sleep`);
                      window.open(`https://scholar.google.com/scholar?q=${searchQuery}`, '_blank');
                    }}
                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 transition-colors"
                  >
                    🔍 Find on Google Scholar
                  </button>
                  <button
                    onClick={() => {
                      // PubMed search
                      const journal = fullArticleView.article.studyDetails.journal;
                      const year = fullArticleView.article.studyDetails.year;
                      const searchQuery = encodeURIComponent(`${journal}[journal] AND ${year}[pdat]`);
                      window.open(`https://pubmed.ncbi.nlm.nih.gov/?term=${searchQuery}`, '_blank');
                    }}
                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 transition-colors"
                  >
                    📚 Search PubMed
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            {fullArticleView.article.content ? (
              <ReactMarkdown
                components={{
                  // Custom styling for markdown elements
                  h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-6">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-5">{children}</h3>,
                  h4: ({ children }) => <h4 className="text-lg font-medium text-gray-700 mb-2 mt-4">{children}</h4>,
                  p: ({ children }) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="mb-4 ml-6 list-disc space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-700 leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 text-gray-700 italic">{children}</blockquote>,
                  code: ({ children }) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>,
                }}
              >
                {(() => {
                  // Remove duplicate title and subtitle from markdown content
                  const content = fullArticleView.article.content;
                  const lines = content.split('\n');
                  
                  // Find the first H2 (##) which should be the actual content start
                  const firstH2Index = lines.findIndex((line: string) => line.startsWith('## '));
                  
                  if (firstH2Index !== -1) {
                    // Return content starting from the first H2
                    return lines.slice(firstH2Index).join('\n');
                  }
                  
                  // Fallback: remove first 4 lines (title, empty line, subtitle, empty line)
                  return lines.slice(4).join('\n');
                })()}
              </ReactMarkdown>
            ) : (
              <p className="text-gray-600">Article content not available.</p>
            )}
          </div>
        </div>
      </Modal>
    )}
    </>
  );
}