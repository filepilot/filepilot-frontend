import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

vi.mock('../api/api', () => ({ default: { post: vi.fn() } }));
vi.mock('../components/Header', () => ({ default: () => <nav /> }));
vi.mock('../components/Footer', () => ({ default: () => <footer /> }));

import api from '../api/api';
import RegisterPage from '../pages/RegisterPage';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderRegister() {
  return render(
    <AuthContext.Provider value={{ user: null, login: mockLogin, logout: vi.fn() }}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Password strength helpers (mirror RegisterPage.jsx logic)
// ---------------------------------------------------------------------------
function fillPassword(pw) {
  fireEvent.change(screen.getByPlaceholderText(/at least 8 characters/i), {
    target: { name: 'password', value: pw },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RegisterPage – structure', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the page heading', () => {
    renderRegister();
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  });

  it('renders username, email, and password fields', () => {
    renderRegister();
    expect(screen.getByPlaceholderText(/choose a username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your@email\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('renders the Create account button', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders the four role descriptions', () => {
    renderRegister();
    // Use getAllByText since "Reader" appears in both the <strong> intro line and the role grid
    expect(screen.getAllByText('Reader').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Author').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Reviewer').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Admin').length).toBeGreaterThanOrEqual(1);
  });
});

describe('RegisterPage – password strength checker', () => {
  beforeEach(() => vi.clearAllMocks());

  it('strength bar is hidden when password is empty', () => {
    renderRegister();
    expect(screen.queryByText(/weak|fair|good|strong/i)).toBeNull();
  });

  it('shows "Weak" for a one-character password', () => {
    renderRegister();
    fillPassword('a');
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('shows "Strong" for a fully compliant password', () => {
    renderRegister();
    fillPassword('Abcdef1!');
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('marks length check as passing when password >= 8 chars', () => {
    renderRegister();
    fillPassword('Abcdef1!');
    const lengthItem = screen.getByText(/at least 8 characters/i);
    expect(lengthItem.className).toContain('pass');
  });

  it('marks uppercase check as failing when no uppercase letter', () => {
    renderRegister();
    fillPassword('abcdef1!');
    const item = screen.getByText(/one uppercase letter/i);
    expect(item.className).toContain('fail');
  });

  it('marks special char check as passing when special char present', () => {
    renderRegister();
    fillPassword('Abcdef1!');
    const item = screen.getByText(/one special character/i);
    expect(item.className).toContain('pass');
  });
});

describe('RegisterPage – submit button gating', () => {
  beforeEach(() => vi.clearAllMocks());

  it('button is enabled when password field is still empty (no attempted pw)', () => {
    renderRegister();
    // pw.length === 0 means the gate (pw.length > 0 && !allPassed) is false → enabled
    expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
  });

  it('button is disabled while a weak password is entered', () => {
    renderRegister();
    fillPassword('weak');
    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled();
  });

  it('button is enabled once all password requirements pass', () => {
    renderRegister();
    fillPassword('Abcdef1!');
    expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
  });
});

describe('RegisterPage – form submission', () => {
  beforeEach(() => vi.clearAllMocks());

  async function fillAndSubmit() {
    renderRegister();
    fireEvent.change(screen.getByPlaceholderText(/choose a username/i), { target: { name: 'username', value: 'alice' } });
    fireEvent.change(screen.getByPlaceholderText(/your@email\.com/i), { target: { name: 'email', value: 'a@b.com' } });
    fillPassword('Abcdef1!');
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form'));
  }

  it('calls api.post with registration data', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'tok', username: 'alice', role: 'READER' } });
    await fillAndSubmit();
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/register', {
      username: 'alice', email: 'a@b.com', password: 'Abcdef1!',
    }));
  });

  it('calls login() and navigates to /dashboard on success', async () => {
    const data = { token: 'tok', username: 'alice', role: 'READER' };
    api.post.mockResolvedValueOnce({ data });
    await fillAndSubmit();
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith(data));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('displays server error message on failure', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Username taken' } } });
    await fillAndSubmit();
    await waitFor(() => expect(screen.getByText('Username taken')).toBeInTheDocument());
  });

  it('displays fallback error when no server message', async () => {
    api.post.mockRejectedValueOnce(new Error('timeout'));
    await fillAndSubmit();
    await waitFor(() => expect(screen.getByText(/registration failed/i)).toBeInTheDocument());
  });
});
