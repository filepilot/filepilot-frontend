import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const showLoggedOutBurger = !user && location.pathname === '/';

  return (
    <header className="fp-header">
      <div className="fp-header__inner">
        <Link
          to={user ? '/dashboard' : '/'}
          className="fp-header__brand"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Logo size={28} />
          <span className="fp-header__logo-text">Filepilot</span>
        </Link>

        {/* Desktop nav */}
        <nav className="fp-header__nav fp-header__nav--desktop">
          {user ? (
            <>
              <Link to="/documents" className={`fp-header__nav-link ${isActive('/documents') ? 'fp-header__nav-link--active' : ''}`}>
                Documents
              </Link>
              {(user.role === 'REVIEWER' || user.role === 'ADMIN') && (
                <Link to="/reviews" className={`fp-header__nav-link ${isActive('/reviews') ? 'fp-header__nav-link--active' : ''}`}>Reviews</Link>
              )}
              {user.role === 'ADMIN' && (
                <Link to="/admin" className={`fp-header__nav-link ${isActive('/admin') ? 'fp-header__nav-link--active' : ''}`}>
                  Admin
                </Link>
              )}
            </>
          ) : null}
        </nav>

        {/* Desktop actions */}
        <div className="fp-header__actions fp-header__actions--desktop">
          {user ? (
            <>
              <div className="fp-header__user-info">
                <div className="fp-header__avatar">{user.username?.[0]?.toUpperCase() || '?'}</div>
                <span className="fp-header__username">{user.username}</span>
                <span className="fp-header__role-badge">{user.role}</span>
              </div>
              <Link to="/change-password" className="fp-header__cta fp-header__cta--ghost">
                Change Password
              </Link>
              <button className="fp-header__cta fp-header__cta--ghost" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          ) : location.pathname === '/' ? (
            <>
              <a href="#faq" className="fp-header__questions">Questions</a>
              <Link to="/register" className="fp-header__cta">Try Filepilot</Link>
            </>
          ) : (
            <Link to="/" className="fp-header__cta fp-header__cta--ghost">Log in</Link>
          )}
        </div>

        {/* Mobile: avatar + hamburger */}
        {(user || showLoggedOutBurger) && (
          <div className="fp-header__mobile-right">
            {user && (
              <div className="fp-header__avatar fp-header__avatar--mobile">
                {user.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <button
              className={`fp-header__burger ${menuOpen ? 'fp-header__burger--open' : ''}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        )}
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (user || showLoggedOutBurger) && (
        <div className="fp-header__mobile-menu">
          {user ? (
            <>
              <div className="fp-header__mobile-user">
                <div className="fp-header__avatar fp-header__avatar--large">
                  {user.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="fp-header__mobile-username">{user.username}</div>
                  <span className="fp-header__role-badge">{user.role}</span>
                </div>
              </div>
              <nav className="fp-header__mobile-nav">
                <Link to="/dashboard" className={`fp-header__mobile-link ${isActive('/dashboard') ? 'fp-header__mobile-link--active' : ''}`}>
                  Dashboard
                </Link>
                <Link to="/documents" className={`fp-header__mobile-link ${isActive('/documents') ? 'fp-header__mobile-link--active' : ''}`}>
                  Documents
                </Link>
                {(user.role === 'REVIEWER' || user.role === 'ADMIN') && (
                  <Link to="/reviews" className={`fp-header__mobile-link ${isActive('/reviews') ? 'fp-header__mobile-link--active' : ''}`}>
                    Reviews
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className={`fp-header__mobile-link ${isActive('/admin') ? 'fp-header__mobile-link--active' : ''}`}>
                    Admin
                  </Link>
                )}
              </nav>
              <div className="fp-header__mobile-actions">
                <Link to="/change-password" className="fp-header__mobile-link">
                  Change Password
                </Link>
                <button className="fp-header__mobile-link fp-header__mobile-link--danger" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <nav className="fp-header__mobile-nav">
              <a href="#faq" className="fp-header__mobile-link" onClick={() => setMenuOpen(false)}>
                Questions
              </a>
            </nav>
          )}
        </div>
      )}
    </header>
  );
}
