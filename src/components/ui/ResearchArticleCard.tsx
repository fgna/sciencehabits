import React from 'react';
import { ResearchArticle } from '../../types';
import '../../styles/CleanHabitCard.css';

interface ResearchArticleCardProps {
  article: ResearchArticle;
  onReadFullArticle?: (article: ResearchArticle) => void;
}

export const ResearchArticleCard: React.FC<ResearchArticleCardProps> = ({
  article,
  onReadFullArticle
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
        {article.studyDetails?.evidenceLevel && (
          <span className={`evidence-level ${getEvidenceLevelColor(article.studyDetails.evidenceLevel)}`}>
            {article.studyDetails.evidenceLevel} evidence
          </span>
        )}
      </div>
      
      {(article.studyDetails?.year || article.studyDetails?.journal) && (
        <div className="article-meta">
          {article.studyDetails?.year && (
            <span>{article.studyDetails.year}</span>
          )}
          {article.studyDetails?.journal && (
            <span className="journal">{article.studyDetails.journal}</span>
          )}
        </div>
      )}
      
      {/* Key Takeaways */}
      {article.keyTakeaways && article.keyTakeaways.length > 0 && (
        <div className="key-findings">
          <strong>Key Findings:</strong>
          <ul className="takeaways-list">
            {article.keyTakeaways.map((takeaway, index) => (
              <li key={index} className="takeaway-item">
                {takeaway}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Study Details */}
      {article.studyDetails && (
        <div className="study-details">
          {article.studyDetails.studyType && (
            <div className="detail-item">
              <strong>Study Type:</strong> {article.studyDetails.studyType.replace(/_/g, ' ')}
            </div>
          )}
          {article.studyDetails.sampleSize && (
            <div className="detail-item">
              <strong>Sample Size:</strong> {article.studyDetails.sampleSize} participants
            </div>
          )}
          {article.studyDetails.statisticalSignificance && (
            <div className="detail-item">
              <strong>Statistical Significance:</strong> {article.studyDetails.statisticalSignificance}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {onReadFullArticle && article.content && (
        <div className="article-actions" style={{ marginTop: '16px' }}>
          <button 
            onClick={() => onReadFullArticle(article)}
            className="read-full-btn"
            aria-label={`Read full article: ${article.title}`}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              backgroundColor: '#3b82f6',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            📖 Read Full Article
          </button>
        </div>
      )}
      
      {/* Reading Time */}
      {article.readingTime && (
        <div className="reading-time" style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
          📖 {article.readingTime} min read
        </div>
      )}
    </div>
  );
};