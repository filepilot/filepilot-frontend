import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, val) => { store[key] = String(val); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _store: () => store,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

function UserDisplay() {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
      <button onClick={() => login({ token: 'tok.eyJleHAiOjk5OTk5OTk5OTl9.sig', username: 'alice', role: 'AUTHOR' })}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function renderWithAuth(ui = <UserDisplay />) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('starts with null user when localStorage is empty', () => {
    renderWithAuth();
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('hydrates user from localStorage on mount', () => {
    const stored = { username: 'bob', role: 'READER' };
    localStorageMock._store()['filepilot_user'] = JSON.stringify(stored);
    renderWithAuth();
    expect(screen.getByTestId('user').textContent).toContain('bob');
  });

  it('returns null when localStorage value is corrupt JSON', () => {
    localStorageMock._store()['filepilot_user'] = '{broken json';
    renderWithAuth();
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('login() saves token and user to localStorage and updates state', () => {
    renderWithAuth();
    act(() => {
      screen.getByText('login').click();
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith('filepilot_token', expect.any(String));
    expect(localStorageMock.setItem).toHaveBeenCalledWith('filepilot_user', expect.stringContaining('alice'));
    expect(screen.getByTestId('user').textContent).toContain('alice');
  });

  it('login() strips token from user state (token not stored in user object)', () => {
    renderWithAuth();
    act(() => {
      screen.getByText('login').click();
    });
    const userState = JSON.parse(screen.getByTestId('user').textContent);
    expect(userState.token).toBeUndefined();
    expect(userState.username).toBe('alice');
  });

  it('logout() clears localStorage and resets user to null', () => {
    renderWithAuth();
    act(() => { screen.getByText('login').click(); });
    act(() => { screen.getByText('logout').click(); });
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('filepilot_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('filepilot_user');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });
});
