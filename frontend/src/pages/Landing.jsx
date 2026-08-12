import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Building2, BookOpen, Tags, TrendingUp, Target, Filter } from 'lucide-react';
import { getStats } from '../api/stats';
import { getCompanies } from '../api/companies';
import Skeleton from '../components/ui/Skeleton';
import './Landing.css';

// Featured companies to highlight
const FEATURED_SLUGS = [
  'google', 'meta', 'amazon', 'apple', 'microsoft', 'netflix',
  'flipkart', 'paytm', 'swiggy', 'zomato', 'infosys', 'wipro',
];

export default function Landing() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const statsRef = useRef(null);
  const [countersVisible, setCountersVisible] = useState(false);

  useEffect(() => {
    document.title = 'DSA Prep — Company-Wise LeetCode Questions';

    async function loadData() {
      try {
        const [statsRes, companiesRes] = await Promise.all([
          getStats(),
          getCompanies(),
        ]);
        setStats(statsRes);

        // Match featured companies from full list
        const companies = companiesRes.companies || companiesRes;
        const featuredList = FEATURED_SLUGS
          .map(slug => companies.find(c => c.slug === slug))
          .filter(Boolean);
        setFeatured(featuredList);
      } catch (err) {
        console.error('Failed to load landing data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Count-up animation trigger on scroll
  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCountersVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/companies?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="landing">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content container">
          <h1 className="hero-title">
            Ace Your <span className="hero-highlight">Tech Interview</span>
          </h1>
          <p className="hero-subtitle">
            Browse <strong>471+ companies'</strong> real LeetCode questions — filtered by
            recency, difficulty &amp; topic. Track your progress and land your dream job.
          </p>

          <form className="hero-search" onSubmit={handleSearch}>
            <Search size={20} className="hero-search-icon" />
            <input
              type="text"
              className="hero-search-input"
              placeholder="Search a company... (e.g. Google, Amazon)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary hero-search-btn">
              Search
            </button>
          </form>

          <div className="hero-actions">
            <Link to="/companies" className="btn btn-primary btn-lg">
              Browse All Companies <ArrowRight size={18} />
            </Link>
            <Link to="/topics" className="btn btn-ghost btn-lg">
              Explore Topics
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      <section className="stats-bar" ref={statsRef}>
        <div className="stats-bar-inner container">
          {loading ? (
            <>
              {[1, 2, 3].map(i => (
                <div key={i} className="stat-card">
                  <Skeleton width={48} height={48} style={{ borderRadius: '12px' }} />
                  <Skeleton width={60} height={28} />
                  <Skeleton width={80} height={14} />
                </div>
              ))}
            </>
          ) : (
            <>
              <StatCard
                icon={Building2}
                value={stats?.totalCompanies || 471}
                label="Companies"
                visible={countersVisible}
              />
              <StatCard
                icon={BookOpen}
                value={stats?.totalQuestions || 3257}
                label="Questions"
                visible={countersVisible}
              />
              <StatCard
                icon={Tags}
                value={stats?.totalTopics || 74}
                label="DSA Topics"
                visible={countersVisible}
              />
            </>
          )}
        </div>
      </section>

      {/* ── Featured Companies ─────────────────────────────────────────────── */}
      <section className="featured-section">
        <div className="container">
          <h2 className="section-title">Featured Companies</h2>
          <p className="section-subtitle">Start preparing for your target company</p>

          <div className="featured-grid">
            {loading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="card featured-card">
                    <Skeleton width="60%" height={20} />
                    <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                      <Skeleton width={50} height={22} style={{ borderRadius: 6 }} />
                      <Skeleton width={50} height={22} style={{ borderRadius: 6 }} />
                      <Skeleton width={50} height={22} style={{ borderRadius: 6 }} />
                    </div>
                  </div>
                ))
              : featured.map(company => (
                  <Link
                    key={company.slug}
                    to={`/company/${company.slug}`}
                    className="card featured-card"
                  >
                    <div className="featured-card-header">
                      <h3 className="featured-card-name">{company.name}</h3>
                      <span className="featured-card-count">
                        {company.questionCount || company._count?.questions || '—'} problems
                      </span>
                    </div>
                    <div className="featured-card-topics">
                      {(company.topTopics || []).slice(0, 3).map(topic => (
                        <span key={topic} className="chip">{topic}</span>
                      ))}
                    </div>
                    <span className="featured-card-cta">
                      View Problems <ArrowRight size={14} />
                    </span>
                  </Link>
                ))
            }
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section className="how-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Three simple steps to ace your interviews</p>

          <div className="how-steps">
            <div className="how-step">
              <div className="how-step-icon">
                <Target size={28} />
              </div>
              <h3>Pick a Company</h3>
              <p>Browse 471+ companies or search for your target company</p>
            </div>
            <div className="how-step-arrow">→</div>
            <div className="how-step">
              <div className="how-step-icon">
                <Filter size={28} />
              </div>
              <h3>Choose Time Period</h3>
              <p>Filter by 30 days, 3 months, 6 months, or all-time frequency</p>
            </div>
            <div className="how-step-arrow">→</div>
            <div className="how-step">
              <div className="how-step-icon">
                <TrendingUp size={28} />
              </div>
              <h3>Track &amp; Solve</h3>
              <p>Mark problems as solved, bookmark favorites, track progress</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-banner">
            <h2>Start Your DSA Prep Today</h2>
            <p>Join thousands of developers preparing for their dream company</p>
            <Link to="/companies" className="btn btn-primary btn-lg">
              Get Started <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Animated Counter Card ────────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, visible }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const duration = 1500;
    const steps = 40;
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

  return (
    <div className="stat-card">
      <div className="stat-card-icon">
        <Icon size={24} />
      </div>
      <span className="stat-card-value">{count.toLocaleString()}+</span>
      <span className="stat-card-label">{label}</span>
    </div>
  );
}
