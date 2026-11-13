import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, ArrowRight,

} from 'lucide-react';

import { useLanding } from '../hooks/useLanding';

import { getClassification, TIER_INFO } from '../data/companyClassification';
import CompanyLogo from '../components/ui/CompanyLogo';
import TierBadge from '../components/ui/TierBadge';
import Skeleton from '../components/ui/Skeleton';
import { staggerContainer, cardItem, fadeUp } from '../lib/animations';
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
      <section className="hero">
        <div className="hero-split container">
          <div className="hero-copy">
            <div className="hero-announcement">THE INTERVIEW PRACTICE INDEX</div>
            <h1 className="hero-title">Less searching.<br /><span className="hero-highlight">More solving.</span></h1>
            <p className="hero-subtitle">Find the questions asked at your target company. Practice by topic, difficulty, and recency. Keep track as you go.</p>
          {/* Hero Search Box */}
          <motion.form className="hero-search" onSubmit={handleSearch} variants={fadeUp}>
            <Search size={20} className="hero-search-icon" />
            <input
              type="text"
              className="hero-search-input"
              aria-label="Search companies or DSA topics" placeholder="Company or topic, e.g. Google or Array"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn-hero-search">
              <span>Search</span>
              <ArrowRight size={16} />
            </button>
          </motion.form>

          {/* Popular Tag Quick Links */}
          <motion.div className="hero-popular-tags" variants={fadeUp}>
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
          </motion.div>

            <div className="hero-actions">
              <Link to="/companies">Browse companies <ArrowRight size={16} /></Link>
              <Link to="/topics">Explore topics <ArrowRight size={16} /></Link>
            </div>
          </div>
          <aside className="pattern-preview" aria-labelledby="pattern-preview-title">
            <div className="pattern-preview-topline">
              <span>PATTERN SPOTLIGHT</span>
              <span>01 / TWO POINTERS</span>
            </div>
            <h2 id="pattern-preview-title">Find the pattern.<br />Then find the answer.</h2>
            <p className="pattern-preview-intro">Two pointers. One sorted array. A little less work.</p>

            <div className="pattern-example" role="img" aria-label="Two pointers example: in the sorted array 2, 4, 5, 7, 9, the left value 2 and right value 9 add up to the target 11.">
              <div className="pattern-example-label"><span>sorted array</span><span>target = 11</span></div>
              <div className="pattern-array" aria-hidden="true">
                <span className="pattern-cell pattern-cell-selected">2</span>
                <span className="pattern-cell">4</span>
                <span className="pattern-cell">5</span>
                <span className="pattern-cell">7</span>
                <span className="pattern-cell pattern-cell-selected">9</span>
              </div>
              <div className="pattern-pointers" aria-hidden="true">
                <span>↑<br />left</span><span className="pattern-pointer-line" /><span>↑<br />right</span>
              </div>
              <div className="pattern-result"><span>2 + 9</span><span>=</span><strong>11 <span>✓</span></strong></div>
            </div>

            <Link className="pattern-practice-link" to="/topics/two-pointers">Practice two pointers <ArrowRight size={17} /></Link>
            <div className="pattern-other-topics">
              <span>Up next</span>
              <Link to="/topics/binary-search">Binary search <ArrowRight size={13} /></Link>
              <Link to="/topics/sliding-window">Sliding window <ArrowRight size={13} /></Link>
            </div>
          </aside>
        </div>
      </section>

      {/* ── 2. Live Platform Metrics Bar ───────────────────────────────────── */}
      <section className="stats-bar" >
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

                value={stats?.totalCompanies}
                label="Target Companies"
                to="/companies"

              />
              <StatCard

                value={stats?.totalQuestions}
                label="Interview Questions"
                to="/companies"

              />
              <StatCard

                value={stats?.totalTopics}
                label="DSA Topics"
                to="/topics"

              />
              <StatCard
                value={4}
                label="Tier Categories"
                to="/companies"

              />
            </>
          )}
        </div>
      </section>


      {/* ── 4. Featured Companies Section ──────────────────────────────────── */}
      <section className="featured-section">
        <div className="container">
          <motion.div
            className="section-header"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <span className="section-badge">01 / COMPANY DIRECTORY</span>
            <h2 className="section-title">Where are you interviewing?</h2>
            <p className="section-subtitle">Choose a company to see its interview questions.</p>
          </motion.div>

          <motion.div
            className="featured-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
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
                    <motion.div key={company.slug} variants={cardItem}>
                      <Link
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
                    </motion.div>
                  );
                })
            }
          </motion.div>

          <div className="featured-bottom-cta">
            <Link to="/companies" className="btn-outline-lg">
              <span>View all companies</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>



      <section className="study-note container">
        <span className="section-badge">02 / STUDY BY TOPIC</span>
        <div><h2>Working on a specific pattern?</h2><p>Build your understanding with questions grouped by DSA topic.</p></div>
        <Link to="/topics">Explore topics <ArrowRight size={18} /></Link>
      </section>
    </div>
  );
}

function StatCard({ value, label, to }) {
  return (
    <Link to={to} className="stat-card">
      <span className="stat-card-value">{value == null ? '—' : value.toLocaleString()}</span>
      <span className="stat-card-label">{label}</span>
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}
