import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// Mock heavy deps so this test stays unit-level
// ---------------------------------------------------------------------------
vi.mock('../api/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('../components/MiniDemo', () => ({ default: () => <div data-testid="mini-demo" /> }));
vi.mock('../components/Header', () => ({ default: () => <nav data-testid="header" /> }));
vi.mock('../components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

import api from '../api/api';
import LandingPage from '../pages/LandingPage';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderLanding() {
  return render(
    <AuthContext.Provider value={{ user: null, login: mockLogin, logout: vi.fn() }}>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LandingPage – structure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the hero headline', () => {
    renderLanding();
    expect(screen.getByRole('heading', { name: /get clear/i })).toBeInTheDocument();
  });

  it('renders the login form with username and password fields', () => {
    renderLanding();
    expect(screen.getByPlaceholderText(/enter your username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
  });

  it('renders the login button', () => {
    renderLanding();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('renders the FAQ section heading', () => {
    renderLanding();
    expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument();
  });
});

describe('LandingPage – FAQ accordion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('FAQ answers are hidden by default', () => {
    renderLanding();
    expect(screen.queryByText(/document version control system/i)).toBeNull();
  });

  it('clicking a FAQ question reveals the answer', () => {
    renderLanding();
    const firstQuestion = screen.getByText(/what is filepilot/i);
    fireEvent.click(firstQuestion.closest('button'));
    expect(screen.getByText(/document version control system/i)).toBeInTheDocument();
  });

  it('clicking an open FAQ question collapses it again', () => {
    renderLanding();
    const btn = screen.getByText(/what is filepilot/i).closest('button');
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.queryByText(/document version control system/i)).toBeNull();
  });
});

describe('LandingPage – login form', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates input values as user types', () => {
    renderLanding();
    const usernameInput = screen.getByPlaceholderText(/enter your username/i);
    fireEvent.change(usernameInput, { target: { name: 'username', value: 'alice' } });
    expect(usernameInput.value).toBe('alice');
  });

  it('clears error message when user starts typing after a failed attempt', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials. Please try again.' } } });
    renderLanding();
    fireEvent.change(screen.getByPlaceholderText(/enter your username/i), { target: { name: 'username', value: 'x' } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { name: 'password', value: 'y' } });
    fireEvent.submit(screen.getByRole('button', { name: /login/i }).closest('form'));
    await waitFor(() => expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/enter your username/i), { target: { name: 'username', value: 'alice' } });
    expect(screen.queryByText(/invalid credentials/i)).toBeNull();
  });

  it('calls api.post with credentials on submit', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'tok', username: 'alice', role: 'READER' } });
    renderLanding();
    fireEvent.change(screen.getByPlaceholderText(/enter your username/i), { target: { name: 'username', value: 'alice' } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { name: 'password', value: 'secret' } });
    fireEvent.submit(screen.getByRole('button', { name: /login/i }).closest('form'));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/login', { username: 'alice', password: 'secret' }));
  });

  it('calls login() and navigates to /dashboard on success', async () => {
    const data = { token: 'tok', username: 'alice', role: 'READER' };
    api.post.mockResolvedValueOnce({ data });
    renderLanding();
    fireEvent.change(screen.getByPlaceholderText(/enter your username/i), { target: { name: 'username', value: 'alice' } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { name: 'password', value: 'secret' } });
    fireEvent.submit(screen.getByRole('button', { name: /login/i }).closest('form'));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith(data));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows an error message on failed login', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Bad credentials' } } });
    renderLanding();
    fireEvent.change(screen.getByPlaceholderText(/enter your username/i), { target: { name: 'username', value: 'alice' } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { name: 'password', value: 'wrong' } });
    fireEvent.submit(screen.getByRole('button', { name: /login/i }).closest('form'));
    await waitFor(() => expect(screen.getByText('Bad credentials')).toBeInTheDocument());
  });

  it('shows a fallback error message when server gives no message', async () => {
    api.post.mockRejectedValueOnce(new Error('Network error'));
    renderLanding();
    fireEvent.change(screen.getByPlaceholderText(/enter your username/i), { target: { name: 'username', value: 'a' } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { name: 'password', value: 'b' } });
    fireEvent.submit(screen.getByRole('button', { name: /login/i }).closest('form'));
    await waitFor(() => expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument());
  });
});
