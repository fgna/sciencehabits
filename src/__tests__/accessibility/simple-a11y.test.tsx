import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TestWrapper } from '../utils/testUtils';

// Import existing components
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Simple Accessibility Tests', () => {
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
            <button aria-expanded="false" aria-controls="instructions-panel">
              Show Instructions
            </button>
            <div id="instructions-panel" hidden>
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
            
            <div id="today-panel" role="tabpanel" aria-labelledby="today-tab">
              <h2>Today's Content</h2>
            </div>
            
            <div id="habits-panel" role="tabpanel" aria-labelledby="habits-tab" hidden>
              <h2>Habits Content</h2>
            </div>
          </nav>
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
            <div style={{ 
              width: '100%', 
              backgroundColor: '#e5e7eb', 
              borderRadius: '0.25rem', 
              height: '0.5rem' 
            }}>
              <div 
                style={{ 
                  width: '67%', 
                  backgroundColor: '#10b981', 
                  height: '0.5rem', 
                  borderRadius: '0.25rem' 
                }}
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

    test('live regions should be accessible', async () => {
      const LiveRegionExample = () => (
        <div>
          <h3>Habit Completion Status</h3>
          
          {/* Polite announcements */}
          <div aria-live="polite" aria-atomic="true">
            <span className="sr-only">
              You have completed 2 out of 3 habits today
            </span>
          </div>
          
          {/* Alert for important updates */}
          <div role="status" aria-live="polite">
            <p>Your daily progress has been saved</p>
          </div>
          
          {/* Alert region for errors */}
          <div role="alert" aria-live="assertive" style={{ display: 'none' }}>
            <p>Error: Failed to save habit completion</p>
          </div>
        </div>
      );

      const { container } = render(
        <TestWrapper>
          <LiveRegionExample />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    test('focusable elements should have proper tab order', async () => {
      const KeyboardNavigationExample = () => (
        <div>
          <h2>Habit Management</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Button tabIndex={0}>First Button</Button>
            <Button tabIndex={0}>Second Button</Button>
            <Button tabIndex={0}>Third Button</Button>
            
            <Input 
              placeholder="Enter habit name"
              tabIndex={0}
              aria-label="Habit name"
            />
            
            <select tabIndex={0} aria-label="Select category">
              <option value="">Choose category</option>
              <option value="exercise">Exercise</option>
              <option value="mindfulness">Mindfulness</option>
            </select>
            
            <Button tabIndex={0}>Submit</Button>
          </div>
        </div>
      );

      const { container } = render(
        <TestWrapper>
          <KeyboardNavigationExample />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('skip links should be accessible', async () => {
      const SkipLinksExample = () => (
        <div>
          {/* Skip link for keyboard navigation */}
          <a href="#main-content" style={{ 
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px'
          }}>
            Skip to main content
          </a>
          
          <nav aria-label="Primary navigation">
            <ul>
              <li><a href="#section1">Section 1</a></li>
              <li><a href="#section2">Section 2</a></li>
              <li><a href="#section3">Section 3</a></li>
            </ul>
          </nav>
          
          <main id="main-content">
            <h1>Main Content</h1>
            <p>This is the main content area</p>
          </main>
        </div>
      );

      const { container } = render(
        <TestWrapper>
          <SkipLinksExample />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});