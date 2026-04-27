import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

vi.mock('../api/api', () => ({ default: { get: vi.fn() } }));
vi.mock('../components/Header', () => ({ default: () => <nav /> }));
// axios isCancel helper used in Dashboard.jsx
vi.mock('axios', () => ({
  default: { isCancel: vi.fn(() => false) },
  isCancel: vi.fn(() => false),
}));

import api from '../api/api';
import Dashboard from '../pages/Dashboard';

function renderDashboard(user) {
  return render(
    <AuthContext.Provider value={{ user, login: vi.fn(), logout: vi.fn() }}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

const READER   = { username: 'alice', role: 'READER' };
const AUTHOR   = { username: 'bob',   role: 'AUTHOR' };
const REVIEWER = { username: 'carol', role: 'REVIEWER' };
const ADMIN    = { username: 'dave',  role: 'ADMIN' };

const DOCS = [
  { id: 1, slug: 'doc-1', title: 'Alpha', ownerUsername: 'alice', totalVersions: 2, activeVersionId: 10, activeVersionNumber: 2 },
  { id: 2, slug: 'doc-2', title: 'Beta',  ownerUsername: 'bob',   totalVersions: 1, activeVersionId: null, activeVersionNumber: null },
];

describe('Dashboard – welcome section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: [] });
  });

  it("shows the user's username in the welcome heading", async () => {
    renderDashboard(READER);
    await waitFor(() => expect(screen.getByText(/welcome back/i)).toBeInTheDocument());
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('shows the correct role description for READER', async () => {
    renderDashboard(READER);
    await waitFor(() => expect(screen.getByText(/browse and read all documents/i)).toBeInTheDocument());
  });

  it('shows the correct role description for ADMIN', async () => {
    renderDashboard(ADMIN);
    await waitFor(() => expect(screen.getByText(/full access/i)).toBeInTheDocument());
  });
});

describe('Dashboard – stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: DOCS });
  });

  it('shows total document count after loading', async () => {
    renderDashboard(READER);
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
  });

  it('shows active version count', async () => {
    renderDashboard(READER);
    // 1 document has an activeVersionId
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
  });

  it('shows user role in stats', async () => {
    renderDashboard(REVIEWER);
    await waitFor(() => expect(screen.getAllByText('REVIEWER').length).toBeGreaterThanOrEqual(1));
  });
});

describe('Dashboard – quick actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: [] });
  });

  it('READER sees All Documents but not Create Document', async () => {
    renderDashboard(READER);
    await waitFor(() => expect(screen.getByText('All Documents')).toBeInTheDocument());
    expect(screen.queryByText('Create Document')).toBeNull();
  });

  it('AUTHOR sees Create Document', async () => {
    renderDashboard(AUTHOR);
    await waitFor(() => expect(screen.getByText('Create Document')).toBeInTheDocument());
  });

  it('REVIEWER sees Review Queue', async () => {
    renderDashboard(REVIEWER);
    await waitFor(() => expect(screen.getByText('Review Queue')).toBeInTheDocument());
  });

  it('ADMIN sees all four quick actions', async () => {
    renderDashboard(ADMIN);
    await waitFor(() => {
      expect(screen.getByText('All Documents')).toBeInTheDocument();
      expect(screen.getByText('Create Document')).toBeInTheDocument();
      expect(screen.getByText('Review Queue')).toBeInTheDocument();
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });
  });
});

describe('Dashboard – recent documents list', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading indicator initially', () => {
    api.get.mockReturnValue(new Promise(() => {})); // never resolves
    renderDashboard(READER);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows document titles after loading', async () => {
    api.get.mockResolvedValue({ data: DOCS });
    renderDashboard(READER);
    await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument());
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows "No documents yet" when list is empty', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderDashboard(READER);
    await waitFor(() => expect(screen.getByText(/no documents yet/i)).toBeInTheDocument());
  });

  it('shows error message when API call fails', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    renderDashboard(READER);
    await waitFor(() => expect(screen.getByText(/could not load documents/i)).toBeInTheDocument());
  });

  it('shows "v2 live" badge for docs with an active version', async () => {
    api.get.mockResolvedValue({ data: DOCS });
    renderDashboard(READER);
    await waitFor(() => expect(screen.getByText('v2 live')).toBeInTheDocument());
  });

  it('shows "No active" badge for docs without an active version', async () => {
    api.get.mockResolvedValue({ data: DOCS });
    renderDashboard(READER);
    await waitFor(() => expect(screen.getByText('No active')).toBeInTheDocument());
  });
});
