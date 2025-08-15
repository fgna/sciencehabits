import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResearchArticle } from '../../types';
import { Card, CardContent, Button } from '../ui';
import { useResearch } from '../../contexts/ResearchContext';
import { useUserStore } from '../../stores/userStore';

// Process article content to remove repetitive title and subtitle
const processArticleContent = (content: string): string => {
  const lines = content.split('\n');
  let processedLines = [...lines];
  
  // Remove the first H1 title if it exists (starts with #)
  if (processedLines[0] && processedLines[0].trim().startsWith('# ')) {
    processedLines.shift(); // Remove first line
  }
  
  // Remove empty line after title if it exists
  if (processedLines[0] && processedLines[0].trim() === '') {
    processedLines.shift();
  }
  
  // Remove the subtitle if it starts with italic markdown (research summary line)
  if (processedLines[0] && processedLines[0].trim().startsWith('*') && 
      processedLines[0].toLowerCase().includes('research summary')) {
    processedLines.shift(); // Remove subtitle line
  }
  
  // Remove empty line after subtitle if it exists
  if (processedLines[0] && processedLines[0].trim() === '') {
    processedLines.shift();
  }
  
  return processedLines.join('\n');
};

export function ResearchArticles() {
  const { articles, isLoading } = useResearch();
  const { currentUser } = useUserStore();
  const [selectedArticle, setSelectedArticle] = useState<ResearchArticle | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByGoals, setFilterByGoals] = useState(false); // Default to showing all articles

  // Listen for research article navigation events
  useEffect(() => {
    const handleShowResearchArticle = (event: CustomEvent) => {
      const articleId = event.detail?.articleId;
      if (articleId) {
        const article = articles.find(a => a.id === articleId);
        if (article) {
          setSelectedArticle(article);
        }
      }
    };

    window.addEventListener('showResearchArticle', handleShowResearchArticle as EventListener);
    
    return () => {
      window.removeEventListener('showResearchArticle', handleShowResearchArticle as EventListener);
    };
  }, [articles]);

  const getCategoryColor = (category: string | undefined) => {
    const colors = {
      nutritional_supplementation: 'bg-green-100 text-green-800',
      cognitive_enhancement: 'bg-blue-100 text-blue-800',
      mood_enhancement: 'bg-purple-100 text-purple-800',
      sleep_optimization: 'bg-indigo-100 text-indigo-800',
      default: 'bg-gray-100 text-gray-800'
    };
    return colors[(category || '') as keyof typeof colors] || colors.default;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-yellow-100 text-yellow-700',
      advanced: 'bg-red-100 text-red-700'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  // Filter articles based on user's goals and other filters
  const filteredArticles = articles.filter(article => {
    // Goal-based filter: Only show articles related to user's selected goals
    if (filterByGoals && currentUser?.goals && currentUser.goals.length > 0) {
      // Check if article is related to any habit that matches user's goals
      // We can also check if the article tags or category relate to the goals
      const userGoals = currentUser.goals;
      const articleMatchesGoals = 
        // Check if article tags match any user goals
        article.tags.some(tag => userGoals.some(goal => 
          goal.includes(tag) || tag.includes(goal.replace('_', ''))
        )) ||
        // Check if article category relates to user goals (if category exists)
        (article.category && userGoals.some(goal => 
          article.category.includes(goal.replace('_', '')) || 
          goal.includes(article.category)
        )) ||
        // Check if article is about habits the user has or could have
        article.relatedHabits.length > 0; // For now, include articles with related habits
      
      if (!articleMatchesGoals) {
        return false;
      }
    }

    // Difficulty filter
    if (selectedDifficulty && article.difficulty !== selectedDifficulty) {
      return false;
    }



    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        article.title.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query)) ||
        article.keyTakeaways.some(takeaway => takeaway.toLowerCase().includes(query)) ||
        (article.studyDetails?.journal && article.studyDetails.journal.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Get unique values for filters
  const uniqueDifficulties = Array.from(new Set(articles.map(a => a.difficulty))).sort();

  const clearAllFilters = () => {
    setSelectedDifficulty(null);
    setSearchQuery('');
    setFilterByGoals(false); // Reset to default (show all articles)
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }


  if (selectedArticle) {
    return <ArticleDetailView article={selectedArticle} onBack={() => setSelectedArticle(null)} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">📚</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Research Articles</h1>
            <p className="text-gray-600">Evidence-based insights from scientific studies</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search articles, tags, or key findings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-4">
          {/* Goal-based Filter Toggle */}
          {currentUser?.goals && currentUser.goals.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Show:</span>
              <button
                onClick={() => setFilterByGoals(!filterByGoals)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  filterByGoals 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filterByGoals ? 'My Goals Only' : 'All Articles'}
              </button>
            </div>
          )}

          {/* Difficulty Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Difficulty:</span>
            <button
              onClick={() => setSelectedDifficulty(null)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                selectedDifficulty === null 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {uniqueDifficulties.map(difficulty => (
              <button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty === selectedDifficulty ? null : difficulty)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  selectedDifficulty === difficulty 
                    ? getDifficultyColor(difficulty).replace('100', '500').replace('700', '100')
                    : getDifficultyColor(difficulty) + ' hover:opacity-80'
                }`}
              >
                {difficulty}
              </button>
            ))}
          </div>

        </div>


        {/* Active Filters & Clear */}
        {(selectedDifficulty || searchQuery || (currentUser?.goals && currentUser.goals.length > 0 && filterByGoals)) && (
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Showing {filteredArticles.length} of {articles.length} articles</span>
              {(selectedDifficulty || (filterByGoals && currentUser?.goals && currentUser.goals.length > 0)) && (
                <span>•</span>
              )}
              {filterByGoals && currentUser?.goals && currentUser.goals.length > 0 && (
                <span className="font-medium text-purple-600">filtered by your goals</span>
              )}
              {selectedDifficulty && <span className="font-medium">{selectedDifficulty}</span>}
            </div>
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Articles Grid */}
      <div className="space-y-6">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
            <Button variant="outline" onClick={clearAllFilters}>
              Clear all filters
            </Button>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onReadMore={() => setSelectedArticle(article)}
              getCategoryColor={getCategoryColor}
              getDifficultyColor={getDifficultyColor}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ArticleCardProps {
  article: ResearchArticle;
  onReadMore: () => void;
  getCategoryColor: (category: string | undefined) => string;
  getDifficultyColor: (difficulty: string) => string;
}

function ArticleCard({ article, onReadMore, getCategoryColor, getDifficultyColor }: ArticleCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent>
        <div className="p-6 cursor-pointer" onClick={onReadMore}>
          {/* Header with badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(article.category)}`}>
              {article.category?.replace('_', ' ') || 'Uncategorized'}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(article.difficulty)}`}>
              {article.difficulty}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {article.readingTime} min read
            </span>
            {article.studyDetails?.evidenceLevel && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {article.studyDetails.evidenceLevel}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4 hover:text-blue-600 transition-colors">
            {article.title}
          </h2>

          {/* Study details */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
            {article.studyDetails?.sampleSize && (
              <div className="flex items-center space-x-1">
                <span>📊</span>
                <span>{article.studyDetails.sampleSize.toLocaleString()} participants</span>
              </div>
            )}
            {article.studyDetails?.journal && (
              <div className="flex items-center space-x-1">
                <span>📖</span>
                <span>{article.studyDetails.journal}</span>
              </div>
            )}
            {article.studyDetails?.year && (
              <div className="flex items-center space-x-1">
                <span>📅</span>
                <span>{article.studyDetails.year}</span>
              </div>
            )}
          </div>

          {/* Key takeaways */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Key Findings:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {article.keyTakeaways.slice(0, 3).map((takeaway, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-200">
            <Button variant="outline" size="sm">
              Read Full Article
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ArticleDetailViewProps {
  article: ResearchArticle;
  onBack: () => void;
}

function ArticleDetailView({ article, onBack }: ArticleDetailViewProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back button */}
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-6 text-blue-600 hover:text-blue-700"
      >
        ← Back to Articles
      </Button>

      <article className="prose prose-lg max-w-none">
        {/* Article header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
              {article.category?.replace('_', ' ') || 'Uncategorized'}
            </span>
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800">
              {article.difficulty}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {article.readingTime} min read
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-8">{article.title}</h1>
        </div>

        {/* Study info box */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Study Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {article.studyDetails?.journal && (
              <div><strong>Journal:</strong> {article.studyDetails.journal}</div>
            )}
            {article.studyDetails?.year && (
              <div><strong>Year:</strong> {article.studyDetails.year}</div>
            )}
            {article.studyDetails?.sampleSize && (
              <div><strong>Sample Size:</strong> {article.studyDetails.sampleSize.toLocaleString()} participants</div>
            )}
            {article.studyDetails?.studyType && (
              <div><strong>Study Type:</strong> {article.studyDetails.studyType.replace('_', ' ')}</div>
            )}
            {article.studyDetails?.evidenceLevel && (
              <div><strong>Evidence Level:</strong> {article.studyDetails.evidenceLevel}</div>
            )}
            {article.studyDetails?.statisticalSignificance && (
              <div><strong>Statistical Significance:</strong> {article.studyDetails.statisticalSignificance}</div>
            )}
          </div>
        </div>

        {/* Key takeaways */}
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Takeaways</h3>
          <ul className="space-y-1">
            {article.keyTakeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Article content */}
        <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({children}) => <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8 pb-2 border-b border-gray-200">{children}</h1>,
              h2: ({children}) => <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">{children}</h2>,
              h3: ({children}) => <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">{children}</h3>,
              h4: ({children}) => <h4 className="text-lg font-semibold text-gray-900 mb-3 mt-6">{children}</h4>,
              p: ({children}) => <p className="mb-4 text-gray-700 leading-7">{children}</p>,
              ul: ({children}) => <ul className="mb-4 pl-6 space-y-2">{children}</ul>,
              ol: ({children}) => <ol className="mb-4 pl-6 space-y-2">{children}</ol>,
              li: ({children}) => <li className="text-gray-700 leading-6">{children}</li>,
              strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
              em: ({children}) => <em className="italic text-gray-800">{children}</em>,
              blockquote: ({children}) => <blockquote className="border-l-4 border-blue-400 pl-4 py-2 mb-4 bg-blue-50 text-gray-700 italic">{children}</blockquote>,
              hr: () => <hr className="my-8 border-gray-300" />,
              code: ({children}) => <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">{children}</code>,
              pre: ({children}) => <pre className="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto text-sm">{children}</pre>
            }}
          >
            {processArticleContent(article.content)}
          </ReactMarkdown>
        </div>

        {/* Citations */}
        {article.citations && article.citations.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">References</h3>
            <div className="space-y-2">
              {article.citations.map((citation) => (
                <div key={citation.id} className="text-sm text-gray-600">
                  {citation.url ? (
                    <a 
                      href={citation.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {citation.text}
                    </a>
                  ) : (
                    <span>{citation.text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related habits */}
        {article.relatedHabits && article.relatedHabits.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Habits</h3>
            <div className="flex flex-wrap gap-2">
              {article.relatedHabits.map((habitId) => (
                <span key={habitId} className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {habitId.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}