import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { diffLines } from 'diff';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import api from '../api/api';
import Header from '../components/Header';
import './DocumentDetailPage.css';

const STATUS_LABELS = {
  DRAFT: 'Draft', PENDING_REVIEW: 'Pending Review', APPROVED: 'Approved', REJECTED: 'Rejected',
};

function NewVersionModal({ docId, onClose, onCreate, initialContent, nextVersionNumber }) {
  const [mode, setMode] = useState('write'); // 'write' or 'upload'
  const [name, setName] = useState('');
  const [content, setContent] = useState(initialContent || '');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.toLowerCase().endsWith('.txt')) {
        setError('Only .txt files are allowed.');
        setFile(null);
        return;
      }
      setError('');
      setFile(selected);
      if (!name) setName(selected.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let data;
      if (mode === 'upload') {
        if (!file) { setError('Please select a .txt file.'); setLoading(false); return; }
        const formData = new FormData();
        formData.append('file', file);
        if (name) formData.append('name', name);
        const res = await api.post(`/documents/${docId}/versions/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        data = res.data;
      } else {
        const res = await api.post(`/documents/${docId}/versions`, { name: name || null, content });
        data = res.data;
      }
      onCreate(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create version.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
  };

  const canSubmit = mode === 'write' ? content.trim().length > 0 : !!file;

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">New Version</h2>

        <div className="version-mode-tabs">
          <button
            type="button"
            className={`version-mode-tab ${mode === 'write' ? 'active' : ''}`}
            onClick={() => switchMode('write')}
          >
            Write
          </button>
          <button
            type="button"
            className={`version-mode-tab ${mode === 'upload' ? 'active' : ''}`}
            onClick={() => switchMode('upload')}
          >
            Upload TXT
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Version Name</label>
            <input
              className="input-field"
              placeholder={`e.g. v${nextVersionNumber} — Initial draft`}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {mode === 'write' ? (
            <div className="form-group">
              <label className="label">Content</label>
              <textarea
                className="textarea-field"
                placeholder="Write this version's content..."
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                style={{ minHeight: 200 }}
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="label">File (.txt)</label>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="input-field"
              />
              {file && (
                <span className="upload-file-info">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !canSubmit}>
              {loading ? 'Creating...' : 'Create Version'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompareVersionsDiffView({ v1, v2 }) {
  const changes = diffLines(v1.content || '', v2.content || '');
  const lines = [];
  changes.forEach(part => {
    const partLines = part.value.replace(/\n$/, '').split('\n');
    const type = part.added ? 'added' : part.removed ? 'removed' : 'unchanged';
    partLines.forEach(text => lines.push({ type, text }));
  });
  return (
    <div className="docdet-compare-diff">
      <div className="docdet-compare-diff-header">
        <span className="docdet-compare-diff-label docdet-compare-diff-label--old">v{v1.versionNumber}</span>
        <span style={{ color: 'var(--text-muted)' }}>→</span>
        <span className="docdet-compare-diff-label docdet-compare-diff-label--new">v{v2.versionNumber}</span>
      </div>
      {lines.map((line, i) => (
        <div key={i} className={`docdet-compare-diff-line docdet-compare-diff-line--${line.type}`}>
          <span className="docdet-compare-diff-prefix">
            {line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}
          </span>
          <span>{line.text || '\u00a0'}</span>
        </div>
      ))}
    </div>
  );
}

export default function DocumentDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewVersion, setShowNewVersion] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [compareFrom, setCompareFrom] = useState('');
  const [compareTo, setCompareTo] = useState('');

  const isAdmin = user?.role === 'ADMIN';
  const isOwner = doc?.ownerUsername === user?.username;
  // Author can create on a document only if they own it; admins can always create.
  const canCreate = isAdmin || ((user?.role === 'AUTHOR') && isOwner);

  const isNumericId = /^\d+$/.test(slug);
  const docPath = isNumericId ? `/documents/${slug}` : `/documents/by-slug/${slug}`;
  const versionsPath = isNumericId ? `/documents/${slug}/versions` : `/documents/by-slug/${slug}/versions`;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setDoc(null);
    setVersions([]);
    Promise.all([
      api.get(docPath, { signal: controller.signal }),
      api.get(versionsPath, { signal: controller.signal }),
    ])
      .then(([docRes, versRes]) => {
        setDoc(docRes.data);
        setVersions(versRes.data.sort((a, b) => b.versionNumber - a.versionNumber));
        // If we loaded by ID but doc has a slug, redirect to the slug URL
        if (isNumericId && docRes.data.slug) {
          navigate(`/documents/${docRes.data.slug}`, { replace: true });
        }
      })
      .catch(err => {
        if (!axios.isCancel(err)) setError('Could not load document.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug, docPath, versionsPath, isNumericId, navigate]);

  const refreshData = () => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get(docPath),
      api.get(versionsPath),
    ])
      .then(([docRes, versRes]) => {
        setDoc(docRes.data);
        setVersions(versRes.data.sort((a, b) => b.versionNumber - a.versionNumber));
      })
      .catch(() => setError('Could not load document.'))
      .finally(() => setLoading(false));
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/documents/${doc.id}`);
      navigate('/documents');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete document.');
      setDeleting(false);
    }
  };

  if (loading) return <div className="page-layout"><Header /><div className="loading">Loading...</div></div>;
  if (error && !doc) return <div className="page-layout"><Header /><div className="page-content"><div className="error-msg">{error}</div></div></div>;

  const activeVersion = versions.find(v => v.versionNumber === doc?.activeVersionNumber);
  const latestVersion = versions.length > 0 ? versions[0] : null;

  const compareFromVersion = compareFrom ? versions.find(v => String(v.id) === compareFrom) : null;
  const compareToVersion = compareTo ? versions.find(v => String(v.id) === compareTo) : null;

  return (
    <div className="page-layout">
      <Header />
      <main className="page-content">
        {/* Breadcrumb */}
        <div className="docdet-breadcrumb">
          <Link to="/documents">Documents</Link>
          <span>›</span>
          <span>{doc?.title}</span>
        </div>

        {/* Header */}
        <div className="docdet-header">
          <div>
            <h1 className="docdet-title">{doc?.title}</h1>
            {doc?.description && <p className="docdet-desc">{doc.description}</p>}
            <div className="docdet-meta">
              <span>Owner: <strong>{doc?.ownerUsername}</strong></span>
              <span>{versions.length} version{versions.length !== 1 ? 's' : ''}</span>
              {doc?.activeVersionNumber && (
                <span className="status-badge approved">v{doc.activeVersionNumber} active</span>
              )}
            </div>
          </div>
          <div className="docdet-actions">
            {canCreate && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowNewVersion(true)}>
                + New Version
              </button>
            )}
            {isAdmin && (
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {/* Active version preview */}
        {activeVersion && (
          <div className="docdet-active-section">
            <div className="docdet-active-label">
              <span className="status-badge approved">Active — v{activeVersion.versionNumber}</span>
              <span className="docdet-active-reviewer">
                Approved by {activeVersion.reviewerUsername}
              </span>
            </div>
            <div className="docdet-active-content">
              {activeVersion.content}
            </div>
          </div>
        )}

        {/* Compare versions */}
        {versions.length >= 2 && (
          <div className="docdet-compare-section">
            <h2 className="docdet-versions-title">Compare Versions</h2>
            <div className="docdet-compare-controls">
              <select
                className="select-field"
                value={compareFrom}
                onChange={e => setCompareFrom(e.target.value)}
              >
                <option value="">Select base version...</option>
                {versions.map(v => (
                  <option key={v.id} value={String(v.id)} disabled={String(v.id) === compareTo}>
                    v{v.versionNumber} — {STATUS_LABELS[v.status]} ({v.authorUsername})
                  </option>
                ))}
              </select>
              <span className="docdet-compare-arrow">→</span>
              <select
                className="select-field"
                value={compareTo}
                onChange={e => setCompareTo(e.target.value)}
              >
                <option value="">Select target version...</option>
                {versions.map(v => (
                  <option key={v.id} value={String(v.id)} disabled={String(v.id) === compareFrom}>
                    v{v.versionNumber} — {STATUS_LABELS[v.status]} ({v.authorUsername})
                  </option>
                ))}
              </select>
            </div>
            {compareFromVersion && compareToVersion && compareFrom !== compareTo && (
              <CompareVersionsDiffView v1={compareFromVersion} v2={compareToVersion} />
            )}
            {compareFrom && compareTo && compareFrom === compareTo && (
              <div className="error-msg">Please select two different versions to compare.</div>
            )}
          </div>
        )}

        {/* Versions */}
        <div className="docdet-versions-section">
          <h2 className="docdet-versions-title">Version History</h2>
          {versions.length === 0 && (
            <div className="empty-state"><p>No versions yet.</p></div>
          )}
          <div className="docdet-version-list">
            {versions.map(v => (
              <Link to={`/documents/${slug}/v${v.versionNumber}`} key={v.id} className="docdet-version-row">
                <div className="docdet-version-row__left">
                  <span className="docdet-version-num">v{v.versionNumber}</span>
                  {v.name && <span className="docdet-version-name">— {v.name}</span>}
                  <span className={`status-badge ${v.status.toLowerCase()}`}>
                    {STATUS_LABELS[v.status]}
                  </span>
                  {v.versionNumber === doc?.activeVersionNumber && (
                    <span className="docdet-active-tag">active</span>
                  )}
                </div>
                <div className="docdet-version-row__right">
                  <span className="docdet-version-author">{v.authorUsername}</span>
                  <span className="docdet-version-date">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2.5L9.5 7 5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>


      {showNewVersion && (
        <NewVersionModal
          docId={doc.id}
          onClose={() => setShowNewVersion(false)}
          onCreate={() => refreshData()}
          initialContent={latestVersion?.content || ''}
          nextVersionNumber={(latestVersion?.versionNumber || 0) + 1}
        />
      )}

    </div>
  );
}
