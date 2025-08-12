import React, { useState, useEffect } from 'react';
import { Habit, HabitProgress, User } from '../../types';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'accessibility' | 'usability' | 'performance' | 'visual' | 'integration';
  priority: 'critical' | 'high' | 'medium' | 'low';
  automated: boolean;
  steps: string[];
  expectedResult: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  lastRun?: string;
  failureReason?: string;
  performance?: {
    renderTime: number;
    interactionDelay: number;
  };
}

interface TestSuiteResults {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage: number;
  performance: {
    averageRenderTime: number;
    slowestComponent: string;
    interactionResponsiveness: number;
  };
}

interface UXTestSuiteProps {
  user: User;
  testMode?: boolean;
}

export function UXTestSuite({ user, testMode = false }: UXTestSuiteProps) {
  const { animationsEnabled, emotionalDesign } = useUIPreferencesStore();
  const [activeCategory, setActiveCategory] = useState<TestCase['category']>('usability');
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestSuiteResults>({
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    coverage: 0,
    performance: {
      averageRenderTime: 0,
      slowestComponent: '',
      interactionResponsiveness: 0
    }
  });
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  // Initialize comprehensive test cases for all UX enhancements
  useEffect(() => {
    const initialTestCases: TestCase[] = [
      // Accessibility Tests
      {
        id: 'a11y-keyboard-navigation',
        name: 'Keyboard Navigation',
        description: 'All interactive elements are accessible via keyboard',
        category: 'accessibility',
        priority: 'critical',
        automated: true,
        steps: [
          'Tab through all interactive elements',
          'Verify focus indicators are visible',
          'Test Enter/Space activation',
          'Verify logical tab order'
        ],
        expectedResult: 'All elements accessible via keyboard with clear focus indicators',
        status: 'pending'
      },
      {
        id: 'a11y-screen-reader',
        name: 'Screen Reader Compatibility',
        description: 'Content is properly announced by screen readers',
        category: 'accessibility',
        priority: 'critical',
        automated: false,
        steps: [
          'Enable screen reader (NVDA/JAWS/VoiceOver)',
          'Navigate through habit cards',
          'Test progress announcements',
          'Verify ARIA labels and descriptions'
        ],
        expectedResult: 'All content meaningfully announced with proper context',
        status: 'pending'
      },
      {
        id: 'a11y-color-contrast',
        name: 'Color Contrast Compliance',
        description: 'All text meets WCAG 2.1 AA contrast requirements',
        category: 'accessibility',
        priority: 'high',
        automated: true,
        steps: [
          'Check all text/background color combinations',
          'Test in high contrast mode',
          'Verify button states have sufficient contrast',
          'Test with color blindness simulation'
        ],
        expectedResult: 'Contrast ratio >= 4.5:1 for normal text, 3:1 for large text',
        status: 'pending'
      },

      // Usability Tests
      {
        id: 'usability-habit-creation',
        name: 'Habit Creation Flow',
        description: 'Users can easily create and configure habits',
        category: 'usability',
        priority: 'critical',
        automated: false,
        steps: [
          'Click "Add Habit" button',
          'Fill out habit creation form',
          'Configure difficulty and timing',
          'Save and verify habit appears in list'
        ],
        expectedResult: 'Habit created successfully with all settings preserved',
        status: 'pending'
      },
      {
        id: 'usability-progress-understanding',
        name: 'Progress Visualization Clarity',
        description: 'Users understand their progress at a glance',
        category: 'usability',
        priority: 'high',
        automated: false,
        steps: [
          'Open progress dashboard',
          'Review streak visualizations',
          'Check heatmap understanding',
          'Verify category breakdowns are clear'
        ],
        expectedResult: 'Progress information is immediately understandable',
        status: 'pending'
      },
      {
        id: 'usability-smart-scheduling',
        name: 'Smart Scheduling Adoption',
        description: 'Users understand and adopt smart scheduling suggestions',
        category: 'usability',
        priority: 'medium',
        automated: false,
        steps: [
          'Enable smart scheduling',
          'Review time recommendations',
          'Accept or modify suggestions',
          'Verify scheduling works as expected'
        ],
        expectedResult: 'Smart scheduling recommendations are clear and actionable',
        status: 'pending'
      },

      // Performance Tests
      {
        id: 'perf-component-render',
        name: 'Component Render Performance',
        description: 'All components render within performance budgets',
        category: 'performance',
        priority: 'high',
        automated: true,
        steps: [
          'Measure initial render time',
          'Test with large habit lists',
          'Monitor memory usage',
          'Check for render blocking'
        ],
        expectedResult: 'Components render in <100ms, no janky animations',
        status: 'pending'
      },
      {
        id: 'perf-interaction-responsiveness',
        name: 'Interaction Responsiveness',
        description: 'User interactions feel immediate and responsive',
        category: 'performance',
        priority: 'high',
        automated: true,
        steps: [
          'Click habit completion checkboxes',
          'Test form input responsiveness',
          'Measure animation performance',
          'Check for input lag'
        ],
        expectedResult: 'Interactions respond within 16ms (60fps)',
        status: 'pending'
      },

      // Visual Design Tests
      {
        id: 'visual-design-consistency',
        name: 'Design System Consistency',
        description: 'Visual elements follow the design system consistently',
        category: 'visual',
        priority: 'medium',
        automated: false,
        steps: [
          'Review color usage across components',
          'Check typography consistency',
          'Verify spacing and layout alignment',
          'Test responsive behavior'
        ],
        expectedResult: 'Consistent use of design tokens and patterns',
        status: 'pending'
      },
      {
        id: 'visual-emotional-design',
        name: 'Emotional Design Impact',
        description: 'Compassionate design elements create positive emotional response',
        category: 'visual',
        priority: 'medium',
        automated: false,
        steps: [
          'Review motivational messaging tone',
          'Test recovery support messaging',
          'Evaluate celebration animations',
          'Check overall emotional impact'
        ],
        expectedResult: 'Design creates supportive, encouraging emotional experience',
        status: 'pending'
      },

      // Integration Tests
      {
        id: 'integration-adaptive-difficulty',
        name: 'Adaptive Difficulty System',
        description: 'Difficulty adjustments work correctly across the app',
        category: 'integration',
        priority: 'high',
        automated: true,
        steps: [
          'Create habits with varying completion rates',
          'Verify difficulty adjustment triggers',
          'Test recommendation generation',
          'Check user notification of changes'
        ],
        expectedResult: 'Difficulty adjusts appropriately based on user performance',
        status: 'pending'
      },
      {
        id: 'integration-recovery-system',
        name: 'Recovery System Workflow',
        description: 'Recovery detection and support work end-to-end',
        category: 'integration',
        priority: 'high',
        automated: true,
        steps: [
          'Simulate streak breaking scenario',
          'Verify recovery detection triggers',
          'Test compassion message display',
          'Check habit adjustment suggestions'
        ],
        expectedResult: 'Recovery system provides appropriate support when needed',
        status: 'pending'
      },
      {
        id: 'integration-personalization',
        name: 'Personalization Settings Impact',
        description: 'Personalization settings affect user experience correctly',
        category: 'integration',
        priority: 'medium',
        automated: true,
        steps: [
          'Change personalization level',
          'Verify feature availability changes',
          'Test data collection preferences',
          'Check recommendation relevance'
        ],
        expectedResult: 'Personalization settings properly control feature behavior',
        status: 'pending'
      },

      // Onboarding Tests
      {
        id: 'onboarding-flow-completion',
        name: 'Onboarding Flow Completion',
        description: 'Users can complete onboarding successfully',
        category: 'usability',
        priority: 'critical',
        automated: false,
        steps: [
          'Start fresh user onboarding',
          'Complete each phase step by step',
          'Verify progress tracking works',
          'Check completion celebration'
        ],
        expectedResult: 'Onboarding guides users to successful app adoption',
        status: 'pending'
      }
    ];

    setTestCases(initialTestCases);
    updateTestResults(initialTestCases);
  }, []);

  const updateTestResults = (tests: TestCase[]) => {
    const total = tests.length;
    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    const skipped = tests.filter(t => t.status === 'skipped').length;
    const coverage = total > 0 ? ((passed + failed) / total) * 100 : 0;

    setTestResults({
      totalTests: total,
      passed,
      failed,
      skipped,
      coverage,
      performance: {
        averageRenderTime: calculateAverageRenderTime(tests),
        slowestComponent: findSlowestComponent(tests),
        interactionResponsiveness: calculateResponsiveness(tests)
      }
    });
  };

  const calculateAverageRenderTime = (tests: TestCase[]): number => {
    const perfTests = tests.filter(t => t.performance?.renderTime);
    if (perfTests.length === 0) return 0;
    const total = perfTests.reduce((sum, t) => sum + (t.performance?.renderTime || 0), 0);
    return total / perfTests.length;
  };

  const findSlowestComponent = (tests: TestCase[]): string => {
    let slowest = '';
    let maxTime = 0;
    tests.forEach(test => {
      if (test.performance?.renderTime && test.performance.renderTime > maxTime) {
        maxTime = test.performance.renderTime;
        slowest = test.name;
      }
    });
    return slowest;
  };

  const calculateResponsiveness = (tests: TestCase[]): number => {
    const interactionTests = tests.filter(t => t.performance?.interactionDelay);
    if (interactionTests.length === 0) return 0;
    const total = interactionTests.reduce((sum, t) => sum + (t.performance?.interactionDelay || 0), 0);
    return total / interactionTests.length;
  };

  const runAutomatedTests = async () => {
    setRunningTests(true);
    const updatedTests = [...testCases];

    for (let i = 0; i < updatedTests.length; i++) {
      const test = updatedTests[i];
      if (!test.automated) continue;

      // Simulate running the test
      updatedTests[i] = { ...test, status: 'running' };
      setTestCases([...updatedTests]);
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate test execution

      // Mock test results based on test type
      const mockResult = await simulateTestExecution(test);
      updatedTests[i] = {
        ...test,
        status: mockResult.status,
        lastRun: new Date().toISOString(),
        failureReason: mockResult.failureReason,
        performance: mockResult.performance
      };
      
      setTestCases([...updatedTests]);
      updateTestResults(updatedTests);
    }

    setRunningTests(false);
  };

  const simulateTestExecution = async (test: TestCase): Promise<{
    status: TestCase['status'];
    failureReason?: string;
    performance?: TestCase['performance'];
  }> => {
    // Mock test execution - in real implementation, this would run actual tests
    const random = Math.random();
    
    if (test.category === 'performance') {
      return {
        status: random > 0.1 ? 'passed' : 'failed',
        failureReason: random <= 0.1 ? 'Render time exceeded 100ms threshold' : undefined,
        performance: {
          renderTime: Math.random() * 150 + 20, // 20-170ms
          interactionDelay: Math.random() * 30 + 5  // 5-35ms
        }
      };
    }

    if (test.category === 'accessibility') {
      return {
        status: random > 0.05 ? 'passed' : 'failed',
        failureReason: random <= 0.05 ? 'Missing ARIA labels detected' : undefined
      };
    }

    return {
      status: random > 0.15 ? 'passed' : 'failed',
      failureReason: random <= 0.15 ? 'Test assertion failed - see details' : undefined
    };
  };

  const runManualTest = (testId: string) => {
    const updatedTests = testCases.map(test => 
      test.id === testId 
        ? { ...test, status: 'passed' as const, lastRun: new Date().toISOString() }
        : test
    );
    setTestCases(updatedTests);
    updateTestResults(updatedTests);
  };

  const skipTest = (testId: string) => {
    const updatedTests = testCases.map(test => 
      test.id === testId 
        ? { ...test, status: 'skipped' as const }
        : test
    );
    setTestCases(updatedTests);
    updateTestResults(updatedTests);
  };

  const getStatusIcon = (status: TestCase['status']) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      case 'skipped': return '⏭️';
      default: return '⚪';
    }
  };

  const getPriorityColor = (priority: TestCase['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: TestCase['category']) => {
    switch (category) {
      case 'accessibility': return 'text-blue-600 bg-blue-100';
      case 'usability': return 'text-green-600 bg-green-100';
      case 'performance': return 'text-purple-600 bg-purple-100';
      case 'visual': return 'text-pink-600 bg-pink-100';
      case 'integration': return 'text-indigo-600 bg-indigo-100';
    }
  };

  const filteredTests = testCases.filter(test => test.category === activeCategory);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">UX Test Suite</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive testing for enhanced user experience features
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={runAutomatedTests}
            disabled={runningTests}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${runningTests 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-progress-600 text-white hover:bg-progress-700'
              }
            `}
          >
            {runningTests ? 'Running Tests...' : 'Run Automated Tests'}
          </button>
        </div>
      </div>

      {/* Test Results Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{testResults.totalTests}</div>
          <div className="text-sm text-gray-600">Total Tests</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{testResults.passed}</div>
          <div className="text-sm text-gray-600">Passed</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{testResults.failed}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{testResults.skipped}</div>
          <div className="text-sm text-gray-600">Skipped</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-progress-600">{Math.round(testResults.coverage)}%</div>
          <div className="text-sm text-gray-600">Coverage</div>
        </div>
      </div>

      {/* Performance Metrics */}
      {testResults.performance.averageRenderTime > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-lg font-bold text-purple-600">
                {Math.round(testResults.performance.averageRenderTime)}ms
              </div>
              <div className="text-sm text-gray-600">Avg Render Time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-indigo-600">
                {Math.round(testResults.performance.interactionResponsiveness)}ms
              </div>
              <div className="text-sm text-gray-600">Interaction Delay</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">
                {testResults.performance.slowestComponent || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Slowest Component</div>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        {['accessibility', 'usability', 'performance', 'visual', 'integration'].map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category as TestCase['category'])}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize
              ${activeCategory === category 
                ? 'bg-white text-progress-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {category}
            <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-1">
              {testCases.filter(t => t.category === category).length}
            </span>
          </button>
        ))}
      </div>

      {/* Test Cases */}
      <div className="space-y-4">
        {filteredTests.map(test => (
          <div key={test.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start flex-1">
                <div className="mr-3 mt-1 text-xl">
                  {getStatusIcon(test.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="font-semibold text-gray-900">{test.name}</h3>
                    <span className={`ml-3 px-2 py-1 text-xs rounded-full ${getPriorityColor(test.priority)}`}>
                      {test.priority}
                    </span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getCategoryColor(test.category)}`}>
                      {test.category}
                    </span>
                    {test.automated && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Automated
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{test.description}</p>
                  
                  {/* Test Steps */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <h4 className="font-medium text-gray-900 mb-2">Test Steps:</h4>
                    <ol className="text-sm text-gray-600 space-y-1">
                      {test.steps.map((step, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-progress-500 mr-2">{index + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="text-sm">
                    <strong className="text-gray-900">Expected Result:</strong>
                    <span className="text-gray-600 ml-1">{test.expectedResult}</span>
                  </div>

                  {test.failureReason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <div className="font-medium text-red-800">Failure Reason:</div>
                      <div className="text-red-700 text-sm">{test.failureReason}</div>
                    </div>
                  )}

                  {test.performance && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                      <div className="font-medium text-purple-800 mb-1">Performance Metrics:</div>
                      <div className="text-purple-700 text-sm space-y-1">
                        <div>Render Time: {Math.round(test.performance.renderTime)}ms</div>
                        <div>Interaction Delay: {Math.round(test.performance.interactionDelay)}ms</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Test Actions */}
              <div className="flex items-center space-x-2">
                {!test.automated && test.status === 'pending' && (
                  <>
                    <button
                      onClick={() => runManualTest(test.id)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark Passed
                    </button>
                    <button
                      onClick={() => skipTest(test.id)}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Skip
                    </button>
                  </>
                )}
                
                {test.lastRun && (
                  <div className="text-xs text-gray-500">
                    Last run: {new Date(test.lastRun).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTests.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No tests found for the selected category</div>
        </div>
      )}
    </div>
  );
}