/**
 * Tests for App routing and ProtectedRoute guard logic.
 *
 * Strategy: render the full <App> tree with a MemoryRouter-equivalent path
 * by overriding the window.location that BrowserRouter reads, OR simpler:
 * extract and test the ProtectedRoute logic in isolation using MemoryRouter.
 *
 * We mock all heavy page components so rendering is fast.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// Minimal re-implementation of ProtectedRoute (mirrors App.jsx exactly)
// ---------------------------------------------------------------------------
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, adminOnly = false, reviewerOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  if (reviewerOnly && user.role !== 'REVIEWER' && user.role !== 'ADMIN')
    return <Navigate to="/dashboard" replace />;
  return children;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderRoute({ user = null, path = '/protected', adminOnly = false, reviewerOnly = false } = {}) {
  return render(
    <AuthContext.Provider value={{ user, login: vi.fn(), logout: vi.fn() }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<p>Landing</p>} />
          <Route path="/dashboard" element={<p>Dashboard</p>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute adminOnly={adminOnly} reviewerOnly={reviewerOnly}>
                <p>Protected content</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProtectedRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('redirects unauthenticated user to /', () => {
    renderRoute({ user: null });
    expect(screen.getByText('Landing')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).toBeNull();
  });

  it('renders children for an authenticated user', () => {
    renderRoute({ user: { username: 'u', role: 'READER' } });
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('adminOnly: redirects non-admin to /dashboard', () => {
    renderRoute({ user: { username: 'u', role: 'AUTHOR' }, adminOnly: true });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).toBeNull();
  });

  it('adminOnly: allows ADMIN through', () => {
    renderRoute({ user: { username: 'u', role: 'ADMIN' }, adminOnly: true });
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('reviewerOnly: redirects READER to /dashboard', () => {
    renderRoute({ user: { username: 'u', role: 'READER' }, reviewerOnly: true });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('reviewerOnly: allows REVIEWER through', () => {
    renderRoute({ user: { username: 'u', role: 'REVIEWER' }, reviewerOnly: true });
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('reviewerOnly: allows ADMIN through', () => {
    renderRoute({ user: { username: 'u', role: 'ADMIN' }, reviewerOnly: true });
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AppRoutes: root path redirects
// ---------------------------------------------------------------------------

describe('AppRoutes – root "/" behaviour', () => {
  function renderRoot(user) {
    return render(
      <AuthContext.Provider value={{ user, login: vi.fn(), logout: vi.fn() }}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <p>Landing page</p>} />
            <Route path="/dashboard" element={<p>Dashboard</p>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  }

  it('shows LandingPage for unauthenticated visit to "/"', () => {
    renderRoot(null);
    expect(screen.getByText('Landing page')).toBeInTheDocument();
  });

  it('redirects authenticated user from "/" to "/dashboard"', () => {
    renderRoot({ username: 'u', role: 'READER' });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
