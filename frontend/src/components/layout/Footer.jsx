import { Link } from 'react-router-dom';
import { Code2, ArrowUp, Mail, MessageSquare } from 'lucide-react';
import './Footer.css';

function GithubIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function TwitterIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l11.733 16h4.267l-11.733-16z" />
      <path d="M4 20l6.768-6.768m2.464-2.464l6.768-6.768" />
    </svg>
  );
}

function LinkedinIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-top-border" />
      <div className="footer-container container">
        
        {/* ── Main 4-Column Grid + Brand Area ──────────────────────────────── */}
        <div className="footer-grid">
          
          {/* Brand & Mission Column */}
          <div className="footer-col footer-col-brand">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-icon">
                <Code2 size={20} />
              </div>
              <span className="footer-logo-text">DSA Prep</span>
              <span className="footer-badge">2026</span>
            </Link>

            <p className="footer-desc">
              Curated company-wise LeetCode questions organized by recency, frequency, and employer tiers to fast-track your technical interview preparation.
            </p>

            {/* Live Platform Status Pill */}
            <div className="footer-status-pill">
              <span className="status-dot-pulse" />
              <span>All Systems Operational • 2026 Edition</span>
            </div>

            {/* Social & Community Links */}
            <div className="footer-socials">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="GitHub Repository"
              >
                <GithubIcon size={16} />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="Discord Community"
              >
                <MessageSquare size={16} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="Twitter / X"
              >
                <TwitterIcon size={16} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="LinkedIn"
              >
                <LinkedinIcon size={16} />
              </a>
              <Link
                to="/contact"
                className="footer-social-btn"
                aria-label="Contact Email"
              >
                <Mail size={16} />
              </Link>
            </div>
          </div>

          {/* Column 1: Target Companies */}
          <div className="footer-col">
            <h4 className="footer-col-title">Top Companies</h4>
            <ul className="footer-link-list">
              <li><Link to="/company/google">Google</Link></li>
              <li><Link to="/company/amazon">Amazon</Link></li>
              <li><Link to="/company/microsoft">Microsoft</Link></li>
              <li><Link to="/company/meta">Meta</Link></li>
              <li><Link to="/company/apple">Apple</Link></li>
              <li><Link to="/company/netflix">Netflix</Link></li>
              <li><Link to="/company/uber">Uber</Link></li>
              <li><Link to="/company/flipkart">Flipkart</Link></li>
              <li>
                <Link to="/companies" className="footer-link-highlight">
                  Browse All 471+ Companies →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: DSA Topics */}
          <div className="footer-col">
            <h4 className="footer-col-title">DSA Topics</h4>
            <ul className="footer-link-list">
              <li><Link to="/topics/dynamic-programming">Dynamic Programming</Link></li>
              <li><Link to="/topics/array">Arrays & Hashing</Link></li>
              <li><Link to="/topics/string">String Manipulation</Link></li>
              <li><Link to="/topics/tree">Trees & BST</Link></li>
              <li><Link to="/topics/graph">Graphs & BFS/DFS</Link></li>
              <li><Link to="/topics/binary-search">Binary Search</Link></li>
              <li><Link to="/topics/sliding-window">Sliding Window</Link></li>
              <li><Link to="/topics/two-pointers">Two Pointers</Link></li>
              <li>
                <Link to="/topics" className="footer-link-highlight">
                  Explore All 74+ Topics →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform Tools */}
          <div className="footer-col">
            <h4 className="footer-col-title">Prep & Tools</h4>
            <ul className="footer-link-list">
              <li><Link to="/dashboard">Dashboard & Tracker</Link></li>
              <li><Link to="/bookmarks">Saved Bookmarks</Link></li>
              <li><Link to="/search">Global Search</Link></li>
              <li><Link to="/companies?tier=1">MAANG / Tier-1 Lists</Link></li>
              <li><Link to="/companies?tier=2">Product Unicorns</Link></li>
              <li><Link to="/companies?tier=3">Fintech & High Growth</Link></li>
              <li><Link to="/login">Account Sign In</Link></li>
              <li><Link to="/register">Create Free Account</Link></li>
            </ul>
          </div>

          {/* Column 4: About & Legal */}
          <div className="footer-col">
            <h4 className="footer-col-title">About & Legal</h4>
            <ul className="footer-link-list">
              <li><Link to="/about">About DSA Prep</Link></li>
              <li><Link to="/contact">Contact & Support</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/contact?type=suggestion">Suggest a Question</Link></li>
              <li><Link to="/contact?type=bug">Report an Issue</Link></li>
            </ul>
          </div>

        </div>

        {/* ── Bottom Bar: Copyright, Legal & Back to Top ────────────────────── */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p className="footer-copyright">
              © {currentYear} DSA Prep Platform. Educational interview preparation resource.
            </p>
            <div className="footer-legal-inline">
              <Link to="/privacy">Privacy Policy</Link>
              <span className="footer-dot">•</span>
              <Link to="/terms">Terms of Service</Link>
              <span className="footer-dot">•</span>
              <Link to="/about">About Us</Link>
              <span className="footer-dot">•</span>
              <Link to="/contact">Contact Support</Link>
            </div>
          </div>

          <div className="footer-bottom-right">
            <span className="footer-version-tag">v2.4.0 • 2026 Edition</span>
            <button
              type="button"
              className="btn-back-to-top"
              onClick={scrollToTop}
              title="Scroll to top of page"
            >
              <span>Back to Top</span>
              <ArrowUp size={14} />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
