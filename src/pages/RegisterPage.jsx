import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './RegisterPage.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const pw = form.password;
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
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-layout">
      <Header />
      <main className="register-main page-content">
        <div className="register-card">
          <h1 className="register-title">Create your account</h1>
          <p className="register-sub">Start managing documents with a full review workflow.</p>

          {error && <div className="register-error">{error}</div>}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-field">
              <label className="register-label">Username</label>
              <input
                className="register-input"
                type="text"
                name="username"
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={50}
                autoComplete="username"
              />
            </div>

            <div className="register-field">
              <label className="register-label">Email</label>
              <input
                className="register-input"
                type="email"
                name="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="register-field">
              <label className="register-label">Password</label>
              <input
                className="register-input"
                type="password"
                name="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="register-requirements">
              <div className="register-requirements-header">
                <p className="register-requirements-title">Password requirements:</p>
                {pw.length > 0 && (
                  <span className="register-strength" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </span>
                )}
              </div>
              {pw.length > 0 && (
                <div className="register-strength-bar">
                  <div
                    className="register-strength-fill"
                    style={{ width: `${(passedCount / 5) * 100}%`, background: strengthColor }}
                  />
                </div>
              )}
              <ul className="register-requirements-list">
                <li className={pw.length > 0 ? (checks.length ? 'register-req-pass' : 'register-req-fail') : ''}>At least 8 characters</li>
                <li className={pw.length > 0 ? (checks.uppercase ? 'register-req-pass' : 'register-req-fail') : ''}>One uppercase letter</li>
                <li className={pw.length > 0 ? (checks.lowercase ? 'register-req-pass' : 'register-req-fail') : ''}>One lowercase letter</li>
                <li className={pw.length > 0 ? (checks.digit ? 'register-req-pass' : 'register-req-fail') : ''}>One digit</li>
                <li className={pw.length > 0 ? (checks.special ? 'register-req-pass' : 'register-req-fail') : ''}>One special character</li>
              </ul>
            </div>

            <button className="register-btn" type="submit" disabled={loading || (pw.length > 0 && !allPassed)}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="register-privacy">
            By registering you acknowledge Filepilot's{' '}
            <a href="#">Privacy Policy</a> and{' '}
            <a href="#">Terms of Service</a>.
          </p>

          {/* Role info */}
          <div className="register-roles">
            <p className="register-roles__title">Your account starts as a <strong>Reader</strong>. An admin can upgrade your role:</p>
            <div className="register-roles__grid">
              {[
                { role: 'Reader', desc: 'View all documents' },
                { role: 'Author', desc: 'Create docs & versions' },
                { role: 'Reviewer', desc: 'Approve & reject versions' },
                { role: 'Admin', desc: 'Full access + user management' },
              ].map(r => (
                <div key={r.role} className="register-roles__item">
                  <span className="register-roles__role">{r.role}</span>
                  <span className="register-roles__desc">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

