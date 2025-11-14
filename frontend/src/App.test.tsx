import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

jest.mock(
  'react-router-dom',
  () => {
  const React = require('react');
  const navigate = jest.fn();
  const noop: React.FC = ({ children }) => <>{children}</>;
  return {
    HashRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="router">{children}</div>,
    Routes: ({ children }: { children: React.ReactNode }) => <div data-testid="routes">{children}</div>,
    Route: ({ element }: { element: React.ReactElement }) => element,
    Outlet: () => <div data-testid="outlet" />,
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
    NavLink: ({ children, ...props }: any) => <a {...props}>{children}</a>,
    useNavigate: () => navigate,
    useLocation: () => ({ pathname: '/' }),
    useParams: () => ({}),
    useMatch: () => null,
    useResolvedPath: () => ({}),
    Navigate: noop,
  };
},
  { virtual: true }
);

describe('App', () => {
  test('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });
});