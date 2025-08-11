import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMockUser, createMockHabit, createMockProgress } from './utils/testUtils';

// Simple test component
const TestComponent = ({ user, habit }: { user: any; habit: any }) => (
  <div>
    <h1 data-testid="user-name">{user?.name || 'No user'}</h1>
    <h2 data-testid="habit-title">{habit?.title || 'No habit'}</h2>
  </div>
);

describe('Test Utilities', () => {
  test('createMockUser should create valid user object', () => {
    const user = createMockUser();
    
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.name).toBe('Test User');
    expect(user.goals).toEqual(['reduce_stress', 'improve_sleep']);
    expect(user.availableTime).toBe('10-15 minutes');
  });

  test('createMockUser should accept custom overrides', () => {
    const customUser = createMockUser({
      name: 'Custom User',
      goals: ['exercise', 'nutrition']
    });
    
    expect(customUser.name).toBe('Custom User');
    expect(customUser.goals).toEqual(['exercise', 'nutrition']);
    // Other properties should use defaults
    expect(customUser.availableTime).toBe('10-15 minutes');
  });

  test('createMockHabit should create valid habit object', () => {
    const habit = createMockHabit();
    
    expect(habit).toBeDefined();
    expect(habit.id).toBeDefined();
    expect(habit.title).toBe('Test Habit');
    expect(habit.timeMinutes).toBe(10);
    expect(habit.category).toBe('mindfulness');
    expect(habit.difficulty).toBe('easy');
  });

  test('createMockHabit should accept custom overrides', () => {
    const customHabit = createMockHabit({
      title: 'Custom Habit',
      timeMinutes: 15,
      category: 'exercise'
    });
    
    expect(customHabit.title).toBe('Custom Habit');
    expect(customHabit.timeMinutes).toBe(15);
    expect(customHabit.category).toBe('exercise');
    // Other properties should use defaults
    expect(customHabit.difficulty).toBe('easy');
  });

  test('createMockProgress should create valid progress object', () => {
    const progress = createMockProgress({ habitId: 'test-habit-1' });
    
    expect(progress).toBeDefined();
    expect(progress.habitId).toBe('test-habit-1');
    expect(progress.currentStreak).toBe(0);
    expect(progress.longestStreak).toBe(0);
    expect(progress.totalDays).toBe(0);
    expect(Array.isArray(progress.completions)).toBe(true);
  });

  test('can render components with test utilities', () => {
    const mockUser = createMockUser({ name: 'Rendered User' });
    const mockHabit = createMockHabit({ title: 'Rendered Habit' });
    
    render(<TestComponent user={mockUser} habit={mockHabit} />);
    
    expect(screen.getByTestId('user-name')).toHaveTextContent('Rendered User');
    expect(screen.getByTestId('habit-title')).toHaveTextContent('Rendered Habit');
  });

  test('should have access to DOM testing utilities', () => {
    render(<div data-testid="test-element">Test Content</div>);
    
    const element = screen.getByTestId('test-element');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Test Content');
  });
});