import React from 'react';
import { Modal } from '../ui/Modal';
import { useResearch } from '../../contexts/ResearchContext';

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

  // Filter articles based on the habit's research IDs
  const relatedArticles = articles.filter(article => 
    researchIds.includes(article.id)
  );

  return (
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
              <div key={article.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {article.author} ({article.studyDetails.year}) - {article.studyDetails.journal}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${article.studyDetails.evidenceLevel === 'high' 
                        ? 'bg-green-100 text-green-800' 
                        : article.studyDetails.evidenceLevel === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                      }
                    `}>
                      {article.studyDetails.evidenceLevel} evidence
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Takeaways</h4>
                    <div className="space-y-2">
                      {article.keyTakeaways.map((takeaway, index) => (
                        <p key={index} className="text-gray-700 text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                          {takeaway}
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Study Type:</span> {article.studyDetails.studyType.replace(/_/g, ' ')}
                    </div>
                    <div>
                      <span className="font-medium">Sample Size:</span> {article.studyDetails.sampleSize} participants
                    </div>
                    <div>
                      <span className="font-medium">Statistical Significance:</span> {article.studyDetails.statisticalSignificance}
                    </div>
                  </div>
                  
                  <details className="mt-4">
                    <summary className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600">
                      View Study Details
                    </summary>
                    <div className="text-xs text-gray-600 mt-2 p-3 bg-gray-100 rounded space-y-2">
                      <p><strong>Study ID:</strong> {article.studyId}</p>
                      <p><strong>Reading Time:</strong> {article.readingTime} minutes</p>
                      <p><strong>Difficulty:</strong> {article.difficulty}</p>
                      <p><strong>Category:</strong> {article.category}</p>
                      <p><strong>Tags:</strong> {article.tags.join(', ')}</p>
                    </div>
                  </details>
                </div>
              </div>
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
  );
}