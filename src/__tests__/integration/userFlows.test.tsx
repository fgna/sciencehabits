import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { render, createMockUser, createMockHabit, createMockProgress } from '../utils/testUtils';
import { useUserStore } from '../../stores/userStore';
import { useCurrentDate } from '../../hooks/useCurrentDate';
import { TodayView } from '../../components/dashboard/TodayView';
import { HabitsView } from '../../components/habits/HabitsView';
import { ResearchArticles } from '../../components/research/ResearchArticles';
import { AnalyticsView } from '../../components/analytics/AnalyticsView';

// Mock the stores and hooks
jest.mock('../../stores/userStore');
jest.mock('../../hooks/useCurrentDate');

const mockUseUserStore = useUserStore as jest.MockedFunction<typeof useUserStore>;
const mockUseCurrentDate = useCurrentDate as jest.MockedFunction<typeof useCurrentDate>;

describe('Integration Tests: User Flows', () => {
  const mockUser = createMockUser({
    goals: ['reduce_stress', 'improve_sleep'],
    availableTime: '10-15 minutes',
    lifestyle: 'professional'
  });

  const mockHabits = [
    createMockHabit({ 
      id: 'habit-1', 
      title: '5-Minute Breathing Exercise',
      category: 'stress',
      timeMinutes: 5,
      difficulty: 'beginner'
    }),
    createMockHabit({ 
      id: 'habit-2', 
      title: 'Progressive Muscle Relaxation',
      category: 'stress',
      timeMinutes: 10,
      difficulty: 'intermediate'
    }),
    createMockHabit({ 
      id: 'habit-3', 
      title: 'Evening Wind-down Routine',
      category: 'sleep',
      timeMinutes: 15,
      difficulty: 'easy'
    })
  ];

  let mockStoreFunctions: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseCurrentDate.mockReturnValue({
      currentDate: new Date('2023-01-15'),
      today: '2023-01-15',
      todayDisplay: 'Sunday, January 15',
      isToday: jest.fn(date => date === '2023-01-15')
    });

    mockStoreFunctions = {
      setCurrentUser: jest.fn(),
      addUserHabit: jest.fn(),
      removeUserHabit: jest.fn(),
      updateUserProgress: jest.fn(),
      refreshProgress: jest.fn()
    };

    mockUseUserStore.mockReturnValue({
      currentUser: mockUser,
      userHabits: [],
      userProgress: [],
      isLoading: false,
      error: null,
      ...mockStoreFunctions
    });
  });

  describe('Habit Discovery and Addition Flow', () => {
    test('user can discover and add habits based on their goals', async () => {
      // Mock store with no habits initially
      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: [],
        userProgress: [],
        isLoading: false,
        error: null,
        ...mockStoreFunctions
      });

      render(<HabitsView />);

      // Should show empty state with suggestions
      expect(screen.getByText('No habits yet')).toBeInTheDocument();
      expect(screen.getByTestId('habit-suggestions')).toBeInTheDocument();

      // Should show habits matching user's goals (stress reduction)
      expect(screen.getByText('Recommended for you')).toBeInTheDocument();
      
      // Find and add a recommended habit
      const addButton = screen.getByTestId('add-habit-breathing-exercise');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockStoreFunctions.addUserHabit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Breathing'),
            category: 'stress'
          })
        );
      });

      // Mock the updated state with the new habit
      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: [mockHabits[0]],
        userProgress: [createMockProgress({ habitId: 'habit-1' })],
        isLoading: false,
        error: null,
        ...mockStoreFunctions
      });

      // Trigger re-render
      render(<HabitsView />);

      // Should now show the added habit
      expect(screen.getByText('5-Minute Breathing Exercise')).toBeInTheDocument();
      expect(screen.queryByText('No habits yet')).not.toBeInTheDocument();
    });

    test('user can add multiple habits and see them organized by category', async () => {
      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: mockHabits,
        userProgress: mockHabits.map(h => createMockProgress({ habitId: h.id })),
        isLoading: false,
        error: null,
        ...mockStoreFunctions
      });

      render(<HabitsView />);

      // Should show all habits grouped by category
      expect(screen.getByText('Stress Management')).toBeInTheDocument();
      expect(screen.getByText('Sleep & Recovery')).toBeInTheDocument();

      // Should show habits under correct categories
      const stressSection = screen.getByTestId('category-stress');
      within(stressSection).getByText('5-Minute Breathing Exercise');
      within(stressSection).getByText('Progressive Muscle Relaxation');

      const sleepSection = screen.getByTestId('category-sleep');
      within(sleepSection).getByText('Evening Wind-down Routine');
    });
  });

  describe('Daily Habit Completion Flow', () => {
    beforeEach(() => {
      const progressData = [
        createMockProgress({ 
          habitId: 'habit-1', 
          currentStreak: 2,
          completions: [] // Not completed today
        }),
        createMockProgress({ 
          habitId: 'habit-2', 
          currentStreak: 0,
          completions: [] 
        }),
        createMockProgress({ 
          habitId: 'habit-3', 
          currentStreak: 1,
          completions: ['2023-01-15'] // Already completed today
        })
      ];

      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: mockHabits,
        userProgress: progressData,
        isLoading: false,
        error: null,
        ...mockStoreFunctions
      });
    });

    test('user can complete habits throughout the day and see progress update', async () => {
      render(<TodayView />);

      // Should show completion progress
      expect(screen.getByTestId('completion-percentage')).toHaveTextContent('33%');
      expect(screen.getByTestId('completion-summary')).toHaveTextContent('1 of 3 completed');

      // Should show one completed habit and two incomplete
      expect(screen.getByTestId('habit-completed-habit-3')).toBeInTheDocument();
      expect(screen.getByTestId('habit-complete-habit-1')).toBeInTheDocument();
      expect(screen.getByTestId('habit-complete-habit-2')).toBeInTheDocument();

      // Complete first habit
      fireEvent.click(screen.getByTestId('habit-complete-habit-1'));

      await waitFor(() => {
        expect(mockStoreFunctions.updateUserProgress).toHaveBeenCalledWith('habit-1');
      });

      // Mock updated progress after completion
      const updatedProgress = [
        createMockProgress({ 
          habitId: 'habit-1', 
          currentStreak: 3,
          completions: ['2023-01-15']
        }),
        createMockProgress({ 
          habitId: 'habit-2', 
          currentStreak: 0,
          completions: [] 
        }),
        createMockProgress({ 
          habitId: 'habit-3', 
          currentStreak: 1,
          completions: ['2023-01-15']
        })
      ];

      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: mockHabits,
        userProgress: updatedProgress,
        isLoading: false,
        error: null,
        ...mockStoreFunctions
      });

      // Re-render to see updated state
      render(<TodayView />);

      // Should show updated progress
      expect(screen.getByTestId('completion-percentage')).toHaveTextContent('67%');
      expect(screen.getByTestId('completion-summary')).toHaveTextContent('2 of 3 completed');
    });

    test('user can view habit instructions and complete with guidance', async () => {
      render(<TodayView />);

      // Find habit card
      const habitCard = screen.getByTestId('habit-card-habit-1');

      // Expand instructions
      const instructionsButton = within(habitCard).getByTestId('instructions-toggle-habit-1');
      fireEvent.click(instructionsButton);

      await waitFor(() => {
        expect(screen.getByTestId('habit-instructions-habit-1')).toBeVisible();
        expect(screen.getByText(/Find a comfortable seated position/)).toBeInTheDocument();
      });

      // Complete habit after reading instructions
      const completeButton = within(habitCard).getByTestId('habit-complete-habit-1');
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockStoreFunctions.updateUserProgress).toHaveBeenCalledWith('habit-1');
      });
    });

    test('user can access habit research and understand the science', async () => {
      render(<TodayView />);

      const habitCard = screen.getByTestId('habit-card-habit-1');

      // Expand details & research
      const detailsButton = within(habitCard).getByTestId('details-toggle-habit-1');
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByTestId('habit-details-habit-1')).toBeVisible();
        expect(screen.getByText(/Why this works:/)).toBeInTheDocument();
      });

      // Should show research links
      const researchLinks = within(screen.getByTestId('habit-details-habit-1'))
        .getAllByRole('link');
      expect(researchLinks.length).toBeGreaterThan(0);

      // Click on research link
      fireEvent.click(researchLinks[0]);

      // Should navigate to research article (mocked)
      expect(researchLinks[0]).toHaveAttribute('href', expect.stringContaining('/research/'));
    });
  });

  describe('Progress Tracking and Analysis Flow', () => {
    beforeEach(() => {
      const extendedProgress = [
        createMockProgress({ 
          habitId: 'habit-1',
          currentStreak: 5,
          longestStreak: 12,
          totalDays: 28,
          completions: Array.from({ length: 5 }, (_, i) => {
            const date = new Date('2023-01-15');
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
          })
        }),
        createMockProgress({ 
          habitId: 'habit-2',
          currentStreak: 2,
          longestStreak: 8,
          totalDays: 15,
          completions: ['2023-01-15', '2023-01-14']
        })
      ];

      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: mockHabits.slice(0, 2),
        userProgress: extendedProgress,
        isLoading: false,
        error: null,
        ...mockStoreFunctions
      });
    });

    test('user can view comprehensive progress statistics', () => {
      render(<AnalyticsView />);

      // Should show overall statistics
      expect(screen.getByTestId('total-completions')).toHaveTextContent('43');
      expect(screen.getByTestId('longest-streak')).toHaveTextContent('12');
      expect(screen.getByTestId('active-habits')).toHaveTextContent('2');

      // Should show individual habit progress
      expect(screen.getByTestId('habit-progress-habit-1')).toBeInTheDocument();
      expect(screen.getByTestId('habit-progress-habit-2')).toBeInTheDocument();

      // Should show streaks
      expect(screen.getByText('Current streak: 5 days')).toBeInTheDocument();
      expect(screen.getByText('Current streak: 2 days')).toBeInTheDocument();
    });

    test('user can analyze habit performance trends', () => {
      render(<AnalyticsView />);

      // Should show completion rate charts
      expect(screen.getByTestId('completion-rate-chart')).toBeInTheDocument();
      
      // Should show weekly breakdown
      expect(screen.getByTestId('weekly-breakdown')).toBeInTheDocument();
      expect(screen.getByText('This week')).toBeInTheDocument();
      
      // Should show habit performance comparison
      expect(screen.getByTestId('habit-comparison')).toBeInTheDocument();
      
      // Click on detailed view for a habit
      fireEvent.click(screen.getByTestId('habit-details-button-habit-1'));
      
      expect(screen.getByTestId('habit-detail-modal')).toBeInTheDocument();
      expect(screen.getByText('5-Minute Breathing Exercise')).toBeInTheDocument();
      expect(screen.getByTestId('habit-calendar-view')).toBeInTheDocument();
    });

    test('user can identify patterns and receive insights', () => {
      render(<AnalyticsView />);

      // Should show insights section
      expect(screen.getByTestId('insights-section')).toBeInTheDocument();
      expect(screen.getByText('Your insights')).toBeInTheDocument();

      // Should show personalized recommendations
      const insightsContainer = screen.getByTestId('insights-container');
      
      // Should identify best performing habits
      expect(within(insightsContainer).getByText(/strongest streak/)).toBeInTheDocument();
      
      // Should provide actionable suggestions
      expect(within(insightsContainer).getByText(/Consider doing this habit/)).toBeInTheDocument();
      
      // Should show motivation boosts
      expect(screen.getByTestId('motivation-message')).toBeInTheDocument();
    });
  });

  describe('Research Discovery and Learning Flow', () => {
    beforeEach(() => {
      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: mockHabits,
        userProgress: [],
        isLoading: false,
        error: null,
        ...mockStoreFunctions
      });
    });

    test('user can discover research relevant to their goals', () => {
      render(<ResearchArticles />);

      // Should show goal-based filtering toggle
      expect(screen.getByTestId('goal-filter-toggle')).toBeInTheDocument();
      expect(screen.getByLabelText('Show articles for my goals')).toBeChecked();

      // Should show articles matching user's goals
      const articleCards = screen.getAllByTestId(/^article-card-/);
      expect(articleCards.length).toBeGreaterThan(0);

      // Articles should be relevant to stress/sleep goals
      const stressArticles = screen.getAllByText(/stress|anxiety|breathing/i);
      const sleepArticles = screen.getAllByText(/sleep|rest|wind-down/i);
      expect([...stressArticles, ...sleepArticles].length).toBeGreaterThan(0);

      // Toggle off goal filtering
      fireEvent.click(screen.getByLabelText('Show articles for my goals'));
      
      // Should now show all articles
      const allArticleCards = screen.getAllByTestId(/^article-card-/);
      expect(allArticleCards.length).toBeGreaterThan(articleCards.length);
    });

    test('user can read articles and find actionable habits', () => {
      render(<ResearchArticles />);

      // Click on an article
      const firstArticle = screen.getAllByTestId(/^article-card-/)[0];
      fireEvent.click(firstArticle);

      // Should show article modal
      expect(screen.getByTestId('article-modal')).toBeInTheDocument();
      
      // Should show article content
      expect(screen.getByTestId('article-content')).toBeInTheDocument();
      expect(screen.getByText(/scientific evidence/i)).toBeInTheDocument();

      // Should show related habits
      expect(screen.getByTestId('related-habits-section')).toBeInTheDocument();
      expect(screen.getByText('Try these habits')).toBeInTheDocument();

      // Should be able to add habit from article
      const addHabitButton = screen.getByTestId('add-habit-from-article');
      fireEvent.click(addHabitButton);

      expect(mockStoreFunctions.addUserHabit).toHaveBeenCalled();
    });

    test('user can save articles for later reading', async () => {
      render(<ResearchArticles />);

      // Find bookmark button on article card
      const bookmarkButton = screen.getAllByTestId(/^bookmark-article-/)[0];
      fireEvent.click(bookmarkButton);

      // Should show confirmation
      await waitFor(() => {
        expect(screen.getByText('Article saved')).toBeInTheDocument();
      });

      // Should show in bookmarked filter
      const bookmarkedFilter = screen.getByTestId('bookmarked-filter');
      fireEvent.click(bookmarkedFilter);

      // Should show only bookmarked articles
      expect(screen.getByTestId('bookmarked-articles-section')).toBeInTheDocument();
    });
  });

  describe('Cross-Component Integration Flow', () => {
    test('completing habit in Today view updates Progress dashboard', async () => {
      const initialProgress = [
        createMockProgress({ 
          habitId: 'habit-1', 
          currentStreak: 2,
          totalDays: 10,
          completions: []
        })
      ];

      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: [mockHabits[0]],
        userProgress: initialProgress,
        isLoading: false,
        error: null,
        ...mockStoreFunctions
      });

      // Start in Today view
      const { rerender } = render(<TodayView />);

      // Complete a habit
      fireEvent.click(screen.getByTestId('habit-complete-habit-1'));

      await waitFor(() => {
        expect(mockStoreFunctions.updateUserProgress).toHaveBeenCalledWith('habit-1');
      });

      // Mock updated progress
      const updatedProgress = [
        createMockProgress({ 
          habitId: 'habit-1', 
          currentStreak: 3,
          totalDays: 11,
          completions: ['2023-01-15']
        })
      ];

      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: [mockHabits[0]],
        userProgress: updatedProgress,
        isLoading: false,
        error: null,
        ...mockStoreFunctions
      });

      // Switch to Progress view
      rerender(<AnalyticsView />);

      // Should show updated statistics
      expect(screen.getByTestId('total-completions')).toHaveTextContent('11');
      expect(screen.getByText('Current streak: 3 days')).toBeInTheDocument();
    });

    test('adding habit from Research view appears in My Habits', async () => {
      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: [],
        userProgress: [],
        isLoading: false,
        error: null,
        ...mockStoreFunctions
      });

      // Start in Research view
      const { rerender } = render(<ResearchArticles />);

      // Click on an article and add related habit
      const firstArticle = screen.getAllByTestId(/^article-card-/)[0];
      fireEvent.click(firstArticle);

      const addHabitButton = screen.getByTestId('add-habit-from-article');
      fireEvent.click(addHabitButton);

      await waitFor(() => {
        expect(mockStoreFunctions.addUserHabit).toHaveBeenCalled();
      });

      // Mock updated state with new habit
      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: [mockHabits[0]],
        userProgress: [createMockProgress({ habitId: 'habit-1' })],
        isLoading: false,
        error: null,
        ...mockStoreFunctions
      });

      // Switch to My Habits view
      rerender(<HabitsView />);

      // Should show the newly added habit
      expect(screen.getByText('5-Minute Breathing Exercise')).toBeInTheDocument();
      expect(screen.queryByText('No habits yet')).not.toBeInTheDocument();
    });

    test('habit deletion cascades across all views', async () => {
      const initialHabits = [mockHabits[0]];
      const initialProgress = [
        createMockProgress({ 
          habitId: 'habit-1', 
          currentStreak: 5,
          totalDays: 20
        })
      ];

      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: initialHabits,
        userProgress: initialProgress,
        isLoading: false,
        error: null,
        ...mockStoreFunctions
      });

      // Start in My Habits view
      const { rerender } = render(<HabitsView />);

      // Delete the habit
      fireEvent.click(screen.getByTestId('delete-habit-habit-1'));
      fireEvent.click(screen.getByTestId('confirm-delete-button'));

      await waitFor(() => {
        expect(mockStoreFunctions.removeUserHabit).toHaveBeenCalledWith('habit-1');
      });

      // Mock updated state with habit removed
      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: [],
        userProgress: [],
        isLoading: false,
        error: null,
        ...mockStoreFunctions
      });

      // Check Today view
      rerender(<TodayView />);
      expect(screen.getByText('No habits for today')).toBeInTheDocument();

      // Check Progress view
      rerender(<AnalyticsView />);
      expect(screen.getByText('No progress data yet')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Recovery Integration', () => {
    test('network errors are handled gracefully across views', async () => {
      // Mock network error
      mockStoreFunctions.updateUserProgress.mockRejectedValue(
        new Error('Network request failed')
      );

      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: [mockHabits[0]],
        userProgress: [createMockProgress({ habitId: 'habit-1' })],
        isLoading: false,
        error: 'Network request failed',
        ...mockStoreFunctions
      });

      render(<TodayView />);

      // Should show error state
      expect(screen.getByTestId('error-banner')).toBeInTheDocument();
      expect(screen.getByText('Network request failed')).toBeInTheDocument();

      // Should show retry button
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockStoreFunctions.refreshProgress).toHaveBeenCalled();
      });
    });

    test('data loading states are consistent across views', () => {
      mockUseUserStore.mockReturnValue({
        currentUser: null,
        userHabits: [],
        userProgress: [],
        isLoading: true,
        error: null,
        ...mockStoreFunctions
      });

      // Test loading state in different views
      const { rerender } = render(<TodayView />);
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();

      rerender(<HabitsView />);
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();

      rerender(<AnalyticsView />);
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });
  });
});