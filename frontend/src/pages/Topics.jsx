import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map as MapIcon, Grid, Layers, BookOpen, ArrowUpDown,
  ChevronDown, ChevronUp, ChevronRight,
  ListFilter, SearchX, TrendingUp, Clock, Compass,
  Trophy
} from 'lucide-react';

import { useTopics } from '../hooks/useTopics';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import {
  LEARNING_PHASES,
  TOPIC_CATEGORIES,
  TOPIC_ICONS,
  getTopicCategory,
} from '../data/topicMetadata';

import SearchInput from '../components/shared/SearchInput';
import HighlightMatch from '../components/ui/HighlightMatch';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './Topics.css';

const SORT_OPTIONS = [
  { value: 'most',  label: 'Most Problems' },
  { value: 'least', label: 'Fewest Problems' },
  { value: 'az',    label: 'A → Z' },
  { value: 'za',    label: 'Z → A' },
];

export default function Topics() {
  const { user } = useAuth();
  const { dashboardData } = useDashboard();

  const [sort, setSort]                 = useState('most');
  const [viewMode, setViewMode]         = useState('phases'); // 'phases' | 'categories' | 'table'
  const [collapsedPhases, setCollapsedPhases] = useState(new Set());

  const {
    topics,
    rawCount,
    totalProblems,
    loading,
    error,
    search,
    setSearch,
    category,
    setCategory,
  } = useTopics();

  useEffect(() => {
    document.title = 'DSA Topics & 10-Phase Learning Roadmap — DSA Prep';
  }, []);

  // Quick stats
  const solvedCount = dashboardData?.overview?.totalSolved || 0;
  const overallSolvePercent = totalProblems > 0 ? Math.min(100, Math.round((solvedCount / totalProblems) * 100)) : 0;

  // ── Group Topics into the 10 Master Phases ─────────────────────────────────
  const phaseGroups = useMemo(() => {
    const topicMap = new Map();
    topics.forEach(t => {
      const name = t.name || t.topic || '';
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      topicMap.set(slug, t);
      topicMap.set(name.toLowerCase(), t);
    });

    const usedSlugs = new Set();
    const result = LEARNING_PHASES.map(phaseDef => {
      const matchingTopics = [];
      phaseDef.slugs.forEach(s => {
        const match = topicMap.get(s);
        if (match && !usedSlugs.has(match.name || match.topic)) {
          matchingTopics.push(match);
          usedSlugs.add(match.name || match.topic);
        }
      });

      const phaseTotalProblems = matchingTopics.reduce((acc, t) => acc + (t.problemCount || 0), 0);

      return {
        ...phaseDef,
        topics: matchingTopics,
        totalProblems: phaseTotalProblems,
      };
    });

    // Elective / Remaining topics
    const remaining = topics.filter(t => !usedSlugs.has(t.name || t.topic));
    if (remaining.length > 0) {
      result.push({
        phase: 11,
        title: 'Elective & Domain-Specific Topics',
        shortTitle: 'P11: Electives',
        subtitle: 'Additional specialized interview topics and supplementary algorithms.',
        rule: 'Explore after completing core Phase 1–10 interview foundations.',
        duration: 'Ongoing',
        tier: 'Elective',
        slugs: [],
        color: '#64748b',
        topics: remaining,
        totalProblems: remaining.reduce((acc, t) => acc + (t.problemCount || 0), 0),
      });
    }

    return result;
  }, [topics]);

  // ── Group Topics by CS Domain Categories ──────────────────────────────────
  const categorizedGroups = useMemo(() => {
    const groups = {
      'data-structures': { title: 'Data Structures', icon: Layers, topics: [], color: '#58a6ff' },
      'algorithms':      { title: 'Core Algorithms', icon: Compass, topics: [], color: '#38bdf8' },
      'advanced':        { title: 'Advanced & Graphs', icon: TrendingUp, topics: [], color: '#a855f7' },
      'math-bitwise':    { title: 'Math & Bitwise', icon: BookOpen, topics: [], color: '#ffa116' },
    };

    topics.forEach(t => {
      const cat = getTopicCategory(t.slug);
      if (groups[cat]) {
        groups[cat].topics.push(t);
      } else {
        groups['advanced'].topics.push(t);
      }
    });

    return groups;
  }, [topics]);

  // ── Sorted Flat Topics for Table & Sorting ─────────────────────────────────
  const sortedTopics = useMemo(() => {
    return [...topics].sort((a, b) => {
      const nameA = (a.name || a.topic || '').toLowerCase();
      const nameB = (b.name || b.topic || '').toLowerCase();
      const countA = a.problemCount || 0;
      const countB = b.problemCount || 0;

      if (sort === 'az')    return nameA.localeCompare(nameB);
      if (sort === 'za')    return nameB.localeCompare(nameA);
      if (sort === 'least') return countA - countB;
      return countB - countA; // default: 'most'
    });
  }, [topics, sort]);

  // ── Phase Expand / Collapse Handlers ───────────────────────────────────────
  const togglePhaseCollapse = (phaseNum) => {
    setCollapsedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseNum)) next.delete(phaseNum);
      else next.add(phaseNum);
      return next;
    });
  };

  const collapseAllPhases = () => {
    const all = new Set(phaseGroups.map(p => p.phase));
    setCollapsedPhases(all);
  };

  const expandAllPhases = () => {
    setCollapsedPhases(new Set());
  };

  return (
    <div className="topics-page container">
      {/* Ambient background glow */}
      <div className="topics-ambient-glow" aria-hidden="true" />

      {/* ── Page Hero ─────────────────────────────────────────────────────── */}
      <header className="topics-hero">
        

        <h1 className="topics-hero-title">DSA Topics & Mastery Roadmap</h1>
        

        {/* Metric Cards Bar */}
        <div className="topics-metrics-bar">
          <motion.div
            className="topics-metric-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <span className="metric-number">{rawCount}</span>
            <span className="metric-label">Curated Topics</span>
          </motion.div>

          <motion.div
            className="topics-metric-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <span className="metric-number">{totalProblems.toLocaleString()}</span>
            <span className="metric-label">Total Problems</span>
          </motion.div>

          <motion.div
            className="topics-metric-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <span className="metric-number">10</span>
            <span className="metric-label">Mastery Phases</span>
          </motion.div>

          <motion.div
            className="topics-metric-card highlight"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            {user ? (
              <>
                <div className="metric-top-row">
                  <span className="metric-number">{solvedCount}</span>
                  <span className="metric-pct">{overallSolvePercent}%</span>
                </div>
                <span className="metric-label">Problems Solved</span>
              </>
            ) : (
              <>
                <Trophy size={18} className="metric-icon-accent" />
                <span className="metric-label">Track Your Solves</span>
              </>
            )}
          </motion.div>
        </div>
      </header>

    

      {/* ── Main Controls Bar ──────────────────────────────────────────────── */}
      <div className="topics-controls-panel">
        <div className="topics-controls-top">
          {/* Search Input with Clear Button */}
          <div className="topics-search-box">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search topics (e.g. 'Dynamic Programming')..."
              debounceMs={180}
            />
          </div>

          {/* View Mode Switcher */}
          <div className="topics-view-modes" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'phases'}
              className={`view-mode-tab ${viewMode === 'phases' ? 'active' : ''}`}
              onClick={() => setViewMode('phases')}
            >
              <MapIcon size={15} />
              <span className="tab-label-desktop">10-Phase Roadmap</span>
              <span className="tab-label-mobile">Roadmap</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'categories'}
              className={`view-mode-tab ${viewMode === 'categories' ? 'active' : ''}`}
              onClick={() => setViewMode('categories')}
            >
              <Grid size={15} />
              <span className="tab-label-desktop">Domain Categories</span>
              <span className="tab-label-mobile">Categories</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'table'}
              className={`view-mode-tab ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <ListFilter size={15} />
              <span className="tab-label-desktop">Matrix Table</span>
              <span className="tab-label-mobile">Table</span>
            </button>
          </div>
        </div>

        {/* Secondary Category Filters & Sort Controls */}
        <div className="topics-controls-bottom">
          {/* Taxonomy Category Filter Tabs */}
          <div className="topics-category-filter" role="group" aria-label="Filter by domain">
            {TOPIC_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`topic-cat-chip ${category === cat.id ? 'active' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="topics-actions-group">
            {/* Phase Expand/Collapse Toggles (Phases mode only) */}
            {viewMode === 'phases' && (
              <div className="phase-collapse-actions">
                <button
                  type="button"
                  className="btn-text-action"
                  onClick={expandAllPhases}
                >
                  Expand all
                </button>
                <span className="action-divider">•</span>
                <button
                  type="button"
                  className="btn-text-action"
                  onClick={collapseAllPhases}
                >
                  Collapse all
                </button>
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="topics-sort-wrap">
              <ArrowUpDown size={14} className="sort-icon" />
              <label htmlFor="topics-sort-select" className="sr-only">Sort topics</label>
              <select
                id="topics-sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="topics-sort-select"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content View Rendering ─────────────────────────────────────────── */}
      <main className="topics-main-content">
        {loading ? (
          /* Loading Skeleton State */
          <div className="topics-skeletons-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="card topic-card-skeleton">
                <Skeleton width={44} height={44} style={{ borderRadius: 12 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="60%" height={18} />
                  <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
                  <Skeleton width="90%" height={8} style={{ marginTop: 12, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <EmptyState message={`Failed to load topics: ${error}`} />
        ) : topics.length === 0 ? (
          /* Empty / No Match State */
          <div className="card topics-empty-card">
            <SearchX size={44} className="empty-icon text-muted" />
            <h3>No topics found</h3>
            <p>No topics match your current filter and search query "{search}".</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearch(''); setCategory('all'); }}
            >
              Reset all filters
            </button>
          </div>
        ) : viewMode === 'phases' ? (
          /* ═══════════════════════════════════════════════════════════════════
             VIEW MODE 1: CONNECTED ROADMAP TIMELINE
             ═══════════════════════════════════════════════════════════════════ */
          <motion.div
            key="phases"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
            className="roadmap-timeline"
          >
            {phaseGroups.map((pg, pIdx) => {
              if (pg.topics.length === 0 && search) return null;
              const isCollapsed = collapsedPhases.has(pg.phase);
              const isElective = pg.phase > 10;
              const isLast = pIdx === phaseGroups.length - 1;

              return (
                <motion.div
                  key={pg.phase}
                  id={`phase-${pg.phase}`}
                  className={`roadmap-step ${isCollapsed ? 'step-collapsed' : ''}`}
                  style={{ '--step-color': pg.color }}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(pIdx * 0.04, 0.4) }}
                >
                  {/* Connected Node Milestone Marker */}
                  <div className="roadmap-node-col" aria-hidden="true">
                    <motion.div
                      className="roadmap-milestone-node"
                      whileHover={{ scale: 1.15, rotate: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <div className="node-pulse-ring" />
                      <span className="node-num">{!isElective ? String(pg.phase).padStart(2, '0') : '★'}</span>
                    </motion.div>
                    {!isLast && (
                      <div className="roadmap-connector-line">
                        <div className="connector-energy-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Step Content Card */}
                  <section className="roadmap-step-card card" aria-labelledby={`phase-title-${pg.phase}`}>
                    <button
                      type="button"
                      className="roadmap-step-header"
                      onClick={() => togglePhaseCollapse(pg.phase)}
                      aria-expanded={!isCollapsed}
                    >
                      <div className="step-header-main">
                        

                        <h2 id={`phase-title-${pg.phase}`} className="step-title">
                          {pg.title}
                        </h2>

                        <div className="step-rule-box">
                          <BookOpen size={13} className="rule-icon" />
                          <span><strong>Pattern Rule:</strong> {pg.rule}</span>
                        </div>
                      </div>

                      <div className="step-toggle-side">
                        <span className="phase-count-badge">
                          {pg.topics.length} {pg.topics.length === 1 ? 'topic' : 'topics'}
                        </span>
                        <div className="step-toggle-icon">
                          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </div>
                      </div>
                    </button>

                    {/* Step Topics Grid */}
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.div
                          key="step-topics-wrap"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="roadmap-step-topics">
                            {pg.topics.length > 0 ? (
                              pg.topics.map(t => (
                                <TopicCard key={t.slug} topic={t} search={search} accentColor={pg.color} />
                              ))
                            ) : (
                              <div className="phase-empty-notice">
                                No topics matched in this phase for "{search}".
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                </motion.div>
              );
            })}
          </motion.div>
        ) : viewMode === 'categories' ? (
          /* ═══════════════════════════════════════════════════════════════════
             VIEW MODE 2: DOMAIN CATEGORIZED VIEW
             ═══════════════════════════════════════════════════════════════════ */
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
            className="categories-flow"
          >
            {Object.entries(categorizedGroups).map(([catKey, catData]) => {
              if (catData.topics.length === 0) return null;
              const Icon = catData.icon;

              return (
                <section key={catKey} className="category-domain-section" style={{ '--domain-color': catData.color }}>
                  <div className="domain-section-header">
                    <div className="domain-title-wrap">
                      <div className="domain-icon-bubble">
                        <Icon size={18} />
                      </div>
                      <h2 className="domain-title">{catData.title}</h2>
                      <span className="domain-count-badge">
                        {catData.topics.length} {catData.topics.length === 1 ? 'Topic' : 'Topics'}
                      </span>
                    </div>
                  </div>

                  <div className="domain-topics-grid">
                    {catData.topics.map(t => (
                      <TopicCard key={t.slug} topic={t} search={search} accentColor={catData.color} />
                    ))}
                  </div>
                </section>
              );
            })}
          </motion.div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════
             VIEW MODE 3: COMPACT MATRIX / TABLE VIEW
             ═══════════════════════════════════════════════════════════════════ */
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
            className="card topics-table-card"
          >
            <div className="topics-table-wrap">
              <table className="topics-table">
                <thead>
                  <tr>
                    <th scope="col">Topic</th>
                    <th scope="col">Domain</th>
                    <th scope="col" className="text-right">Problems</th>
                    <th scope="col">Difficulty Distribution</th>
                    <th scope="col" className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTopics.map(t => {
                    const slug = t.slug;
                    const Icon = TOPIC_ICONS[slug] || TOPIC_ICONS[t.name?.toLowerCase()] || Layers;
                    const catId = getTopicCategory(slug);
                    const catMeta = TOPIC_CATEGORIES.find(c => c.id === catId);

                    const easy = t.easyCount || 0;
                    const med  = t.mediumCount || 0;
                    const hard = t.hardCount || 0;
                    const total = t.problemCount || 1;

                    const easyPct = Math.round((easy / total) * 100);
                    const medPct  = Math.round((med / total) * 100);
                    const hardPct = Math.round((hard / total) * 100);

                    return (
                      <tr key={slug} className="topics-table-row">
                        <td>
                          <Link to={`/topics/${slug}`} className="table-topic-link">
                            <div className="table-topic-icon-wrap">
                              <Icon size={16} />
                            </div>
                            <span className="table-topic-name">
                              <HighlightMatch text={t.name} query={search} />
                            </span>
                          </Link>
                        </td>

                        <td>
                          <span className="table-domain-pill">
                            {catMeta?.label || 'General'}
                          </span>
                        </td>

                        <td className="text-right font-semibold">
                          {t.problemCount || 0}
                        </td>

                        <td>
                          <div className="table-difficulty-bar-wrap" title={`Easy: ${easy} • Med: ${med} • Hard: ${hard}`}>
                            <div className="diff-bar-track">
                              <span className="diff-bar-segment easy" style={{ width: `${easyPct}%` }} />
                              <span className="diff-bar-segment med"  style={{ width: `${medPct}%` }} />
                              <span className="diff-bar-segment hard" style={{ width: `${hardPct}%` }} />
                            </div>
                            <div className="diff-counts-legend">
                              <span className="legend-item text-easy">{easy}E</span>
                              <span className="legend-item text-medium">{med}M</span>
                              <span className="legend-item text-hard">{hard}H</span>
                            </div>
                          </div>
                        </td>

                        <td className="text-right">
                          <Link to={`/topics/${slug}`} className="table-action-link">
                            <span>Practice</span>
                            <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// ── Reusable Topic Card Component ─────────────────────────────────────────────
function TopicCard({ topic, search, accentColor }) {
  const slug = topic.slug;
  const name = topic.name || topic.topic;
  const count = topic.problemCount || 0;
  const Icon = TOPIC_ICONS[slug] || TOPIC_ICONS[name.toLowerCase()] || Layers;

  const easy = topic.easyCount || 0;
  const med  = topic.mediumCount || 0;
  const hard = topic.hardCount || 0;
  const total = count || 1;

  const easyPct = Math.round((easy / total) * 100);
  const medPct  = Math.round((med / total) * 100);
  const hardPct = Math.round((hard / total) * 100);

  return (
    <motion.div
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 450, damping: 25 } }}
      whileTap={{ scale: 0.98 }}
      className="topic-card-motion-wrap"
    >
      <Link
        to={`/topics/${slug}`}
        className="card modern-topic-card"
        style={{ '--topic-accent': accentColor || '#58a6ff' }}
      >
        <div className="topic-card-glow-bg" />

        {/* Cohesive Header: Icon + Title & Total Count + Action Arrow */}
        <div className="topic-card-header">
          <div className="topic-card-header-left">
            <div className="topic-icon-frame">
              <Icon size={18} />
            </div>
            <div className="topic-title-group">
              <h3 className="modern-topic-name">
                <HighlightMatch text={name} query={search} />
              </h3>
              <span className="topic-total-pill">
                {count.toLocaleString()} {count === 1 ? 'problem' : 'problems'}
              </span>
            </div>
          </div>
          <span className="topic-card-arrow">
            <ChevronRight size={15} />
          </span>
        </div>

        {/* Difficulty Distribution Section */}
        <div
          className="topic-diff-distribution"
          title={`Difficulty Breakdown: Easy ${easy.toLocaleString()} (${easyPct}%), Medium ${med.toLocaleString()} (${medPct}%), Hard ${hard.toLocaleString()} (${hardPct}%)`}
        >
          {/* Segmented Progress Track */}
          <div className="topic-diff-track">
            {easy > 0 && <span className="diff-seg easy" style={{ width: `${easyPct}%` }} />}
            {med > 0  && <span className="diff-seg med"  style={{ width: `${medPct}%` }} />}
            {hard > 0 && <span className="diff-seg hard" style={{ width: `${hardPct}%` }} />}
          </div>

          {/* Breakdown Badges with Status Indicator Dots */}
          <div className="topic-diff-chips-row">
            <div className="diff-chip easy-chip">
              <span className="diff-chip-dot easy-dot" />
              <span className="diff-chip-val">{easy.toLocaleString()}</span>
              <span className="diff-chip-lbl">Easy</span>
            </div>
            <div className="diff-chip med-chip">
              <span className="diff-chip-dot med-dot" />
              <span className="diff-chip-val">{med.toLocaleString()}</span>
              <span className="diff-chip-lbl">Med</span>
            </div>
            <div className="diff-chip hard-chip">
              <span className="diff-chip-dot hard-dot" />
              <span className="diff-chip-val">{hard.toLocaleString()}</span>
              <span className="diff-chip-lbl">Hard</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
