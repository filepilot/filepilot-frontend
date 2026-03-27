import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import api from '../api/api';
import Header from '../components/Header';
import './ReviewsPage.css';

export default function ReviewsPage() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setVersions([]);
    api.get('/versions/pending-review', { signal: controller.signal })
      .then(r => setVersions(r.data))
      .catch(err => { if (!axios.isCancel(err)) setError('Could not load review queue.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return (
    <div className="page-layout">
      <Header />
      <main className="page-content">
        <div className="reviews-header">
          <div>
            <h1 className="reviews-title">Review Queue</h1>
            <p className="reviews-subtitle">Versions awaiting your approval</p>
          </div>
        </div>

        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error-msg">{error}</div>}

        {!loading && !error && versions.length === 0 && (
          <div className="empty-state">
            <h3>All clear</h3>
            <p>No versions are pending review right now.</p>
          </div>
        )}

        {!loading && versions.length > 0 && (
          <div className="reviews-list">
            {versions.map(v => (
              <Link to={`/documents/${v.documentSlug || v.documentId}/v${v.versionNumber}`} key={v.id} className="review-card">
                <div className="review-card__left">
                  <span className="review-card__doc">{v.documentTitle}</span>
                  <span className="review-card__version">Version {v.versionNumber}</span>
                </div>
                <div className="review-card__right">
                  <span className="review-card__author">by {v.authorUsername}</span>
                  <span className="review-card__date">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </span>
                  <span className="status-badge pending_review">Pending Review</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      
    </div>
  );
}
