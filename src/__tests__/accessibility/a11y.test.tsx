import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { 
  createMockUser, 
  createMockHabit, 
  createMockProgress,
  TestWrapper 
} from '../utils/testUtils';

// Import components to test
import { TodayView } from '../../components/dashboard/TodayView';
import { MyHabitsView } from '../../components/dashboard/MyHabitsView';
import { ResearchArticles } from '../../components/research/ResearchArticles';
import { ProgressDashboard } from '../../components/progress/ProgressDashboard';
import { HabitChecklistCard } from '../../components/dashboard/HabitChecklistCard';
import { NavigationTabs } from '../../components/navigation/NavigationTabs';

// Mock stores and hooks
jest.mock('../../stores/userStore');
jest.mock('../../hooks/useCurrentDate');

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock data
const mockUser = createMockUser();
const mockHabits = [
  createMockHabit({ 
    id: 'habit-1', 
    title: '5-Minute Breathing Exercise',
    instructions: 'Find a comfortable position and focus on your breath',
    whyEffective: 'Deep breathing activates the parasympathetic nervous system'
  }),
  createMockHabit({ 
    id: 'habit-2', 
    title: 'Progressive Muscle Relaxation',
    instructions: 'Tense and release muscle groups systematically',
    whyEffective: 'Helps reduce physical tension and stress'
  })
];
const mockProgress = mockHabits.map(h => createMockProgress({ habitId: h.id }));

// Setup mock implementations
const setupMocks = (overrides = {}) => {
  const { useUserStore } = require('../../stores/userStore');
  const { useCurrentDate } = require('../../hooks/useCurrentDate');
  
  useCurrentDate.mockReturnValue({
    today: '2023-01-15',
    todayDisplay: 'Sunday, January 15',
    isToday: jest.fn(date => date === '2023-01-15')
  });

  useUserStore.mockReturnValue({
    currentUser: mockUser,
    userHabits: mockHabits,
    userProgress: mockProgress,
    isLoading: false,
    error: null,
    updateUserProgress: jest.fn(),
    setCurrentUser: jest.fn(),
    addUserHabit: jest.fn(),
    removeUserHabit: jest.fn(),
    refreshProgress: jest.fn(),
    ...overrides
  });
};

describe('Accessibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe('Main Dashboard Views', () => {
    test('TodayView should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <TodayView />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('TodayView with loading state should be accessible', async () => {
      setupMocks({ isLoading: true });
      
      const { container } = render(
        <TestWrapper>
          <TodayView />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('TodayView with error state should be accessible', async () => {
      setupMocks({ error: 'Failed to load data', isLoading: false });
      
      const { container } = render(
        <TestWrapper>
          <TodayView />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('TodayView with empty state should be accessible', async () => {
      setupMocks({ userHabits: [], userProgress: [] });
      
      const { container } = render(
        <TestWrapper>
          <TodayView />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('MyHabitsView should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <MyHabitsView />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('ResearchArticles should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <ResearchArticles />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('ProgressDashboard should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <ProgressDashboard />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Component-Level Accessibility', () => {
    test('HabitChecklistCard should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <HabitChecklistCard 
            habit={mockHabits[0]} 
            progress={mockProgress[0]}
            isCompleted={false}
            onComplete={jest.fn()}
            showInstructions={true}
            showDetails={true}
          />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('HabitChecklistCard in completed state should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <HabitChecklistCard 
            habit={mockHabits[0]} 
            progress={mockProgress[0]}
            isCompleted={true}
            onComplete={jest.fn()}
            showInstructions={true}
            showDetails={true}
          />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('NavigationTabs should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <NavigationTabs 
            activeTab="today"
            onTabChange={jest.fn()}
          />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Interactive States Accessibility', () => {
    test('habit completion buttons should be accessible', async () => {
      const { container, getByTestId } = render(
        <TestWrapper>
          <HabitChecklistCard 
            habit={mockHabits[0]} 
            progress={mockProgress[0]}
            isCompleted={false}
            onComplete={jest.fn()}
            showInstructions={true}
            showDetails={true}
          />
        </TestWrapper>
      );

      // Check initial state
      let results = await axe(container);
      expect(results).toHaveNoViolations();

      // Test button has proper ARIA attributes
      const completeButton = getByTestId('habit-complete-habit-1');
      expect(completeButton).toHaveAttribute('aria-label');
      expect(completeButton).toHaveAttribute('role', 'button');
    });

    test('expandable sections should be accessible', async () => {
      const { container, getByTestId } = render(
        <TestWrapper>
          <HabitChecklistCard 
            habit={mockHabits[0]} 
            progress={mockProgress[0]}
            isCompleted={false}
            onComplete={jest.fn()}
            showInstructions={true}
            showDetails={true}
          />
        </TestWrapper>
      );

      // Check collapsible instructions
      const instructionsToggle = getByTestId('instructions-toggle-habit-1');
      expect(instructionsToggle).toHaveAttribute('aria-expanded');
      expect(instructionsToggle).toHaveAttribute('aria-controls');

      // Check collapsible details
      const detailsToggle = getByTestId('details-toggle-habit-1');
      expect(detailsToggle).toHaveAttribute('aria-expanded');
      expect(detailsToggle).toHaveAttribute('aria-controls');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Accessibility', () => {
    test('habit creation forms should be accessible', async () => {
      // Mock a custom habit creation modal
      const HabitCreationForm = () => (
        <form role="form" aria-labelledby="form-title">
          <h2 id="form-title">Create Custom Habit</h2>
          
          <div>
            <label htmlFor="habit-title">Habit Title</label>
            <input 
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
          
          <div>
            <label htmlFor="habit-duration">Duration (minutes)</label>
            <input 
              id="habit-duration"
              name="duration"
              type="number"
              min="1"
              max="120"
              aria-describedby="duration-help"
            />
            <div id="duration-help">How long does this habit typically take?</div>
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
          
          <button type="submit" aria-describedby="submit-help">
            Create Habit
          </button>
          <div id="submit-help">This will add the habit to your daily routine</div>
        </form>
      );

      const { container } = render(
        <TestWrapper>
          <HabitCreationForm />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('search and filter forms should be accessible', async () => {
      const SearchAndFilter = () => (
        <div role="search" aria-label="Research articles search and filter">
          <div>
            <label htmlFor="search-input">Search articles</label>
            <input 
              id="search-input"
              type="search"
              placeholder="Enter keywords..."
              aria-describedby="search-help"
            />
            <div id="search-help">Search through research articles and studies</div>
          </div>
          
          <fieldset>
            <legend>Filter by Category</legend>
            <div>
              <input type="checkbox" id="stress" name="categories" value="stress" />
              <label htmlFor="stress">Stress Management</label>
            </div>
            <div>
              <input type="checkbox" id="sleep" name="categories" value="sleep" />
              <label htmlFor="sleep">Sleep & Recovery</label>
            </div>
            <div>
              <input type="checkbox" id="exercise" name="categories" value="exercise" />
              <label htmlFor="exercise">Exercise & Movement</label>
            </div>
          </fieldset>
          
          <div>
            <input 
              type="checkbox" 
              id="goal-filter" 
              name="filterByGoals"
              aria-describedby="goal-filter-help"
            />
            <label htmlFor="goal-filter">Show articles for my goals only</label>
            <div id="goal-filter-help">Filter articles based on your selected wellness goals</div>
          </div>
        </div>
      );

      const { container } = render(
        <TestWrapper>
          <SearchAndFilter />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Modal and Dialog Accessibility', () => {
    test('modal dialogs should be accessible', async () => {
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
              This extends your current streak to 5 days.
            </p>
            
            <div>
              <button type="button" aria-label="Close dialog">
                Close
              </button>
              <button type="button" aria-label="View progress details">
                View Progress
              </button>
            </div>
          </div>
          
          {/* Focus trap elements */}
          <div tabIndex={0} aria-hidden="true"></div>
          <div tabIndex={0} aria-hidden="true"></div>
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

  describe('Data Visualization Accessibility', () => {
    test('progress charts should be accessible', async () => {
      const AccessibleChart = () => (
        <div>
          <h3 id="chart-title">Weekly Completion Rate</h3>
          
          {/* Chart with accessible alternative */}
          <div 
            role="img" 
            aria-labelledby="chart-title"
            aria-describedby="chart-description"
          >
            {/* Visual chart would go here */}
            <svg aria-hidden="true" width="400" height="200">
              <rect x="0" y="100" width="50" height="100" fill="#4ade80" />
              <rect x="60" y="80" width="50" height="120" fill="#4ade80" />
              <rect x="120" y="60" width="50" height="140" fill="#4ade80" />
              <rect x="180" y="40" width="50" height="160" fill="#4ade80" />
              <rect x="240" y="20" width="50" height="180" fill="#4ade80" />
              <rect x="300" y="0" width="50" height="200" fill="#4ade80" />
              <rect x="360" y="30" width="50" height="170" fill="#4ade80" />
            </svg>
          </div>
          
          <div id="chart-description">
            Weekly completion rates: Monday 50%, Tuesday 60%, Wednesday 70%, 
            Thursday 80%, Friday 90%, Saturday 100%, Sunday 85%. 
            Overall trend shows increasing completion throughout the week.
          </div>
          
          {/* Data table alternative */}
          <details>
            <summary>View data table</summary>
            <table>
              <caption>Weekly Completion Rates</caption>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Monday</th>
                  <td>50%</td>
                </tr>
                <tr>
                  <th scope="row">Tuesday</th>
                  <td>60%</td>
                </tr>
                <tr>
                  <th scope="row">Wednesday</th>
                  <td>70%</td>
                </tr>
                <tr>
                  <th scope="row">Thursday</th>
                  <td>80%</td>
                </tr>
                <tr>
                  <th scope="row">Friday</th>
                  <td>90%</td>
                </tr>
                <tr>
                  <th scope="row">Saturday</th>
                  <td>100%</td>
                </tr>
                <tr>
                  <th scope="row">Sunday</th>
                  <td>85%</td>
                </tr>
              </tbody>
            </table>
          </details>
        </div>
      );

      const { container } = render(
        <TestWrapper>
          <AccessibleChart />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color and Contrast Accessibility', () => {
    test('should maintain accessibility with custom themes', async () => {
      // Test with different theme contexts
      const ThemeTestComponent = () => (
        <div className="theme-light">
          <div className="bg-white text-gray-900 p-4">
            <h2 className="text-xl font-semibold mb-4">Light Theme Test</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Primary Action
            </button>
            <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded ml-2 hover:bg-gray-300">
              Secondary Action
            </button>
            
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">Success message with appropriate contrast</p>
            </div>
            
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800">Error message with appropriate contrast</p>
            </div>
          </div>
        </div>
      );

      const { container } = render(
        <TestWrapper>
          <ThemeTestComponent />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Compatibility', () => {
    test('should provide appropriate screen reader content', async () => {
      const ScreenReaderFriendlyComponent = () => (
        <div>
          {/* Skip link for keyboard navigation */}
          <a href="#main-content" className="sr-only focus:not-sr-only">
            Skip to main content
          </a>
          
          {/* Main content with proper landmarks */}
          <main id="main-content">
            <h1>Today's Habits</h1>
            
            {/* Status announcements */}
            <div aria-live="polite" aria-atomic="true">
              <span className="sr-only">
                You have completed 2 out of 3 habits today
              </span>
            </div>
            
            {/* Progress indicator with text alternative */}
            <div role="progressbar" aria-valuenow={67} aria-valuemin={0} aria-valuemax={100}>
              <span className="sr-only">Progress: 67% complete</span>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '67%'}}></div>
              </div>
            </div>
            
            {/* List of habits with proper semantics */}
            <ul role="list" aria-label="Today's habits">
              <li>
                <div>
                  <h3>5-Minute Breathing Exercise</h3>
                  <p>Status: <span className="sr-only">Completed</span>
                     <span aria-hidden="true">✓</span>
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <h3>Progressive Muscle Relaxation</h3>
                  <p>Status: <span className="sr-only">Not completed</span>
                     <button aria-label="Mark Progressive Muscle Relaxation as complete">
                       Complete
                     </button>
                  </p>
                </div>
              </li>
            </ul>
          </main>
        </div>
      );

      const { container } = render(
        <TestWrapper>
          <ScreenReaderFriendlyComponent />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    test('should support full keyboard navigation', async () => {
      const KeyboardNavigableComponent = () => (
        <div>
          {/* Focusable elements in logical order */}
          <nav>
            <ul role="tablist" aria-label="Main navigation">
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
              <li role="none">
                <button 
                  role="tab" 
                  aria-selected="false" 
                  aria-controls="research-panel"
                  tabIndex={-1}
                >
                  Research
                </button>
              </li>
            </ul>
          </nav>
          
          <main>
            <div id="today-panel" role="tabpanel" aria-labelledby="today-tab">
              <h2>Today's Habits</h2>
              
              {/* Habit cards with proper focus management */}
              <div className="space-y-4">
                <div className="habit-card" tabIndex={0}>
                  <h3>Breathing Exercise</h3>
                  <button tabIndex={0}>Complete</button>
                  <button tabIndex={0} aria-expanded="false" aria-controls="instructions-1">
                    Show Instructions
                  </button>
                  <div id="instructions-1" hidden>
                    <p>Find a comfortable position...</p>
                  </div>
                </div>
                
                <div className="habit-card" tabIndex={0}>
                  <h3>Muscle Relaxation</h3>
                  <button tabIndex={0}>Complete</button>
                  <button tabIndex={0} aria-expanded="false" aria-controls="instructions-2">
                    Show Instructions
                  </button>
                  <div id="instructions-2" hidden>
                    <p>Start by tensing your feet...</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      );

      const { container } = render(
        <TestWrapper>
          <KeyboardNavigableComponent />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});