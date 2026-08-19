import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, Database, Cookie, UserCheck, Mail, ArrowLeft } from 'lucide-react';
import './Privacy.css';

export default function Privacy() {
  useEffect(() => {
    document.title = 'Privacy Policy — DSA Prep Platform';
    window.scrollTo(0, 0);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="legal-page">
      <div className="legal-header">
        <div className="container">
          <Link to="/" className="legal-back-link">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
          <div className="legal-badge">
            <ShieldCheck size={14} />
            <span>LEGAL & COMPLIANCE</span>
          </div>
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-subtitle">
            Last Updated: January 15, 2026 • Effective Date: January 1, 2026
          </p>
        </div>
      </div>

      <div className="container legal-body-wrap">
        {/* Table of Contents Sidebar */}
        <aside className="legal-sidebar">
          <div className="legal-toc-card">
            <div className="toc-title">Table of Contents</div>
            <nav className="toc-nav">
              <button type="button" onClick={() => scrollToSection('sec-overview')}>1. Overview & Scope</button>
              <button type="button" onClick={() => scrollToSection('sec-collection')}>2. Information We Collect</button>
              <button type="button" onClick={() => scrollToSection('sec-usage')}>3. How We Use Your Data</button>
              <button type="button" onClick={() => scrollToSection('sec-auth')}>4. Authentication & Security</button>
              <button type="button" onClick={() => scrollToSection('sec-cookies')}>5. Cookies & Local Storage</button>
              <button type="button" onClick={() => scrollToSection('sec-sharing')}>6. Third-Party Sharing</button>
              <button type="button" onClick={() => scrollToSection('sec-rights')}>7. Your Rights (GDPR / CCPA)</button>
              <button type="button" onClick={() => scrollToSection('sec-contact')}>8. Contact & Questions</button>
            </nav>
          </div>
        </aside>

        {/* Policy Content */}
        <main className="legal-content">
          <section id="sec-overview" className="legal-section">
            <h2>1. Overview & Scope</h2>
            <p>
              Welcome to <strong>DSA Prep Platform</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We are committed to respecting your privacy and protecting the personal data you share when using our website and services.
            </p>
            <p>
              This Privacy Policy explains what information we collect, how we process and store it, and the choices and rights available to you regarding your data. DSA Prep is built for software engineers preparing for technical interviews, and our guiding philosophy is minimal data collection and zero monetization of user data.
            </p>
          </section>

          <section id="sec-collection" className="legal-section">
            <h2>2. Information We Collect</h2>
            <p>We only collect information necessary to provide and improve your interview preparation experience:</p>
            
            <div className="legal-card-grid">
              <div className="legal-sub-card">
                <div className="sub-card-icon"><UserCheck size={18} /></div>
                <h4>Account Information</h4>
                <p>When you register, we collect your username, email address, and an encrypted password hash. We never store plaintext passwords.</p>
              </div>

              <div className="legal-sub-card">
                <div className="sub-card-icon"><Database size={18} /></div>
                <h4>User Activity & Prep Data</h4>
                <p>We store your saved bookmarks, question completion statuses (e.g., solved, attempted), personal solution notes, and dashboard progress metrics.</p>
              </div>

              <div className="legal-sub-card">
                <div className="sub-card-icon"><Eye size={18} /></div>
                <h4>Technical & Log Data</h4>
                <p>Basic diagnostic logs including IP address, browser type, and page access timestamps to diagnose errors and prevent abuse.</p>
              </div>
            </div>
          </section>

          <section id="sec-usage" className="legal-section">
            <h2>3. How We Use Your Data</h2>
            <p>We use the data collected strictly for the following purposes:</p>
            <ul className="legal-bullet-list">
              <li><strong>Providing Core Services:</strong> Allowing you to track your interview prep progress, bookmark questions across devices, and organize targeted company problem sets.</li>
              <li><strong>Authentication & Account Management:</strong> Ensuring secure login sessions via JSON Web Tokens (JWT).</li>
              <li><strong>Platform Optimization:</strong> Measuring aggregated traffic metrics to identify popular companies and topics to expand our curated dataset.</li>
              <li><strong>Security & Abuse Prevention:</strong> Detecting brute-force attempts, automated scrapers, and malicious activity.</li>
            </ul>
            <div className="legal-callout">
              <strong>We never sell your data.</strong> DSA Prep does not sell, rent, or trade your personal information or interview progress data to third-party advertisers or recruiters.
            </div>
          </section>

          <section id="sec-auth" className="legal-section">
            <h2>4. Authentication & Security</h2>
            <p>
              We implement industry-standard technical and organizational security measures to protect your information:
            </p>
            <ul className="legal-bullet-list">
              <li><strong>Cryptographic Password Hashing:</strong> User passwords are encrypted using strong salted hashing algorithms (bcrypt) before storage.</li>
              <li><strong>Encrypted Transport:</strong> All communication between your browser and our servers is strictly transmitted over HTTPS / TLS 1.3 encryption.</li>
              <li><strong>Stateless JWT Authentication:</strong> Session authentication uses secure, signed JSON Web Tokens stored in memory or client-side storage.</li>
            </ul>
          </section>

          <section id="sec-cookies" className="legal-section">
            <h2>5. Cookies & Local Storage</h2>
            <p>
              DSA Prep uses minimal cookies and HTML5 Local Storage strictly for functional and performance purposes:
            </p>
            <ul className="legal-bullet-list">
              <li><strong>Auth Token:</strong> Storing your authentication session token so you stay logged in between page refreshes.</li>
              <li><strong>Preferences:</strong> Storing UI preferences such as theme settings, sidebar toggles, and filter choices.</li>
              <li><strong>Offline Cache:</strong> Caching frequently visited company question lists for rapid navigation.</li>
            </ul>
            <p>You can clear your cookies and local storage anytime via your browser settings.</p>
          </section>

          <section id="sec-sharing" className="legal-section">
            <h2>6. Third-Party Sharing</h2>
            <p>
              We do not share your personal information with external entities except in the following limited circumstances:
            </p>
            <ul className="legal-bullet-list">
              <li><strong>Infrastructure Providers:</strong> Cloud hosting, database hosting, and DNS providers essential to running the application.</li>
              <li><strong>Legal Requirements:</strong> If compelled by lawful court orders, subpoenas, or applicable law enforcement requirements.</li>
            </ul>
          </section>

          <section id="sec-rights" className="legal-section">
            <h2>7. Your Rights (GDPR & CCPA)</h2>
            <p>Depending on your location, you have the following rights regarding your data:</p>
            <ul className="legal-bullet-list">
              <li><strong>Right to Access & Export:</strong> You can request a copy of your stored profile data, bookmarks, and problem progress.</li>
              <li><strong>Right to Rectification:</strong> You can update or correct your account details directly from your Profile settings.</li>
              <li><strong>Right to Erasure (Account Deletion):</strong> You can request complete deletion of your account and all associated bookmarks and notes.</li>
            </ul>
          </section>

          <section id="sec-contact" className="legal-section">
            <h2>8. Contact & Inquiries</h2>
            <p>
              If you have any questions regarding this Privacy Policy or wish to exercise your privacy rights, please reach out to our team:
            </p>
            <div className="legal-contact-card">
              <Mail size={18} className="legal-contact-icon" />
              <div>
                <strong>Privacy & Security Team</strong>
                <p>Email: <a href="mailto:privacy@dsaprep.dev">privacy@dsaprep.dev</a></p>
                <p>Or send a message via our <Link to="/contact">Contact Page</Link>.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
