import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import Header from '../components/Header';
import './ChangePasswordPage.css';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setSuccess(false);
  };

  const pw = form.newPassword;
  const checks = {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    digit: /\d/.test(pw),
    special: /[^A-Za-z\d\s]/.test(pw),
  };
  const passedCount = Object.values(checks).filter(Boolean).length;
  const allPassed = passedCount === 5;
  const strengthLabel = passedCount <= 1 ? 'Weak' : passedCount <= 3 ? 'Fair' : passedCount <= 4 ? 'Good' : 'Strong';
  const strengthColor = passedCount <= 1 ? 'var(--status-rejected)' : passedCount <= 3 ? 'var(--status-pending)' : 'var(--status-approved)';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/account/change-password', form);
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-layout">
      <Header />
      <main className="chpw-main page-content">
        <div className="chpw-card">
          <h1 className="chpw-title">Change Password</h1>
          <p className="chpw-sub">Update your account password. You'll stay logged in after changing it.</p>

          {error && <div className="chpw-error">{error}</div>}
          {success && <div className="chpw-success">Password changed successfully.</div>}

          <form onSubmit={handleSubmit} className="chpw-form">
            <div className="chpw-field">
              <label className="chpw-label">Current Password</label>
              <input
                className="chpw-input"
                type="password"
                name="currentPassword"
                placeholder="Enter your current password"
                value={form.currentPassword}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="chpw-field">
              <label className="chpw-label">New Password</label>
              <input
                className="chpw-input"
                type="password"
                name="newPassword"
                placeholder="At least 8 characters"
                value={form.newPassword}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="chpw-field">
              <label className="chpw-label">Confirm New Password</label>
              <input
                className="chpw-input"
                type="password"
                name="confirmPassword"
                placeholder="Re-enter new password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="chpw-requirements">
              <div className="chpw-requirements-header">
                <p className="chpw-requirements-title">Password requirements:</p>
                {pw.length > 0 && (
                  <span className="chpw-strength" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </span>
                )}
              </div>
              {pw.length > 0 && (
                <div className="chpw-strength-bar">
                  <div
                    className="chpw-strength-fill"
                    style={{ width: `${(passedCount / 5) * 100}%`, background: strengthColor }}
                  />
                </div>
              )}
              <ul className="chpw-requirements-list">
                <li className={pw.length > 0 ? (checks.length ? 'chpw-req-pass' : 'chpw-req-fail') : ''}>At least 8 characters</li>
                <li className={pw.length > 0 ? (checks.uppercase ? 'chpw-req-pass' : 'chpw-req-fail') : ''}>One uppercase letter</li>
                <li className={pw.length > 0 ? (checks.lowercase ? 'chpw-req-pass' : 'chpw-req-fail') : ''}>One lowercase letter</li>
                <li className={pw.length > 0 ? (checks.digit ? 'chpw-req-pass' : 'chpw-req-fail') : ''}>One digit</li>
                <li className={pw.length > 0 ? (checks.special ? 'chpw-req-pass' : 'chpw-req-fail') : ''}>One special character</li>
              </ul>
            </div>

            <button className="chpw-btn" type="submit" disabled={loading || (pw.length > 0 && !allPassed)}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>

          <button className="chpw-back" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
