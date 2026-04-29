import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import Header from '../components/Header';
import MiniDemo from '../components/MiniDemo';
import Footer from '../components/Footer';
import './LandingPage.css';

export default function LandingPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      <Header />

      {/* ── Hero ── */}
      <section className="landing__hero">
        {/* Left: heading + login — centered as one unit */}
        <div className="landing__hero-left">
          <div className="landing__left-block">
            <h1 className="landing__headline">Get clear,<br />execute better</h1>
            <p className="landing__subheading">Stay aligned and deliver results faster</p>

            <div className="landing__form-card">
              <form onSubmit={handleSubmit} className="landing__form">
                {error && <div className="landing__error">{error}</div>}
                <input
                  className="landing__input"
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                />
                <input
                  className="landing__input"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button className="landing__login-btn" type="submit" disabled={loading}>
                  {loading ? '...' : 'login'}
                </button>
              </form>
              <p className="landing__signup-prompt">
                New here? <Link to="/register" className="landing__signup-link">Create an account</Link>
              </p>
              <p className="landing__privacy">
                By logging in, you acknowledge Filepilot's Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        {/* Right: interactive demo */}
        <div className="landing__hero-right">
          <MiniDemo />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="landing__faq" id="faq">
        <h2 className="landing__faq-title">Frequently asked questions</h2>
        <div className="landing__faq-list">
          {[
            { q: 'What is Filepilot and how does it work?', a: 'Filepilot is a document version control system with collaborative review. Authors create documents and versions, reviewers approve or reject them, and every change is tracked in a full audit log.' },
            { q: 'What should I use Filepilot for?', a: 'Filepilot is ideal for teams that need structured document approval workflows — policy updates, technical specs, proposals, and any content that requires a review before going live.' },
            { q: 'How much does it cost to use?', a: 'Filepilot is free for individuals and small teams. Enterprise plans with advanced audit logging and custom roles are coming soon.' },
          ].map((item, i) => <FaqItem key={i} question={item.q} answer={item.a} />)}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'faq-item--open' : ''}`}>
      <button className="faq-item__question" onClick={() => setOpen(o => !o)}>
        <span>{question}</span>
        <span className="faq-item__icon">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="faq-item__answer">{answer}</p>}
    </div>
  );
}
