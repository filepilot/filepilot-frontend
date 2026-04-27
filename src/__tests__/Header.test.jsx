import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext';

// Re-export the context so tests can provide values directly
// (AuthContext is not exported by default — we wrap via value prop)

function renderHeader(user = null, pathname = '/') {
  // Wrap in MemoryRouter pointing at the given pathname
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <AuthContext.Provider value={{ user, login: vi.fn(), logout: vi.fn() }}>
        <Header />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('Header – unauthenticated', () => {
  it('shows "Try Filepilot" CTA on landing page', () => {
    renderHeader(null, '/');
    expect(screen.getByRole('link', { name: /try filepilot/i })).toBeInTheDocument();
  });

  it('shows "Log in" link when not on landing page', () => {
    renderHeader(null, '/register');
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
  });

  it('does NOT show Documents link', () => {
    renderHeader(null, '/');
    expect(screen.queryByRole('link', { name: /documents/i })).toBeNull();
  });
});

describe('Header – READER user', () => {
  const reader = { username: 'alice', role: 'READER' };

  it('shows username and role badge', () => {
    renderHeader(reader, '/dashboard');
    expect(screen.getAllByText('alice').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('READER').length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT show Reviews link', () => {
    renderHeader(reader, '/dashboard');
    expect(screen.queryByRole('link', { name: /reviews/i })).toBeNull();
  });

  it('does NOT show Admin link', () => {
    renderHeader(reader, '/dashboard');
    expect(screen.queryByRole('link', { name: /admin/i })).toBeNull();
  });
});

describe('Header – REVIEWER user', () => {
  const reviewer = { username: 'bob', role: 'REVIEWER' };

  it('shows Reviews link', () => {
    renderHeader(reviewer, '/dashboard');
    expect(screen.getByRole('link', { name: /reviews/i })).toBeInTheDocument();
  });

  it('does NOT show Admin link', () => {
    renderHeader(reviewer, '/dashboard');
    expect(screen.queryByRole('link', { name: /admin/i })).toBeNull();
  });
});

describe('Header – ADMIN user', () => {
  const admin = { username: 'carol', role: 'ADMIN' };

  it('shows both Reviews and Admin links', () => {
    renderHeader(admin, '/dashboard');
    expect(screen.getByRole('link', { name: /reviews/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
  });
});

describe('Header – mobile menu', () => {
  const user = { username: 'dave', role: 'AUTHOR' };

  it('hamburger button is present', () => {
    renderHeader(user, '/dashboard');
    expect(screen.getByLabelText(/toggle menu/i)).toBeInTheDocument();
  });

  it('mobile menu is hidden by default (Dashboard link is mobile-only)', () => {
    renderHeader(user, '/documents'); // not on /dashboard so no redirect confusion
    // "Dashboard" link only appears inside the mobile dropdown, not in desktop nav
    expect(screen.queryByRole('link', { name: /^dashboard$/i })).toBeNull();
  });

  it('clicking hamburger reveals the mobile Dashboard link', () => {
    renderHeader(user, '/documents');
    fireEvent.click(screen.getByLabelText(/toggle menu/i));
    // "Dashboard" link is only in the mobile menu
    expect(screen.getByRole('link', { name: /^dashboard$/i })).toBeInTheDocument();
  });

  it('clicking hamburger twice closes the mobile menu again', () => {
    renderHeader(user, '/documents');
    const burger = screen.getByLabelText(/toggle menu/i);
    fireEvent.click(burger);
    fireEvent.click(burger);
    expect(screen.queryByRole('link', { name: /^dashboard$/i })).toBeNull();
  });
});
