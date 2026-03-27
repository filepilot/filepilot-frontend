import Logo from './Logo';
import './Footer.css';

const COLS = [
  {
    title: 'Product',
    items: ['Documents', 'Version control', 'Review workflow', 'Diff viewer', 'Export', 'Audit logs'],
  },
  {
    title: 'Roles',
    items: ['Reader', 'Author', 'Reviewer', 'Admin'],
  },
  {
    title: 'Solutions',
    items: ['Team collaboration', 'Document management', 'Content review', 'Compliance tracking', 'Enterprise'],
  },
  {
    title: 'Company',
    items: ['About', 'Blog', 'Careers', 'Security', 'Contact'],
  },
  {
    title: 'Help and security',
    items: ['Availability', 'Status', 'Support center', 'Privacy'],
  },
  {
    title: 'Terms and policies',
    items: [
      'Privacy choices',
      'Privacy policy',
      'Responsible disclosure policy',
      'Terms of service',
      'Usage policy',
    ],
  },
];

export default function Footer() {
  return (
    <footer className="fp-footer">
      <div className="fp-footer__inner">
        <div className="fp-footer__brand">
          <div className="fp-footer__brand-top">
            <div className="fp-footer__brand-row">
              <Logo size={24} />
              <span className="fp-footer__logo-text">Filepilot</span>
            </div>
          </div>
          <div className="fp-footer__brand-bottom">
            <p className="fp-footer__tagline">BY FILEPILOT</p>
            <p className="fp-footer__copy">&copy;2026 Filepilot</p>
            <div className="fp-footer__socials">
              <span className="fp-footer__social" aria-label="X">
                <img src="/icons8-x-logo.png" alt="X" width="18" height="18" />
              </span>
              <span className="fp-footer__social" aria-label="LinkedIn">
                <img src="/icons8-linkedin-logo.png" alt="LinkedIn" width="18" height="18" />
              </span>
              <span className="fp-footer__social" aria-label="YouTube">
                <img src="/icons8-youtube-logo.png" alt="YouTube" width="18" height="18" />
              </span>
              <span className="fp-footer__social" aria-label="Instagram">
                <img src="/icons8-instagram-logo.png" alt="Instagram" width="18" height="18" />
              </span>
            </div>
          </div>
        </div>

        {COLS.map(col => (
          <div key={col.title} className="fp-footer__col">
            <h4 className="fp-footer__col-title">{col.title}</h4>
            {col.items.map(item => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
