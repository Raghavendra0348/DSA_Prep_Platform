import { Link } from 'react-router-dom';
import { Code2, ArrowUp, ArrowUpRight } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">

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

            </Link>

            <p className="footer-desc">
              A focused place to prepare for your next technical interview. Find a company, choose a topic, and keep practicing.
            </p>

            <Link to="/companies" className="footer-start-link">Find your next problem <ArrowUpRight size={16} /></Link>
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
                  All companies →
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
                  All topics →
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

          </div>

          <div className="footer-bottom-right">

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
