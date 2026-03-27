import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import api from '../api/api';
import Header from '../components/Header';
import './Dashboard.css';

const ROLE_INFO = {
  READER:   { desc: 'You can browse and read all documents.',               color: '#9a9a90' },
  AUTHOR:   { desc: 'You can create documents and submit versions for review.', color: '#60a5fa' },
  REVIEWER: { desc: 'You can approve and reject pending document versions.', color: '#fbbf24' },
  ADMIN:    { desc: 'You have full access to all features and user management.', color: '#c084fc' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [docs, setDocs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setDocs([]);
    api.get('/documents', { signal: controller.signal })
      .then(r => setDocs(r.data))
      .catch(err => { if (!axios.isCancel(err)) setError('Could not load documents.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const canCreate  = user?.role === 'AUTHOR'   || user?.role === 'ADMIN';
  const isReviewer = user?.role === 'REVIEWER' || user?.role === 'ADMIN';
  const isAdmin    = user?.role === 'ADMIN';
  const roleInfo   = ROLE_INFO[user?.role] || ROLE_INFO.READER;

  const withActive = docs.filter(d => d.activeVersionId).length;

  const icons = {
    documents: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 2h8.5L16 5.5V18H4V2z" /><path d="M12 2v4h4" /><path d="M7 10h6M7 13h4" />
      </svg>
    ),
    create: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 4v12M4 10h12" />
      </svg>
    ),
    review: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10l4 4 10-10" />
      </svg>
    ),
    admin: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="3" /><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.93 3.93l1.41 1.41M14.66 14.66l1.41 1.41M3.93 16.07l1.41-1.41M14.66 5.34l1.41-1.41" />
      </svg>
    ),
  };

  const quickActions = [
    { show: true,        to: '/documents', icon: icons.documents, label: 'All Documents',  sub: 'Browse and search everything' },
    { show: canCreate,   to: '/documents', icon: icons.create,    label: 'Create Document', sub: 'Start a new approval flow',   cta: true },
    { show: isReviewer,  to: '/reviews',   icon: icons.review,    label: 'Review Queue',    sub: 'Approve or reject versions' },
    { show: isAdmin,     to: '/admin',     icon: icons.admin,     label: 'Admin Panel',     sub: 'Users and audit logs' },
  ].filter(a => a.show);

  return (
    <div className="page-layout">
      <Header />
      <main className="page-content">

        {/* Welcome hero */}
        <div className="dash-hero">
          <div className="dash-hero__left">
            <div className="dash-role-dot" style={{ background: roleInfo.color }} />
            <div>
              <h1 className="dash-title">
                Welcome back, <em>{user?.username}</em>
              </h1>
              <p className="dash-subtitle">{roleInfo.desc}</p>
            </div>
          </div>
          {canCreate && (
            <Link to="/documents" className="btn btn-primary">+ New Document</Link>
          )}
        </div>

        {/* Stats */}
        <div className="dash-stats">
          <div className="dash-stat">
            <span className="dash-stat__num">{loading ? '—' : docs.length}</span>
            <span className="dash-stat__label">Total Documents</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat__num">{loading ? '—' : withActive}</span>
            <span className="dash-stat__label">Active Versions</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat__num" style={{ color: roleInfo.color, fontSize: 18 }}>{user?.role}</span>
            <span className="dash-stat__label">Your Role</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="dash-section">
          <h2 className="dash-section-title">Quick Actions</h2>
          <div className="dash-actions">
            {quickActions.map((a, i) => (
              <Link key={i} to={a.to} className={`dash-action-card ${a.cta ? 'dash-action-card--cta' : ''}`}>
                <span className="dash-action-icon">{a.icon}</span>
                <h3>{a.label}</h3>
                <p>{a.sub}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent documents */}
        <div className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">Recent Documents</h2>
            <Link to="/documents" className="dash-see-all">See all →</Link>
          </div>

          {loading && <div className="loading">Loading...</div>}
          {error   && <div className="error-msg">{error}</div>}
          {!loading && !error && docs.length === 0 && (
            <div className="empty-state">
              <h3>No documents yet</h3>
              {canCreate && <p>Create your first document to get started.</p>}
            </div>
          )}
          {!loading && docs.length > 0 && (
            <div className="dash-doc-list">
              {docs.slice(0, 6).map(doc => (
                <Link to={`/documents/${doc.slug || doc.id}`} key={doc.id} className="dash-doc-row">
                  <div className="dash-doc-row__left">
                    <span className="dash-doc-row__title">{doc.title}</span>
                    <span className="dash-doc-row__owner">by {doc.ownerUsername}</span>
                  </div>
                  <div className="dash-doc-row__right">
                    <span className="dash-doc-row__versions">{doc.totalVersions} version{doc.totalVersions !== 1 ? 's' : ''}</span>
                    {doc.activeVersionNumber
                      ? <span className="status-badge approved">v{doc.activeVersionNumber} live</span>
                      : <span className="status-badge draft">No active</span>
                    }
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      
    </div>
  );
}
