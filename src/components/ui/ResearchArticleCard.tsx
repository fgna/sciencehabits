import React from 'react';
import { ResearchArticle } from '../../types';
import '../../styles/CleanHabitCard.css';

interface ResearchArticleCardProps {
  article: ResearchArticle;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const ResearchArticleCard: React.FC<ResearchArticleCardProps> = ({
  article,
  isExpanded = false,
  onToggleExpand
}) => {
  const getEvidenceLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="research-article-card">
      <div className="article-header">
        <h3 className="article-title">{article.title}</h3>
        <span className={`evidence-level ${getEvidenceLevelColor(article.studyDetails.evidenceLevel)}`}>
          {article.studyDetails.evidenceLevel} evidence
        </span>
      </div>
      
      <div className="article-meta">
        <span>{article.author} ({article.studyDetails.year})</span>
        <span className="journal">{article.studyDetails.journal}</span>
      </div>
      
      {/* Key Takeaways */}
      {article.keyTakeaways.length > 0 && (
        <div className="key-findings">
          <strong>Key Findings:</strong>
          <ul className="takeaways-list">
            {article.keyTakeaways.slice(0, isExpanded ? undefined : 2).map((takeaway, index) => (
              <li key={index} className="takeaway-item">
                {takeaway}
              </li>
            ))}
          </ul>
          {article.keyTakeaways.length > 2 && !isExpanded && (
            <span className="more-indicator">+{article.keyTakeaways.length - 2} more</span>
          )}
        </div>
      )}
      
      {/* Study Details */}
      <div className="study-details">
        <div className="detail-item">
          <strong>Study Type:</strong> {article.studyDetails.studyType.replace(/_/g, ' ')}
        </div>
        <div className="detail-item">
          <strong>Sample Size:</strong> {article.studyDetails.sampleSize} participants
        </div>
        {article.studyDetails.statisticalSignificance && (
          <div className="detail-item">
            <strong>Statistical Significance:</strong> {article.studyDetails.statisticalSignificance}
          </div>
        )}
      </div>

      {/* Expand/Collapse Button */}
      {onToggleExpand && (
        <button 
          onClick={onToggleExpand}
          className="expand-btn"
          aria-label={isExpanded ? 'Show less' : 'Show more details'}
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      )}
      
      {/* Reading Time */}
      <div className="reading-time">
        📖 {article.readingTime} min read
      </div>
    </div>
  );
};