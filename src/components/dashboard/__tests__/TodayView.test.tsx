import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { TodayView } from '../TodayView';
import { 
  render, 
  createMockUser, 
  createMockHabit, 
  createMockProgress,
  mockDate,
  waitForLoadingToFinish 
} from '../../../__tests__/utils/testUtils';
import { useUserStore } from '../../../stores/userStore';
import { useCurrentDate } from '../../../hooks/useCurrentDate';

// Mock the stores and hooks
jest.mock('../../../stores/userStore');
jest.mock('../../../hooks/useCurrentDate');

const mockUseUserStore = useUserStore as jest.MockedFunction<typeof useUserStore>;
const mockUseCurrentDate = useCurrentDate as jest.MockedFunction<typeof useCurrentDate>;

describe('TodayView Component', () => {
  // Setup common test data
  const mockUser = createMockUser();
  const mockHabits = [
    createMockHabit({ 
      id: 'habit-1', 
      title: '5-Minute Breathing Exercise',
      timeMinutes: 5,
      category: 'stress',
      difficulty: 'beginner'
    }),
    createMockHabit({ 
      id: 'habit-2', 
      title: 'Morning Stretches',
      timeMinutes: 10,
      category: 'exercise',
      difficulty: 'easy'
    })
  ];

  const mockProgress = [
    createMockProgress({ 
      habitId: 'habit-1',
      currentStreak: 3,
      longestStreak: 5,
      completions: []
    }),
    createMockProgress({ 
      habitId: 'habit-2',
      currentStreak: 1,
      longestStreak: 1,
      completions: ['2023-01-15'] // Completed today
    })
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock current date
    mockUseCurrentDate.mockReturnValue({
      currentDate: new Date('2023-01-15'),
      today: '2023-01-15',
      todayDisplay: 'Monday, January 15',
      isToday: jest.fn(date => date === '2023-01-15')
    });

    // Mock user store with default successful state
    mockUseUserStore.mockReturnValue({
      currentUser: mockUser,
      userHabits: mockHabits,
      userProgress: mockProgress,
      isLoading: false,
      error: null,
      updateUserProgress: jest.fn(),
      // Add other required store methods
      setCurrentUser: jest.fn(),
      addUserHabit: jest.fn(),
      removeUserHabit: jest.fn(),
      refreshProgress: jest.fn()
    });
  });

  describe('Rendering', () => {
    test('displays greeting with current date', () => {
      render(<TodayView />);
      
      expect(screen.getByText(/Good \w+!/)).toBeInTheDocument();
      expect(screen.getByText('Monday, January 15')).toBeInTheDocument();
    });

    test('displays all active habits for today', () => {
      render(<TodayView />);
      
      expect(screen.getByText('5-Minute Breathing Exercise')).toBeInTheDocument();
      expect(screen.getByText('Morning Stretches')).toBeInTheDocument();
    });

    test('shows correct completion percentage', () => {
      render(<TodayView />);
      
      // One habit completed out of two = 50%
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('1 of 2 completed')).toBeInTheDocument();
    });

    test('displays habit details correctly', () => {
      render(<TodayView />);
      
      // Check for difficulty badges
      expect(screen.getByText('beginner')).toBeInTheDocument();
      expect(screen.getByText('easy')).toBeInTheDocument();
      
      // Check for time durations
      expect(screen.getByText('5 min')).toBeInTheDocument();
      expect(screen.getByText('10 min')).toBeInTheDocument();
    });

    test('shows streak information', () => {
      render(<TodayView />);
      
      expect(screen.getByText('3 days')).toBeInTheDocument(); // Current streak for habit-1
      expect(screen.getByText('1 day')).toBeInTheDocument();  // Current streak for habit-2
    });
  });

  describe('Loading States', () => {
    test('displays loading skeleton when data is loading', () => {
      mockUseUserStore.mockReturnValue({
        currentUser: null,
        userHabits: [],
        userProgress: [],
        isLoading: true,
        error: null,
        updateUserProgress: jest.fn(),
        setCurrentUser: jest.fn(),
        addUserHabit: jest.fn(),
        removeUserHabit: jest.fn(),
        refreshProgress: jest.fn()
      });

      render(<TodayView />);
      
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    test('displays error state when there is an error', () => {
      mockUseUserStore.mockReturnValue({
        currentUser: null,
        userHabits: [],
        userProgress: [],
        isLoading: false,
        error: 'Failed to load user data',
        updateUserProgress: jest.fn(),
        setCurrentUser: jest.fn(),
        addUserHabit: jest.fn(),
        removeUserHabit: jest.fn(),
        refreshProgress: jest.fn()
      });

      render(<TodayView />);
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Failed to load user data')).toBeInTheDocument();
    });

    test('displays empty state when no habits exist', () => {
      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: [],
        userProgress: [],
        isLoading: false,
        error: null,
        updateUserProgress: jest.fn(),
        setCurrentUser: jest.fn(),
        addUserHabit: jest.fn(),
        removeUserHabit: jest.fn(),
        refreshProgress: jest.fn()
      });

      render(<TodayView />);
      
      expect(screen.getByText('No habits yet')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('handles habit completion correctly', async () => {
      const mockUpdateProgress = jest.fn();
      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: mockHabits,
        userProgress: mockProgress,
        isLoading: false,
        error: null,
        updateUserProgress: mockUpdateProgress,
        setCurrentUser: jest.fn(),
        addUserHabit: jest.fn(),
        removeUserHabit: jest.fn(),
        refreshProgress: jest.fn()
      });

      render(<TodayView />);
      
      const completeButton = screen.getByTestId('habit-complete-habit-1');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(mockUpdateProgress).toHaveBeenCalledWith('habit-1');
      });
    });

    test('disables complete button during completion', async () => {
      const mockUpdateProgress = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: mockHabits,
        userProgress: mockProgress,
        isLoading: false,
        error: null,
        updateUserProgress: mockUpdateProgress,
        setCurrentUser: jest.fn(),
        addUserHabit: jest.fn(),
        removeUserHabit: jest.fn(),
        refreshProgress: jest.fn()
      });

      render(<TodayView />);
      
      const completeButton = screen.getByTestId('habit-complete-habit-1');
      fireEvent.click(completeButton);
      
      expect(completeButton).toBeDisabled();
    });

    test('shows completed state for finished habits', () => {
      render(<TodayView />);
      
      // habit-2 is already completed (has today's date in completions)
      expect(screen.getByTestId('habit-completed-habit-2')).toBeInTheDocument();
      expect(screen.getByText('Done!')).toBeInTheDocument();
    });

    test('expands and collapses habit instructions', async () => {
      render(<TodayView />);
      
      const instructionsButton = screen.getByTestId('instructions-toggle-habit-1');
      fireEvent.click(instructionsButton);
      
      await waitFor(() => {
        expect(screen.getByText('How to do this habit:')).toBeInTheDocument();
      });

      fireEvent.click(instructionsButton);
      
      await waitFor(() => {
        expect(screen.queryByText('How to do this habit:')).not.toBeInTheDocument();
      });
    });
  });

  describe('Progress Display', () => {
    test('shows motivational message when habits are completed', () => {
      render(<TodayView />);
      
      // With 50% completion, should show motivational message
      expect(screen.getByTestId('motivational-message')).toBeInTheDocument();
    });

    test('shows celebration message when all habits are completed', () => {
      const completedProgress = mockProgress.map(p => ({
        ...p,
        completions: ['2023-01-15'] // All completed today
      }));

      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: mockHabits,
        userProgress: completedProgress,
        isLoading: false,
        error: null,
        updateUserProgress: jest.fn(),
        setCurrentUser: jest.fn(),
        addUserHabit: jest.fn(),
        removeUserHabit: jest.fn(),
        refreshProgress: jest.fn()
      });

      render(<TodayView />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('All done! 🎉')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(<TodayView />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has proper ARIA labels for interactive elements', () => {
      render(<TodayView />);
      
      const completeButton = screen.getByTestId('habit-complete-habit-1');
      expect(completeButton).toHaveAttribute('aria-label');
      
      const instructionsButton = screen.getByTestId('instructions-toggle-habit-1');
      expect(instructionsButton).toHaveAttribute('aria-expanded');
    });

    test('supports keyboard navigation', () => {
      render(<TodayView />);
      
      const completeButton = screen.getByTestId('habit-complete-habit-1');
      completeButton.focus();
      expect(completeButton).toHaveFocus();
    });
  });

  describe('Performance', () => {
    test('renders efficiently with large number of habits', async () => {
      const manyHabits = Array.from({ length: 50 }, (_, i) => 
        createMockHabit({ id: `habit-${i}`, title: `Habit ${i}` })
      );
      
      const manyProgress = manyHabits.map(habit => 
        createMockProgress({ habitId: habit.id })
      );

      mockUseUserStore.mockReturnValue({
        currentUser: mockUser,
        userHabits: manyHabits,
        userProgress: manyProgress,
        isLoading: false,
        error: null,
        updateUserProgress: jest.fn(),
        setCurrentUser: jest.fn(),
        addUserHabit: jest.fn(),
        removeUserHabit: jest.fn(),
        refreshProgress: jest.fn()
      });

      const startTime = performance.now();
      render(<TodayView />);
      const endTime = performance.now();
      
      // Should render in less than 100ms even with 50 habits
      expect(endTime - startTime).toBeLessThan(100);
      
      expect(screen.getByText('Habit 0')).toBeInTheDocument();
      expect(screen.getByText('Habit 49')).toBeInTheDocument();
    });
  });
});