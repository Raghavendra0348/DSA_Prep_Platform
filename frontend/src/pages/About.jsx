import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2, Building2, BookOpen, Tags, Award,
  CheckCircle2, Target, Users, ShieldCheck, ArrowRight, Zap, Flame, Compass
} from 'lucide-react';
import './About.css';

export default function About() {
  useEffect(() => {
    document.title = 'About DSA Prep — The Engineering Interview Platform';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      {/* ── 1. Hero Section ────────────────────────────────────────────────── */}
      <section className="about-hero">
        <div className="about-hero-content container">
          <div className="about-badge">
            <Code2 size={14} />
            <span>OUR MISSION & PLATFORM</span>
          </div>
          <h1 className="about-title">
            Built by Engineers, <span className="about-highlight">for Engineers</span>
          </h1>
          <p className="about-subtitle">
            DSA Prep is a comprehensive, free interview preparation platform organizing <strong>3,392+ real LeetCode questions</strong> across <strong>429+ top technology employers</strong>. We help engineers focus on high-yield, company-specific patterns instead of solving random problems.
          </p>
          <div className="about-hero-actions">
            <Link to="/companies" className="btn-about-primary">
              <span>Explore Companies</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/topics" className="btn-about-secondary">
              <Compass size={16} />
              <span>Browse DSA Topics</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Platform Metrics & Stats ────────────────────────────────────── */}
      <section className="about-stats-section">
        <div className="container">
          <div className="about-stats-grid">
            <div className="about-stat-card">
              <div className="about-stat-icon-wrap icon-cyan">
                <Building2 size={22} />
              </div>
              <div className="about-stat-val">429+</div>
              <div className="about-stat-label">Target Companies</div>
              <div className="about-stat-sub">From FAANG to high-growth startups</div>
            </div>

            <div className="about-stat-card">
              <div className="about-stat-icon-wrap icon-purple">
                <BookOpen size={22} />
              </div>
              <div className="about-stat-val">3,392+</div>
              <div className="about-stat-label">Interview Questions</div>
              <div className="about-stat-sub">Sorted by recency & frequency</div>
            </div>

            <div className="about-stat-card">
              <div className="about-stat-icon-wrap icon-emerald">
                <Tags size={22} />
              </div>
              <div className="about-stat-val">173+</div>
              <div className="about-stat-label">DSA Core Topics</div>
              <div className="about-stat-sub">Arrays, DP, Graphs & beyond</div>
            </div>

            <div className="about-stat-card">
              <div className="about-stat-icon-wrap icon-amber">
                <Award size={22} />
              </div>
              <div className="about-stat-val">4 Tiers</div>
              <div className="about-stat-label">Employer Tiers</div>
              <div className="about-stat-sub">MAANG, Unicorn, Fintech & Service</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Why DSA Prep Was Built ──────────────────────────────────────── */}
      <section className="about-story-section">
        <div className="container">
          <div className="about-story-grid">
            <div className="about-story-text">
              <span className="about-section-tag">WHY WE BUILT THIS</span>
              <h2>The Problem with Traditional Interview Prep</h2>
              <p>
                Preparing for coding interviews often feels overwhelming. With thousands of problems available online, candidates frequently waste hundreds of hours solving questions that are rarely asked at their target companies.
              </p>
              <p>
                Every tech company has a distinct hiring philosophy: Google emphasizes algorithmic intuition and graph traversals; Meta focuses heavily on speed and classic top-frequency patterns; Amazon stresses scalable tree/graph logic; and fintech firms test precise edge-case handling.
              </p>
              <p>
                <strong>DSA Prep bridges this gap.</strong> By categorizing real interview questions asked across 6-month, 1-year, and 2-year windows, we provide candidate-focused clarity so every minute of practice counts.
              </p>
            </div>

            <div className="about-story-card">
              <h3>Our Core Principles</h3>
              <ul className="about-principles-list">
                <li>
                  <div className="principle-icon"><CheckCircle2 size={18} /></div>
                  <div>
                    <strong>100% Free & Open Access</strong>
                    <p>No paywalls, subscriptions, or gated problem sets. Premium-quality preparation for all.</p>
                  </div>
                </li>
                <li>
                  <div className="principle-icon"><CheckCircle2 size={18} /></div>
                  <div>
                    <strong>Data-Driven Recency</strong>
                    <p>Track questions tagged by real candidates in the last 30 days to 2+ years.</p>
                  </div>
                </li>
                <li>
                  <div className="principle-icon"><CheckCircle2 size={18} /></div>
                  <div>
                    <strong>Targeted Employer Tiers</strong>
                    <p>Navigate structured lists tailored for freshers, mid-level, and senior engineers.</p>
                  </div>
                </li>
                <li>
                  <div className="principle-icon"><CheckCircle2 size={18} /></div>
                  <div>
                    <strong>Privacy & Developer Respect</strong>
                    <p>No intrusive trackers. Fast, lightweight interface built for developers.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Employer Tier Framework ─────────────────────────────────────── */}
      <section className="about-tiers-section">
        <div className="container">
          <div className="about-section-header">
            <span className="about-section-tag">CLASSIFICATION SYSTEM</span>
            <h2>Our Employer Tier Framework</h2>
            <p>We classify 429+ companies into 4 strategic tiers to streamline your preparation roadmap.</p>
          </div>

          <div className="about-tiers-grid">
            <div className="about-tier-item tier-maang">
              <div className="tier-badge-top">TIER 1 • MAANG+</div>
              <h3>Elite Tech Giants</h3>
              <p>Google, Meta, Apple, Microsoft, Amazon, Netflix, Uber. High bar on algorithmic optimization, tree/graph mastery, and system design intuition.</p>
              <div className="tier-examples">e.g. Google, Meta, Microsoft, Apple, Amazon</div>
            </div>

            <div className="tier-item tier-unicorns">
              <div className="tier-badge-top">TIER 2 • PRODUCT UNICORNS</div>
              <h3>High-Scale Product Companies</h3>
              <p>Flipkart, Swiggy, Zomato, Atlassian, Adobe, Salesforce. Focus on practical problem solving, dynamic programming, and clean modular code.</p>
              <div className="tier-examples">e.g. Flipkart, Swiggy, Atlassian, Adobe</div>
            </div>

            <div className="tier-item tier-fintech">
              <div className="tier-badge-top">TIER 3 • FINTECH & STARTUPS</div>
              <h3>Fintech & High-Growth Startups</h3>
              <p>Paytm, Razorpay, CRED, PhonePe, Groww. Emphasizes concurrency, data structures, and edge-case rigor under tight constraints.</p>
              <div className="tier-examples">e.g. Razorpay, CRED, PhonePe, Paytm</div>
            </div>

            <div className="tier-item tier-service">
              <div className="tier-badge-top">TIER 4 • SERVICE & CONSULTING</div>
              <h3>Global IT & Consulting</h3>
              <p>TCS, Infosys, Accenture, Wipro, Cognizant. Strong focus on fundamental logic, string/array manipulation, and core coding proficiency.</p>
              <div className="tier-examples">e.g. TCS, Infosys, Accenture, Cognizant</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Bottom CTA ──────────────────────────────────────────────────── */}
      <section className="about-cta-section">
        <div className="container">
          <div className="about-cta-card">
            <h2>Ready to Accelerate Your Prep?</h2>
            <p>Browse questions for your target company or practice by topic today.</p>
            <div className="about-cta-buttons">
              <Link to="/companies" className="btn-about-primary">
                <span>Browse Companies</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="btn-about-secondary">
                <span>Contact the Team</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
