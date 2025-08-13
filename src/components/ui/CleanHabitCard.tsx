import React from 'react';
import { Habit } from '../../types';
import { Progress } from '../../types';
import '../../styles/CleanHabitCard.css';

interface CleanHabitCardProps {
  habit: Habit;
  progress?: Progress;
  onComplete: (habitId: string) => void;
  onViewResearch?: (habitId: string) => void;
  isCompleted: boolean;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const CleanHabitCard: React.FC<CleanHabitCardProps> = ({
  habit,
  progress,
  onComplete,
  onViewResearch,
  isCompleted,
  showActions,
  onEdit,
  onDelete
}) => {
  const hasResearch = habit.researchIds && habit.researchIds.length > 0;
  const currentStreak = progress?.currentStreak || 0;
  
  return (
    <div className="clean-habit-card">
      {/* Header Row */}
      <div className="habit-header">
        <div className="habit-title-section">
          {hasResearch && !habit.isCustom && (
            <span className="research-badge" aria-label="Research verified">
              🔬
            </span>
          )}
          <h3 
            className="habit-title"
            id={`habit-title-${habit.id}`}
          >
            {habit.title}
          </h3>
        </div>
        
        <button 
          onClick={() => onComplete(habit.id)}
          className={`completion-btn ${isCompleted ? 'completed' : 'pending'}`}
          aria-label={`${isCompleted ? 'Mark incomplete' : 'Complete'} ${habit.title}`}
          aria-pressed={isCompleted}
        >
          {habit.isCustom ? (isCompleted ? 'Done' : 'Start') : (isCompleted ? '✓' : '○')}
        </button>
      </div>

      {/* Description */}
      <p className="habit-description">
        {habit.description}
      </p>

      {/* Metadata Row */}
      <div className="habit-metadata">
        <span className="time-estimate">
          {habit.isCustom ? '' : '⏱ '}{habit.timeMinutes} min
        </span>
        
        {currentStreak > 0 && (
          <span className="streak-display">
            {habit.isCustom ? '' : '🔥 '}{currentStreak} days
          </span>
        )}

        {/* Effectiveness Score */}
        {habit.effectivenessScore && (
          <span className="effectiveness-score">
            {habit.isCustom ? '' : '📈 '}{habit.effectivenessScore}/100
          </span>
        )}
      </div>

      {/* Action Row */}
      <div className="habit-actions">
        {/* Admin Actions for Custom Habits */}
        {showActions && (
          <div className="admin-actions">
            {onEdit && (
              <button 
                onClick={onEdit}
                className="edit-btn secondary"
                aria-label={`Edit ${habit.title}`}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button 
                onClick={onDelete}
                className="delete-btn secondary"
                aria-label={`Delete ${habit.title}`}
              >
                Delete
              </button>
            )}
          </div>
        )}

        {/* Research and Completion Actions */}
        <div className="habit-main-actions">
          {hasResearch && onViewResearch && (
            <button 
              onClick={() => onViewResearch(habit.id)}
              className="research-btn secondary"
              aria-label={`View research for ${habit.title}`}
            >
              View Research
            </button>
          )}
          
          <button 
            onClick={() => !isCompleted && onComplete(habit.id)}
            disabled={isCompleted}
            className="primary-action-btn"
          >
            {isCompleted ? 'Completed' : 'Start Habit'}
          </button>
        </div>
      </div>
    </div>
  );
};