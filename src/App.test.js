import { render, screen } from '@testing-library/react';
import App from './App';

test('renders ScienceHabits app loading state', () => {
  render(<App />);
  const loadingElement = screen.getByText(/Loading ScienceHabits/i);
  expect(loadingElement).toBeInTheDocument();
});
