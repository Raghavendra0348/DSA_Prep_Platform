import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scale, BookOpen, AlertTriangle, ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
import './Privacy.css';

export default function Terms() {
  useEffect(() => {
    document.title = 'Terms of Service — DSA Prep Platform';
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
            <Scale size={14} />
            <span>TERMS & CONDITIONS</span>
          </div>
          <h1 className="legal-title">Terms of Service</h1>
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
              <button type="button" onClick={() => scrollToSection('sec-agreement')}>1. Acceptance of Terms</button>
              <button type="button" onClick={() => scrollToSection('sec-purpose')}>2. Educational Purpose</button>
              <button type="button" onClick={() => scrollToSection('sec-accounts')}>3. User Accounts & Access</button>
              <button type="button" onClick={() => scrollToSection('sec-ip')}>4. IP & Trademark Notice</button>
              <button type="button" onClick={() => scrollToSection('sec-conduct')}>5. Acceptable Conduct</button>
              <button type="button" onClick={() => scrollToSection('sec-disclaimer')}>6. Disclaimers & Liability</button>
              <button type="button" onClick={() => scrollToSection('sec-changes')}>7. Changes & Termination</button>
              <button type="button" onClick={() => scrollToSection('sec-contact')}>8. Contact Information</button>
            </nav>
          </div>
        </aside>

        {/* Terms Content */}
        <main className="legal-content">
          <section id="sec-agreement" className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the <strong>DSA Prep Platform</strong> website, tools, and services (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not access or use the Service.
            </p>
          </section>

          <section id="sec-purpose" className="legal-section">
            <h2>2. Educational Purpose & Fair Use</h2>
            <p>
              DSA Prep is an educational platform designed to assist software engineers, students, and professionals in preparing for technical coding interviews.
            </p>
            <p>
              The problem statements, algorithm categorizations, and company interview frequency statistics are aggregated from publicly shared candidate experiences, community submissions, and public technical interview discussions under educational fair use principles.
            </p>
          </section>

          <section id="sec-accounts" className="legal-section">
            <h2>3. User Accounts & Security</h2>
            <p>To use certain features (such as saving bookmarks, tracking progress, and writing personal notes), you may create a user account:</p>
            <ul className="legal-bullet-list">
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>You must provide accurate and up-to-date registration information.</li>
              <li>You agree to notify us immediately if you suspect unauthorized access to your account.</li>
            </ul>
          </section>

          <section id="sec-ip" className="legal-section">
            <h2>4. Intellectual Property & Trademark Disclaimers</h2>
            <p>
              <strong>Company Names & Logos:</strong> All company names, logos, and trademarks displayed on this platform (including but not limited to Google, Amazon, Microsoft, Meta, Apple, Netflix, Uber, etc.) are the property of their respective owners.
            </p>
            <p>
              <strong>LeetCode & Third-Party Platforms:</strong> LeetCode is a registered trademark of LeetCode LLC. DSA Prep is an independent educational tool and is not affiliated with, endorsed by, or sponsored by LeetCode or any employer listed on this site.
            </p>
            <div className="legal-callout">
              Reference to any specific company or product does not constitute or imply an endorsement, recommendation, or affiliation by that company.
            </div>
          </section>

          <section id="sec-conduct" className="legal-section">
            <h2>5. Acceptable Conduct</h2>
            <p>You agree not to engage in any of the following prohibited activities:</p>
            <ul className="legal-bullet-list">
              <li>Using automated scripts, bots, or scrapers to overwhelm or extract bulk data from the service.</li>
              <li>Attempting to probe, scan, or test the vulnerability of the system or breach security mechanisms.</li>
              <li>Impersonating another user or misrepresenting your affiliation with any entity.</li>
              <li>Reverse engineering or disrupting the platform infrastructure.</li>
            </ul>
          </section>

          <section id="sec-disclaimer" className="legal-section">
            <h2>6. Disclaimers & Limitation of Liability</h2>
            <p>
              The Service is provided on an <strong>&quot;AS IS&quot;</strong> and <strong>&quot;AS AVAILABLE&quot;</strong> basis without warranties of any kind. While we strive to maintain accurate and up-to-date interview questions and frequencies, interview processes vary widely and we cannot guarantee that any specific question will appear in your actual interview.
            </p>
            <p>
              In no event shall DSA Prep or its contributors be liable for any indirect, incidental, or consequential damages resulting from your use of the platform.
            </p>
          </section>

          <section id="sec-changes" className="legal-section">
            <h2>7. Changes to Terms & Termination</h2>
            <p>
              We reserve the right to modify these Terms at any time. When changes are made, we will update the &quot;Last Updated&quot; date at the top of this page. Continued use of the platform following any modifications constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section id="sec-contact" className="legal-section">
            <h2>8. Contact Information</h2>
            <p>
              For legal inquiries, trademark concerns, or questions regarding these Terms, please contact:
            </p>
            <div className="legal-contact-card">
              <Mail size={18} className="legal-contact-icon" />
              <div>
                <strong>Legal & Compliance Team</strong>
                <p>Email: <a href="mailto:legal@dsaprep.dev">legal@dsaprep.dev</a></p>
                <p>Or send a message via our <Link to="/contact">Contact Page</Link>.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
