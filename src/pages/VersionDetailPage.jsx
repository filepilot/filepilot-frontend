import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { diffLines } from 'diff';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import api from '../api/api';
import Header from '../components/Header';
import './VersionDetailPage.css';

const STATUS_LABELS = {
  DRAFT: 'Draft', PENDING_REVIEW: 'Pending Review', APPROVED: 'Approved', REJECTED: 'Rejected',
};

function DiffView({ v1, v2 }) {
  const changes = diffLines(v1.content || '', v2.content || '');
  const lines = [];
  changes.forEach(part => {
    const partLines = part.value.replace(/\n$/, '').split('\n');
    const type = part.added ? 'added' : part.removed ? 'removed' : 'unchanged';
    partLines.forEach(text => lines.push({ type, text }));
  });
  return (
    <div className="vdet-diff">
      <div className="vdet-diff-header">
        <span className="vdet-diff-label vdet-diff-label--old">v{v1.versionNumber}</span>
        <span style={{ color: 'var(--text-muted)' }}>→</span>
        <span className="vdet-diff-label vdet-diff-label--new">v{v2.versionNumber}</span>
      </div>
      {lines.map((line, i) => (
        <div key={i} className={`vdet-diff-line vdet-diff-line--${line.type}`}>
          <span className="vdet-diff-prefix">
            {line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}
          </span>
          <span>{line.text || '\u00a0'}</span>
        </div>
      ))}
    </div>
  );
}

export default function VersionDetailPage() {
  const { slug, version: versionParam } = useParams();
  const versionNumber = parseInt(versionParam?.replace('v', ''));
  const { user } = useAuth();
  const navigate = useNavigate();
  const [version, setVersion] = useState(null);
  const [allVersions, setAllVersions] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [showDiff, setShowDiff] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const isReviewer = user?.role === 'REVIEWER' || user?.role === 'ADMIN';
  const isAuthor = user?.role === 'AUTHOR' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const canComment = isReviewer;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setVersion(null);
    setComments([]);
    setAllVersions([]);

    api.get(`/documents/by-slug/${slug}/versions/${versionNumber}`, { signal: controller.signal })
      .then(async (vRes) => {
        if (controller.signal.aborted) return;
        const v = vRes.data;
        setVersion(v);
        const [cRes, allVRes] = await Promise.all([
          api.get(`/versions/${v.id}/comments`, { signal: controller.signal }),
          api.get(`/documents/by-slug/${slug}/versions`, { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) {
          setComments(cRes.data);
          setAllVersions(allVRes.data.sort((a, b) => a.versionNumber - b.versionNumber));
        }
      })
      .catch(err => {
        if (!axios.isCancel(err)) setError('Could not load version.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug, versionNumber]);

  const handleAction = async (action) => {
    setActionLoading(action);
    setError('');
    try {
      const body = reviewComment ? { comment: reviewComment } : {};
      const { data } = await api.put(`/versions/${version.id}/${action}`, body);
      setVersion(data);
      setReviewComment('');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} version.`);
    } finally {
      setActionLoading('');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommentLoading(true);
    try {
      const { data } = await api.post(`/versions/${version.id}/comments`, { content: comment });
      setComments(prev => [...prev, data]);
      setComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete version ${version.versionNumber}? This cannot be undone.`)) return;
    setDeleting(true);
    setError('');
    try {
      await api.delete(`/versions/${version.id}`);
      navigate(`/documents/${slug}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete version.');
      setDeleting(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/versions/${version.id}/export?format=${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      const fileName = version.name
        ? `v${version.versionNumber}_${version.name}.${format}`
        : `v${version.versionNumber}.${format}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to export as ${format}.`);
    }
  };

  if (loading) return <div className="page-layout"><Header /><div className="loading">Loading...</div></div>;
  if (!version) return <div className="page-layout"><Header /><div className="page-content"><div className="error-msg">{error || 'Version not found.'}</div></div></div>;

  const currentIndex = allVersions.findIndex(v => v.versionNumber === versionNumber);
  const prevVersion = currentIndex > 0 ? allVersions[currentIndex - 1] : null;

  return (
    <div className="page-layout">
      <Header />
      <main className="page-content">
        {/* Breadcrumb */}
        <div className="vdet-breadcrumb">
          <Link to="/documents">Documents</Link>
          <span>›</span>
          <Link to={`/documents/${slug}`}>{version.documentTitle}</Link>
          <span>›</span>
          <span>v{version.versionNumber}{version.name ? ` — ${version.name}` : ''}</span>
        </div>

        <div className="vdet-layout">
          {/* Main content */}
          <div className="vdet-main">
            <div className="vdet-header">
              <div className="vdet-header-left">
                <h1 className="vdet-title">Version {version.versionNumber}{version.name ? ` — ${version.name}` : ''}</h1>
                <span className={`status-badge ${version.status.toLowerCase()}`}>
                  {STATUS_LABELS[version.status]}
                </span>
              </div>
              <div className="vdet-header-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => handleExport('txt')}>
                  Export TXT
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleExport('pdf')}>
                  Export PDF
                </button>
                {isAdmin && (
                  <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>

            <div className="vdet-meta">
              <span>Author: <strong>{version.authorUsername}</strong></span>
              {version.reviewerUsername && <span>Reviewer: <strong>{version.reviewerUsername}</strong></span>}
              <span>{new Date(version.createdAt).toLocaleString()}</span>
            </div>

            {/* Content */}
            <div className="vdet-content">
              <h3 className="vdet-content-label">Content</h3>
              <div className="vdet-content-body">{version.content}</div>
            </div>

            {/* Review comment */}
            {version.reviewComment && (
              <div className="vdet-review-comment">
                <span className="vdet-review-comment-label">Review Comment</span>
                <p>{version.reviewComment}</p>
                {version.reviewerUsername && <span className="vdet-review-by">— {version.reviewerUsername}</span>}
              </div>
            )}

            {/* Diff toggle */}
            {prevVersion && (
              <div className="vdet-diff-toggle">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowDiff(v => !v)}
                >
                  {showDiff ? '▾' : '▸'} {showDiff ? 'Hide' : 'Show'} diff with v{prevVersion.versionNumber}
                </button>
                {showDiff && <DiffView v1={prevVersion} v2={version} />}
              </div>
            )}

            {/* Actions */}
            {error && <div className="error-msg">{error}</div>}

            {version.status === 'DRAFT' && isAuthor && version.authorUsername === user.username && (
              <div className="vdet-actions">
                <h3 className="vdet-actions-label">Actions</h3>
                <button
                  className="btn btn-warning"
                  onClick={() => handleAction('submit')}
                  disabled={actionLoading === 'submit'}
                >
                  {actionLoading === 'submit' ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>
            )}

            {version.status === 'PENDING_REVIEW' && isReviewer && (
              <div className="vdet-actions">
                <h3 className="vdet-actions-label">Review</h3>
                <textarea
                  className="textarea-field"
                  placeholder="Optional review comment..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  style={{ minHeight: 80, marginBottom: 12 }}
                />
                <div className="vdet-review-btns">
                  <button
                    className="btn btn-success"
                    onClick={() => handleAction('approve')}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'approve' ? 'Approving...' : '✓ Approve'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleAction('reject')}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'reject' ? 'Rejecting...' : '✕ Reject'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Comments sidebar */}
          <div className="vdet-sidebar">
            <h3 className="vdet-comments-title">Comments</h3>
            <div className="vdet-comments-list">
              {comments.length === 0 && (
                <p className="vdet-no-comments">No comments yet.</p>
              )}
              {comments.map(c => (
                <div key={c.id} className="vdet-comment">
                  <div className="vdet-comment-header">
                    <span className="vdet-comment-author">{c.authorUsername}</span>
                    <span className="vdet-comment-date">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="vdet-comment-body">{c.content}</p>
                </div>
              ))}
            </div>

            {canComment && (
              <form onSubmit={handleComment} className="vdet-comment-form">
                <textarea
                  className="textarea-field"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  style={{ minHeight: 80 }}
                />
                <button type="submit" className="btn btn-secondary btn-sm" disabled={commentLoading || !comment.trim()}>
                  {commentLoading ? 'Posting...' : 'Post Comment'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      
    </div>
  );
}
