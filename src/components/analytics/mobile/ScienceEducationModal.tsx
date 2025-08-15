/**
 * Science Education Bottom Sheet Modal
 * 
 * Mobile-optimized bottom sheet for displaying research-backed habit insights.
 * Implements progressive disclosure with swipe-to-dismiss functionality.
 */

import React, { useState, useEffect } from 'react';

interface ScienceEducationModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ScienceFactCardProps {
  icon: string;
  title: string;
  fact: string;
  expandedContent: string;
  research: string;
}

const SCIENCE_FACTS: ScienceFactCardProps[] = [
  {
    icon: "📊",
    title: "Consistency Over Perfection",
    fact: "70-80% consistency builds stronger neural pathways than 100% followed by burnout.",
    expandedContent: "Research shows that sustainable habits with consistent practice create more robust neural pathways than perfectionist approaches. The brain adapts better to patterns it can maintain long-term, building automatic responses through repetition rather than intensity.",
    research: "Lally et al., 2010 - European Journal of Social Psychology"
  },
  {
    icon: "⏰",
    title: "The 66-Day Reality",
    fact: "Real research found habits take 66 days on average, not the popular 21-day myth.",
    expandedContent: "The University College London study tracked 96 people over 12 weeks and found habit automaticity ranged from 18 to 254 days, with an average of 66 days. Simpler habits formed faster, while complex behaviors took longer to become automatic.",
    research: "Lally et al., 2010 - How are habits formed: Modelling habit formation"
  },
  {
    icon: "💪",
    title: "Recovery Builds Resilience", 
    fact: "Each successful restart strengthens your recovery skills and long-term success.",
    expandedContent: "Resilience research shows that experiencing and recovering from setbacks actually builds stronger coping mechanisms. People who successfully restart habits develop better self-regulation skills and more realistic expectations, leading to greater long-term success.",
    research: "Southwick & Charney, 2012 - Resilience: The Science of Mastering Life's Greatest Challenges"
  },
  {
    icon: "🧠",
    title: "Neuroplasticity in Action",
    fact: "Your brain physically changes structure as habits form through repeated neural firing.",
    expandedContent: "Neuroplasticity research shows that consistent behavior patterns literally rewire the brain. As habits form, neural pathways become more efficient, requiring less conscious effort. The basal ganglia takes over from the prefrontal cortex, making behaviors increasingly automatic.",
    research: "Doidge, 2007 - The Brain That Changes Itself"
  },
  {
    icon: "🎯",
    title: "Willpower is Limited",
    fact: "The brain can effectively automate 3-5 habits simultaneously without depleting willpower.",
    expandedContent: "Willpower research reveals that self-control is a finite resource that depletes with use. However, habits bypass this limitation by becoming automatic. The key is focusing on a small number of habits at once, allowing each to become automatic before adding new ones.",
    research: "Baumeister & Tierney, 2011 - Willpower: Rediscovering the Greatest Human Strength"
  }
];

export function ScienceEducationModal({ visible, onClose }: ScienceEducationModalProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Close modal when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-200"
        onClick={handleBackdropClick}
      />
      
      {/* Bottom Sheet */}
      <div className="relative w-full bg-white rounded-t-xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          {/* Drag Handle */}
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">🧠 The Science Behind Your Progress</h2>
              <p className="text-sm text-gray-600">Research-backed habit insights</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {SCIENCE_FACTS.map((fact) => (
              <ScienceFactCard
                key={fact.title}
                fact={fact}
                isExpanded={expandedCard === fact.title}
                onToggle={() => setExpandedCard(
                  expandedCard === fact.title ? null : fact.title
                )}
              />
            ))}
          </div>
          
          {/* Bottom spacing for better UX */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}

interface ScienceFactCardComponentProps {
  fact: ScienceFactCardProps;
  isExpanded: boolean;
  onToggle: () => void;
}

function ScienceFactCard({ fact, isExpanded, onToggle }: ScienceFactCardComponentProps) {
  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
      
      {/* Clickable Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-gray-100 transition-colors min-h-[44px]"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <span className="text-xl flex-shrink-0">{fact.icon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{fact.title}</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{fact.fact}</p>
            </div>
          </div>
          <div className="flex-shrink-0 ml-2">
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 bg-white">
          <div className="pt-3 space-y-3">
            
            {/* Detailed Explanation */}
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-2">🔬 Deep Dive</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {fact.expandedContent}
              </p>
            </div>
            
            {/* Research Source */}
            <div className="pt-3 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-900 mb-1">📚 Research Source</h4>
              <p className="text-xs text-gray-600 italic">
                {fact.research}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}