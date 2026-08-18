import { Link } from 'react-router-dom';
import { Code2, ExternalLink } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-brand">
          <Code2 size={20} />
          <span>DSA Prep</span>
        </div>
        <p className="footer-text">
          Built for interview preparation. Browse company-wise LeetCode questions.
        </p>
        <div className="footer-links">
          <Link to="/companies">Companies</Link>
          <Link to="/topics">Topics</Link>

        </div>
        <p className="footer-copy">© {new Date().getFullYear()} DSA Prep Platform</p>
      </div>
    </footer>
  );
}
