import { act, renderHook } from '@testing-library/react';
import { useUserStore, getTodayCompletions, getDashboardStats } from '../userStore';
import { 
  createMockUser, 
  createMockHabit, 
  createMockProgress,
  mockDate,
  mockLocalStorage 
} from '../../__tests__/utils/testUtils';

// Mock IndexedDB operations
jest.mock('../storage/database', () => ({
  db: {
    users: {
      get: jest.fn(),
      put: jest.fn(),
      toArray: jest.fn()
    },
    habits: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      toArray: jest.fn()
    },
    progress: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('UserStore', () => {
  const mockUser = createMockUser();
  const mockHabits = [
    createMockHabit({ id: 'habit-1', title: 'Morning Meditation' }),
    createMockHabit({ id: 'habit-2', title: 'Evening Walk' })
  ];
  
  let restoreDate: () => void;

  beforeEach(() => {
    // Reset store state
    act(() => {
      useUserStore.getState().reset();
    });
    
    // Mock current date
    restoreDate = mockDate('2023-01-15T10:00:00.000Z');
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage(),
      writable: true
    });
  });

  afterEach(() => {
    restoreDate();
    jest.clearAllMocks();
  });

  describe('User Management', () => {
    test('sets current user correctly', () => {
      const { result } = renderHook(() => useUserStore());
      
      act(() => {
        result.current.setCurrentUser(mockUser);
      });
      
      expect(result.current.currentUser).toEqual(mockUser);
      expect(result.current.currentUser?.name).toBe('Test User');
    });

    test('persists user ID to localStorage', () => {
      const { result } = renderHook(() => useUserStore());
      
      act(() => {
        result.current.setCurrentUser(mockUser);
      });
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'sciencehabits_user_id',
        'test-user-1'
      );
    });

    test('loads user from localStorage on initialization', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('test-user-1');
      
      const { result } = renderHook(() => useUserStore());
      
      // Should trigger loadUser with stored ID
      expect(result.current.isLoading).toBe(false);
    });

    test('handles user loading errors gracefully', async () => {
      const { result } = renderHook(() => useUserStore());
      
      // Mock database error
      const mockError = new Error('Database connection failed');
      require('../storage/database').db.users.get.mockRejectedValue(mockError);
      
      await act(async () => {
        await result.current.loadUser('invalid-user-id');
      });
      
      expect(result.current.error).toBe('Database connection failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Habit Management', () => {
    test('adds user habit correctly', async () => {
      const { result } = renderHook(() => useUserStore());
      
      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      await act(async () => {
        await result.current.addUserHabit(mockHabits[0]);
      });
      
      expect(result.current.userHabits).toContain(mockHabits[0]);
      expect(result.current.userHabits).toHaveLength(1);
    });

    test('removes user habit correctly', async () => {
      const { result } = renderHook(() => useUserStore());
      
      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      // Add habit first
      await act(async () => {
        await result.current.addUserHabit(mockHabits[0]);
      });
      
      // Then remove it
      await act(async () => {
        await result.current.removeUserHabit('habit-1');
      });
      
      expect(result.current.userHabits).toHaveLength(0);
      expect(result.current.userHabits.find(h => h.id === 'habit-1')).toBeUndefined();
    });

    test('prevents duplicate habits from being added', async () => {
      const { result } = renderHook(() => useUserStore());
      
      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      await act(async () => {
        await result.current.addUserHabit(mockHabits[0]);
        await result.current.addUserHabit(mockHabits[0]); // Same habit
      });
      
      expect(result.current.userHabits).toHaveLength(1);
    });
  });

  describe('Progress Tracking', () => {
    const mockProgress = createMockProgress({
      habitId: 'habit-1',
      currentStreak: 2,
      longestStreak: 5,
      completions: ['2023-01-13', '2023-01-14']
    });

    test('updates user progress correctly on habit completion', async () => {
      const { result } = renderHook(() => useUserStore());
      
      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      // Mock existing progress
      result.current.userProgress = [mockProgress];

      await act(async () => {
        await result.current.updateUserProgress('habit-1');
      });
      
      const updatedProgress = result.current.userProgress.find(p => p.habitId === 'habit-1');
      expect(updatedProgress?.completions).toContain('2023-01-15');
      expect(updatedProgress?.currentStreak).toBe(3);
      expect(updatedProgress?.totalDays).toBe(3);
    });

    test('calculates streak correctly for consecutive days', async () => {
      const { result } = renderHook(() => useUserStore());
      
      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      const consecutiveProgress = createMockProgress({
        habitId: 'habit-1',
        completions: ['2023-01-13', '2023-01-14'] // Two consecutive days
      });
      
      result.current.userProgress = [consecutiveProgress];

      await act(async () => {
        await result.current.updateUserProgress('habit-1');
      });
      
      const updatedProgress = result.current.userProgress.find(p => p.habitId === 'habit-1');
      expect(updatedProgress?.currentStreak).toBe(3); // Should increment
    });

    test('resets streak for non-consecutive days', async () => {
      const { result } = renderHook(() => useUserStore());
      
      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      const nonConsecutiveProgress = createMockProgress({
        habitId: 'habit-1',
        completions: ['2023-01-10', '2023-01-12'] // Gap in days
      });
      
      result.current.userProgress = [nonConsecutiveProgress];

      await act(async () => {
        await result.current.updateUserProgress('habit-1');
      });
      
      const updatedProgress = result.current.userProgress.find(p => p.habitId === 'habit-1');
      expect(updatedProgress?.currentStreak).toBe(1); // Should reset to 1
    });

    test('updates longest streak when current streak exceeds it', async () => {
      const { result } = renderHook(() => useUserStore());
      
      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      const streakProgress = createMockProgress({
        habitId: 'habit-1',
        currentStreak: 4,
        longestStreak: 3,
        completions: ['2023-01-11', '2023-01-12', '2023-01-13', '2023-01-14']
      });
      
      result.current.userProgress = [streakProgress];

      await act(async () => {
        await result.current.updateUserProgress('habit-1');
      });
      
      const updatedProgress = result.current.userProgress.find(p => p.habitId === 'habit-1');
      expect(updatedProgress?.currentStreak).toBe(5);
      expect(updatedProgress?.longestStreak).toBe(5); // Should update
    });

    test('prevents double completion for the same day', async () => {
      const { result } = renderHook(() => useUserStore());
      
      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      const todayProgress = createMockProgress({
        habitId: 'habit-1',
        completions: ['2023-01-15'] // Already completed today
      });
      
      result.current.userProgress = [todayProgress];

      await act(async () => {
        await result.current.updateUserProgress('habit-1');
      });
      
      const updatedProgress = result.current.userProgress.find(p => p.habitId === 'habit-1');
      // Should not add another completion for today
      expect(updatedProgress?.completions.filter(d => d === '2023-01-15')).toHaveLength(1);
    });
  });

  describe('Utility Functions', () => {
    describe('getTodayCompletions', () => {
      const progressData = [
        createMockProgress({
          habitId: 'habit-1',
          completions: ['2023-01-15', '2023-01-14']
        }),
        createMockProgress({
          habitId: 'habit-2',
          completions: ['2023-01-14'] // Not today
        }),
        createMockProgress({
          habitId: 'habit-3',
          completions: ['2023-01-15'] // Today
        })
      ];

      test('returns correct completions for today', () => {
        const todayCompletions = getTodayCompletions(progressData);
        
        expect(todayCompletions).toHaveLength(2);
        expect(todayCompletions.map(p => p.habitId)).toContain('habit-1');
        expect(todayCompletions.map(p => p.habitId)).toContain('habit-3');
        expect(todayCompletions.map(p => p.habitId)).not.toContain('habit-2');
      });
    });

    describe('getDashboardStats', () => {
      const progressData = [
        createMockProgress({
          habitId: 'habit-1',
          currentStreak: 5,
          longestStreak: 8,
          totalDays: 15
        }),
        createMockProgress({
          habitId: 'habit-2',
          currentStreak: 2,
          longestStreak: 12,
          totalDays: 20
        })
      ];

      test('calculates correct dashboard statistics', () => {
        const stats = getDashboardStats(progressData);
        
        expect(stats.totalCompletions).toBe(35); // 15 + 20
        expect(stats.longestStreak).toBe(12); // Max of all streaks
        expect(stats.averageStreak).toBe(3.5); // (5 + 2) / 2
        expect(stats.activeHabits).toBe(2);
      });

      test('handles empty progress data', () => {
        const stats = getDashboardStats([]);
        
        expect(stats.totalCompletions).toBe(0);
        expect(stats.longestStreak).toBe(0);
        expect(stats.averageStreak).toBe(0);
        expect(stats.activeHabits).toBe(0);
      });
    });
  });

  describe('Error Handling', () => {
    test('handles database errors gracefully', async () => {
      const { result } = renderHook(() => useUserStore());
      
      // Mock database error
      require('../storage/database').db.progress.put.mockRejectedValue(
        new Error('IndexedDB quota exceeded')
      );
      
      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      await act(async () => {
        await result.current.updateUserProgress('habit-1');
      });
      
      expect(result.current.error).toBe('IndexedDB quota exceeded');
    });

    test('clears errors when new operations succeed', async () => {
      const { result } = renderHook(() => useUserStore());
      
      // First, cause an error
      result.current.error = 'Previous error';
      
      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      await act(async () => {
        await result.current.addUserHabit(mockHabits[0]);
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('State Management', () => {
    test('resets state correctly', () => {
      const { result } = renderHook(() => useUserStore());
      
      // Set some state
      act(() => {
        result.current.setCurrentUser(mockUser);
        result.current.userHabits = mockHabits;
        result.current.error = 'Test error';
      });
      
      // Reset
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.currentUser).toBeNull();
      expect(result.current.userHabits).toHaveLength(0);
      expect(result.current.userProgress).toHaveLength(0);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    test('maintains referential equality for unchanged data', () => {
      const { result, rerender } = renderHook(() => useUserStore());
      
      act(() => {
        result.current.setCurrentUser(mockUser);
      });
      
      const firstRender = result.current.currentUser;
      
      rerender();
      
      const secondRender = result.current.currentUser;
      
      expect(firstRender).toBe(secondRender); // Same reference
    });
  });
});