import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { 
  createMockUser, 
  createMockHabit, 
  createMockProgress,
  TestWrapper 
} from '../utils/testUtils';
import { HabitChecklistCard } from '../../components/dashboard/HabitChecklistCard';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

// Mock research context
const mockResearchContext = {
  articles: [],
  studies: [],
  loading: false,
  error: null,
  searchArticles: jest.fn(),
  getArticleById: jest.fn(),
  getArticlesByCategory: jest.fn(),
  getRelatedArticles: jest.fn(),
  loadArticles: jest.fn()
};


// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock stores and hooks
jest.mock('../../stores/userStore', () => ({
  useUserStore: () => ({
    currentUser: null,
    userHabits: [],
    userProgress: [],
    isLoading: false,
    error: null,
    updateUserProgress: jest.fn(),
    setCurrentUser: jest.fn(),
    addUserHabit: jest.fn(),
    removeUserHabit: jest.fn(),
    refreshProgress: jest.fn()
  })
}));

jest.mock('../../hooks/useCurrentDate', () => ({
  useCurrentDate: () => ({
    today: '2023-01-15',
    todayDisplay: 'Sunday, January 15',
    isToday: jest.fn(date => date === '2023-01-15')
  })
}));

jest.mock('../../contexts/ResearchContext', () => ({
  useResearch: () => mockResearchContext,
  ResearchProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock data
const mockUser = createMockUser();
const mockHabit = createMockHabit({ 
  id: 'habit-1', 
  title: '5-Minute Breathing Exercise',
  instructions: 'Find a comfortable position and focus on your breath',
  whyEffective: 'Deep breathing activates the parasympathetic nervous system'
});
const mockProgress = createMockProgress({ habitId: 'habit-1' });

describe('Basic Accessibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI Components', () => {
    test('Button component should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <Button variant="primary" size="md">
            Click me
          </Button>
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Button with different variants should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button disabled>Disabled Button</Button>
          </div>
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Card component should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <Card>
            <CardHeader>
              <h2>Card Title</h2>
            </CardHeader>
            <CardContent>
              <p>This is card content with some text.</p>
            </CardContent>
            <CardFooter>
              <Button variant="primary">Action</Button>
            </CardFooter>
          </Card>
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Input component should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <form>
            <div>
              <label htmlFor="test-input">Test Input</label>
              <Input 
                id="test-input"
                placeholder="Enter some text"
                aria-describedby="input-help"
              />
              <div id="input-help">This is help text for the input</div>
            </div>
          </form>
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Input with different states should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <form>
            <div>
              <label htmlFor="input-normal">Normal Input</label>
              <Input id="input-normal" />
            </div>
            
            <div>
              <label htmlFor="input-error">Input with Error</label>
              <Input 
                id="input-error" 
                aria-invalid="true"
                aria-describedby="error-message"
              />
              <div id="error-message" role="alert">This field is required</div>
            </div>
            
            <div>
              <label htmlFor="input-disabled">Disabled Input</label>
              <Input id="input-disabled" disabled />
            </div>
          </form>
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('HabitChecklistCard Component', () => {
    test('habit card should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <HabitChecklistCard 
            habit={mockHabit} 
            progress={mockProgress}
            showActions={true}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
          />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('completed habit card should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <HabitChecklistCard 
            habit={mockHabit} 
            progress={{...mockProgress, completions: [new Date().toISOString().split('T')[0]]}}
            showActions={true}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
          />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Components', () => {
    test('accessible form should have no violations', async () => {
      const AccessibleForm = () => (
        <form role="form" aria-labelledby="form-title">
          <h2 id="form-title">Create Custom Habit</h2>
          
          <div>
            <label htmlFor="habit-title">Habit Title</label>
            <Input 
              id="habit-title"
              name="title"
              type="text"
              required
              aria-describedby="title-help"
            />
            <div id="title-help">Enter a descriptive name for your habit</div>
          </div>
          
          <div>
            <label htmlFor="habit-category">Category</label>
            <select id="habit-category" name="category" required>
              <option value="">Select a category</option>
              <option value="mindfulness">Mindfulness</option>
              <option value="exercise">Exercise</option>
              <option value="nutrition">Nutrition</option>
            </select>
          </div>
          
          <fieldset>
            <legend>Difficulty Level</legend>
            <div>
              <input type="radio" id="easy" name="difficulty" value="easy" />
              <label htmlFor="easy">Easy</label>
            </div>
            <div>
              <input type="radio" id="intermediate" name="difficulty" value="intermediate" />
              <label htmlFor="intermediate">Intermediate</label>
            </div>
            <div>
              <input type="radio" id="advanced" name="difficulty" value="advanced" />
              <label htmlFor="advanced">Advanced</label>
            </div>
          </fieldset>
          
          <Button type="submit" aria-describedby="submit-help">
            Create Habit
          </Button>
          <div id="submit-help">This will add the habit to your daily routine</div>
        </form>
      );

      const { container } = render(
        <TestWrapper>
          <AccessibleForm />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Interactive Elements', () => {
    test('buttons should have proper ARIA attributes', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <button aria-label="Complete breathing exercise">
              ✓
            </button>
            <button aria-expanded="false" aria-controls="instructions-1">
              Show Instructions
            </button>
            <div id="instructions-1" hidden>
              <p>Find a comfortable position...</p>
            </div>
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('navigation elements should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <nav aria-label="Main navigation">
              <ul role="tablist">
                <li role="none">
                  <button 
                    role="tab" 
                    aria-selected="true" 
                    aria-controls="today-panel"
                    tabIndex={0}
                  >
                    Today
                  </button>
                </li>
                <li role="none">
                  <button 
                    role="tab" 
                    aria-selected="false" 
                    aria-controls="habits-panel"
                    tabIndex={-1}
                  >
                    My Habits
                  </button>
                </li>
              </ul>
            </nav>
            
            {/* Tab panels that the aria-controls reference */}
            <div id="today-panel" role="tabpanel" aria-labelledby="today-tab">
              <h2>Today's Habits</h2>
              <p>Content for today's tab</p>
            </div>
            <div id="habits-panel" role="tabpanel" aria-labelledby="habits-tab" hidden>
              <h2>My Habits</h2>
              <p>Content for habits tab</p>
            </div>
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('modal dialog should be accessible', async () => {
      const AccessibleModal = () => (
        <div 
          role="dialog" 
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <div>
            <h2 id="modal-title">Habit Completion Confirmation</h2>
            <p id="modal-description">
              Great job! You've completed your breathing exercise.
            </p>
            
            <div>
              <Button type="button" aria-label="Close dialog">
                Close
              </Button>
              <Button type="button" aria-label="View progress details">
                View Progress
              </Button>
            </div>
          </div>
        </div>
      );

      const { container } = render(
        <TestWrapper>
          <AccessibleModal />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Data Display', () => {
    test('progress indicators should be accessible', async () => {
      const AccessibleProgress = () => (
        <div>
          <h3 id="progress-title">Daily Progress</h3>
          
          <div 
            role="progressbar" 
            aria-valuenow={67} 
            aria-valuemin={0} 
            aria-valuemax={100}
            aria-labelledby="progress-title"
          >
            <span className="sr-only">Progress: 67% complete</span>
            <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', height: '0.5rem' }}>
              <div 
                style={{ width: '67%', backgroundColor: '#10b981', height: '0.5rem', borderRadius: '0.25rem' }}
                aria-hidden="true"
              ></div>
            </div>
          </div>
          
          <p>2 out of 3 habits completed today</p>
        </div>
      );

      const { container } = render(
        <TestWrapper>
          <AccessibleProgress />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('data tables should be accessible', async () => {
      const AccessibleTable = () => (
        <div>
          <h3>Habit Progress Summary</h3>
          <table>
            <caption>Weekly completion rates for all habits</caption>
            <thead>
              <tr>
                <th scope="col">Habit</th>
                <th scope="col">Completion Rate</th>
                <th scope="col">Current Streak</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Breathing Exercise</th>
                <td>85%</td>
                <td>5 days</td>
              </tr>
              <tr>
                <th scope="row">Morning Walk</th>
                <td>70%</td>
                <td>2 days</td>
              </tr>
            </tbody>
          </table>
        </div>
      );

      const { container } = render(
        <TestWrapper>
          <AccessibleTable />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});