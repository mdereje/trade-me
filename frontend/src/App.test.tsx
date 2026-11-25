import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock(
  'react-router-dom',
  () => {
    const React = require('react');
    const navigate = jest.fn();
    const noop: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
    return {
      BrowserRouter: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="router">{children}</div>
      ),
      HashRouter: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="router">{children}</div>
      ),
      Routes: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="routes">{children}</div>
      ),
      Route: ({ element }: { element?: React.ReactElement }) => element || null,
      Outlet: () => <div data-testid="outlet" />,
      Link: ({ children, to, ...props }: any) => (
        <a href={to} {...props}>
          {children}
        </a>
      ),
      NavLink: ({ children, to, ...props }: any) => (
        <a href={to} {...props}>
          {children}
        </a>
      ),
      useNavigate: () => navigate,
      useLocation: () => ({ pathname: '/', state: null }),
      useParams: () => ({}),
      useSearchParams: () => [new URLSearchParams(), jest.fn()],
      useMatch: () => null,
      useResolvedPath: () => ({}),
      Navigate: noop,
    };
  },
  { virtual: true }
);

describe('App', () => {
  test('renders Trade Me navigation with Browse Items and Pricing links', () => {
    render(<App />);
    expect(screen.getAllByText(/Trade Me/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Browse Items/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pricing/i).length).toBeGreaterThan(0);
  });
});
