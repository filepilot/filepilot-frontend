import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import api from '../api/api';
import Header from '../components/Header';
import './DocumentsPage.css';

function CreateDocModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', description: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/documents', form);
      onCreate(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">New Document</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Title</label>
            <input className="input-field" placeholder="Document title" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <input className="input-field" placeholder="Short description (optional)" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Initial Content</label>
            <textarea className="textarea-field" placeholder="Write the first version content..." value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = user?.role === 'AUTHOR' || user?.role === 'ADMIN';

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

  const filtered = docs.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.ownerUsername?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-layout">
      <Header />
      <main className="page-content">
        <div className="docs-header">
          <div>
            <h1 className="docs-title">Documents</h1>
            <p className="docs-subtitle">{docs.length} document{docs.length !== 1 ? 's' : ''} total</p>
          </div>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + New Document
            </button>
          )}
        </div>

        <div className="docs-toolbar">
          <input
            className="input-field docs-search"
            placeholder="Search by title or owner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading && <div className="loading">Loading documents...</div>}
        {error && <div className="error-msg">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <h3>{search ? 'No results found' : 'No documents yet'}</h3>
            {canCreate && !search && <p>Create your first document to get started.</p>}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="docs-grid">
            {filtered.map(doc => (
              <Link to={`/documents/${doc.slug || doc.id}`} key={doc.id} className="doc-card">
                <div className="doc-card__top">
                  <h3 className="doc-card__title">{doc.title}</h3>
                  {doc.description && <p className="doc-card__desc">{doc.description}</p>}
                </div>
                <div className="doc-card__bottom">
                  <span className="doc-card__owner">{doc.ownerUsername}</span>
                  <div className="doc-card__meta">
                    <span className="doc-card__versions">{doc.totalVersions} version{doc.totalVersions !== 1 ? 's' : ''}</span>
                    {doc.activeVersionNumber && (
                      <span className="status-badge approved">v{doc.activeVersionNumber}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      

      {showCreate && (
        <CreateDocModal
          onClose={() => setShowCreate(false)}
          onCreate={newDoc => setDocs(prev => [newDoc, ...prev])}
        />
      )}
    </div>
  );
}
