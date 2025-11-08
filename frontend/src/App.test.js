import { render, screen } from '@testing-library/react';
import App from './App';

test('renders home page with Signin button', () => {
  render(<App />);
  const signinButton = screen.getByText(/Signin/i);
  expect(signinButton).toBeInTheDocument();
});
