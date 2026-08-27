import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, BookOpen,
  Sparkles,
} from 'lucide-react';

import { useLanding } from '../hooks/useLanding';
import { useIntersection } from '../hooks/useIntersection';
import { getClassification, TIER_INFO } from '../data/companyClassification';
import CompanyLogo from '../components/ui/CompanyLogo';
import TierBadge from '../components/ui/TierBadge';
import Skeleton from '../components/ui/Skeleton';
import './Landing.css';

const POPULAR_SEARCHES = ['Google', 'Amazon', 'Meta', 'Flipkart', 'Dynamic Programming', 'Array', 'TCS'];

export default function Landing() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // ── TanStack Query — all three queries run in parallel, cached 10 min ──
  const { stats, featured, allCompanies, loading } = useLanding();

  useEffect(() => {
    document.title = 'DSA Prep — Company-Wise LeetCode Questions';
  }, []);

  // Count-up animation trigger on scroll — useIntersection fires once when section enters viewport
  const [statsRef, countersVisible] = useIntersection({ threshold: 0.2 }, true);

  const performSearch = (term) => {
    const clean = term?.trim();
    if (!clean) return;

    const lower = clean.toLowerCase();
    const slugCandidate = lower.replace(/\s+/g, '-');

    // Check if query matches a company by slug or name
    const matchedCompany = allCompanies.find(
      c => c.slug?.toLowerCase() === slugCandidate ||
           c.slug?.toLowerCase() === lower ||
           c.name?.toLowerCase() === lower
    );

    if (matchedCompany) {
      navigate(`/company/${matchedCompany.slug}`);
      return;
    }


    // Check if query matches a known DSA topic
    const knownTopics = [
      'array', 'dynamic-programming', 'string', 'tree', 'graph',
      'hash-table', 'sorting', 'greedy', 'binary-search', 'two-pointers',
      'stack', 'matrix', 'sliding-window', 'backtracking', 'linked-list', 'bit-manipulation'
    ];
    if (knownTopics.includes(slugCandidate)) {
      navigate(`/topics/${slugCandidate}`);
      return;
    }

    // Default fallback to companies list search filter
    navigate(`/companies?q=${encodeURIComponent(clean)}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  return (
    <div className="landing">
      {/* ── 1. Hero Section ────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg-glow hero-bg-glow-1" />
        <div className="hero-bg-glow hero-bg-glow-2" />

        <div className="hero-content container">
          {/* Announcement Badge */}
          <div className="hero-announcement">
            <span className="announcement-pill">NEW 2026 EDITION</span>
            <span className="announcement-text">Curated Company-Wise Questions & Tier Lists</span>
          </div>

          <h1 className="hero-title">
            Ace Your Next <span className="hero-highlight">Tech Interview</span>
          </h1>

          <p className="hero-subtitle">
            Practice real LeetCode questions asked at <strong>429+ top companies</strong>.
            Organized by recency, difficulty, and tier classification to fast-track your prep.
          </p>

          {/* Hero Search Box */}
          <form className="hero-search" onSubmit={handleSearch}>
            <Search size={20} className="hero-search-icon" />
            <input
              type="text"
              className="hero-search-input"
              placeholder="Search your target company (e.g. Google, Amazon, Swiggy)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn-hero-search">
              <span>Search</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Popular Tag Quick Links */}
          <div className="hero-popular-tags">
            <span className="popular-label">Popular:</span>
            {POPULAR_SEARCHES.map(tag => (
              <button
                key={tag}
                className="popular-tag-btn"
                onClick={() => performSearch(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Hero CTAs */}
          <div className="hero-actions">
            <Link to="/companies" className="btn-hero-primary">
              <span>Browse All Companies</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/topics" className="btn-hero-secondary">
              <BookOpen size={18} />
              <span>Explore Topics</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Live Platform Metrics Bar ───────────────────────────────────── */}
      <section className="stats-bar" ref={statsRef}>
        <div className="stats-bar-inner container">
          {loading ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="stat-card stat-card-skeleton">
                  <div className="stat-card-header">
                    <Skeleton width={44} height={44} style={{ borderRadius: '12px' }} />
                    <Skeleton width={90} height={24} style={{ borderRadius: '999px' }} />
                  </div>
                  <div className="stat-card-body" style={{ marginTop: '16px' }}>
                    <Skeleton width={100} height={32} style={{ borderRadius: '6px', marginBottom: '8px' }} />
                    <Skeleton width={140} height={18} style={{ borderRadius: '4px', marginBottom: '6px' }} />
                    <Skeleton width={180} height={14} style={{ borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <StatCard
               
                value={stats?.totalCompanies || 429}
                label="Target Companies"
                subtext="Product & Service Leaders"
                badge="FAANG & Tech"
                theme="cyan"
                to="/companies"
                visible={countersVisible}
              />
              <StatCard
                
                value={stats?.totalQuestions || 3392}
                label="Interview Questions"
                subtext="Tag & Frequency Ranked"
                badge="Real LeetCode"
                theme="purple"
                to="/companies"
                visible={countersVisible}
              />
              <StatCard
                
                value={stats?.totalTopics || 173}
                label="DSA Topics"
                subtext="Arrays to Graph & DP"
                badge="Roadmap Ready"
                theme="emerald"
                to="/topics"
                visible={countersVisible}
              />
              <StatCard
                value={4}
                label="Tier Categories"
                subtext="MAANG to Service Tier"
                badge="Tier Classified"
                theme="amber"
                to="/companies"
                visible={countersVisible}
              />
            </>
          )}
        </div>
      </section>

      {/* ── 3. Why Prepare With Us (Features Section) ─────────────────────── */}
     

      {/* ── 4. Featured Companies Section ──────────────────────────────────── */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">DIRECTORY HIGHLIGHTS</span>
            <h2 className="section-title">Top Target Companies</h2>
            <p className="section-subtitle">Start preparing questions for top tech employers</p>
          </div>

          <div className="featured-grid">
            {loading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="card featured-card-skeleton">
                    <Skeleton width="60%" height={24} />
                    <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
                  </div>
                ))
              : featured.map(company => {
                  const { tier: compTier } = getClassification(company.slug);
                  const compTierInfo = TIER_INFO[compTier];

                  return (
                    <Link
                      key={company.slug}
                      to={`/company/${company.slug}`}
                      className="card featured-card"
                      style={{ '--card-tier-color': compTierInfo.color }}
                    >
                      <div className="featured-card-top">
                        <CompanyLogo slug={company.slug} name={company.name} size={42} />
                        <TierBadge tier={compTier} size="sm" />
                      </div>

                      <div className="featured-card-body">
                        <h3 className="featured-card-name">{company.name}</h3>
                        <span className="featured-card-count">
                          {company.questionCount || company._count?.questions || 0} questions
                        </span>
                      </div>

                      {(company.topTopics || []).length > 0 && (
                        <div className="featured-card-topics">
                          {company.topTopics.slice(0, 3).map(topic => (
                            <span key={topic} className="chip">{topic}</span>
                          ))}
                        </div>
                      )}

                      <span className="featured-card-cta">
                        <span>Practice Questions</span>
                        <ArrowRight size={14} />
                      </span>
                    </Link>
                  );
                })
            }
          </div>

          <div className="featured-bottom-cta">
            <Link to="/companies" className="btn-outline-lg">
              <span>View All 429+ Companies</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. How It Works (Step Workflow) ────────────────────────────────── */}
     

      {/* ── 6. Final Call To Action Banner ─────────────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-glow" />
            <div className="cta-content">
              <div className="cta-icon-badge">
                <Sparkles size={28} />
              </div>
              <h2>Ready To Crack Your Dream Interview?</h2>
              <p>Start practicing company-wise DSA questions completely free. No subscription required.</p>
              <div className="cta-buttons">
                <Link to="/companies" className="btn-cta-primary">
                  <span>Start Practicing Now</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/topics" className="btn-cta-secondary">
                  <span>Browse Topics</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Animated Counter Card ────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  value,
  label,
  subtext,
  badge,
  theme = 'cyan',
  to,
  visible,
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const duration = 1400;
    const steps = 35;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [visible, value]);

  const CardWrapper = to ? Link : 'div';
  const wrapperProps = to
    ? { to, className: `stat-card stat-card-${theme} stat-card-link` }
    : { className: `stat-card stat-card-${theme}` };

  return (
    <CardWrapper {...wrapperProps}>
      <div className="stat-card-header">
        {Icon && (
          <div className="stat-card-icon">
            <Icon size={20} />
          </div>
        )}
        {badge && (
          <span className="stat-card-badge">
            <span className="stat-badge-dot" />
            {badge}
          </span>
        )}
      </div>

      <div className="stat-card-body">
        <div className="stat-card-value-wrap">
          <span className="stat-card-value">{count.toLocaleString()}</span>
          <span className="stat-card-plus">+</span>
        </div>
        <h3 className="stat-card-label">{label}</h3>
        {subtext && <p className="stat-card-subtext">{subtext}</p>}
      </div>

      <div className="stat-card-footer">
        <span className="stat-card-action">
          <span>Explore</span>
          <ArrowRight size={13} className="stat-card-arrow" />
        </span>
      </div>
    </CardWrapper>
  );
}
