import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, ArrowUpDown, Code2, Network, GitBranch, Terminal,
  Cpu, Hash, Database, Binary, Binary as MatrixIcon, AlignLeft,
  Share2, Zap, CircleDot, Compass, Map as MapIcon, Grid, BookOpen
} from 'lucide-react';
import { getTopics } from '../api/topics';
import SearchInput from '../components/shared/SearchInput';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './Topics.css';

// Lucide icon helper for popular DSA topics
const TOPIC_ICONS = {
  'array': Layers,
  'string': AlignLeft,
  'hash table': Hash,
  'dynamic programming': Cpu,
  'math': Terminal,
  'sorting': ArrowUpDown,
  'greedy': Zap,
  'depth-first search': Network,
  'binary search': Binary,
  'breadth-first search': Share2,
  'tree': GitBranch,
  'matrix': MatrixIcon,
  'two pointers': Code2,
  'bit manipulation': Binary,
  'stack': Database,
  'graph': Network,
  'design': Compass,
  'sliding window': CircleDot,
  'backtracking': GitBranch,
  'linked list': Code2,
};

// Rich color palette for topic icons
const TOPIC_COLORS = [
  { bg: 'rgba(88, 166, 255, 0.12)', color: '#58a6ff', border: 'rgba(88, 166, 255, 0.25)' },
  { bg: 'rgba(163, 113, 247, 0.12)', color: '#a371f7', border: 'rgba(163, 113, 247, 0.25)' },
  { bg: 'rgba(63, 185, 80, 0.12)', color: '#3fb950', border: 'rgba(63, 185, 80, 0.25)' },
  { bg: 'rgba(255, 161, 22, 0.12)', color: '#ffa116', border: 'rgba(255, 161, 22, 0.25)' },
  { bg: 'rgba(248, 81, 73, 0.12)', color: '#f85149', border: 'rgba(248, 81, 73, 0.25)' },
  { bg: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.25)' },
  { bg: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', border: 'rgba(236, 72, 153, 0.25)' },
  { bg: 'rgba(234, 179, 8, 0.12)', color: '#eab308', border: 'rgba(234, 179, 8, 0.25)' },
];

// The 10 Master Learning Phases Rule
const LEARNING_PHASES = [
  {
    phase: 1,
    title: 'Phase 1: Fundamentals & Primitives',
    subtitle: 'Build foundational logic, indexing, and basic string & mathematical operations.',
    rule: 'Rule: Master time/space complexity O(1) & O(N) before moving to pointers.',
    slugs: ['array', 'string', 'math'],
    color: '#58a6ff'
  },
  {
    phase: 2,
    title: 'Phase 2: Two Pointers & Sliding Window',
    subtitle: 'Optimize linear array searches from O(N²) down to O(N).',
    rule: 'Rule: Recognize sorted inputs and window boundaries.',
    slugs: ['two-pointers', 'sliding-window', 'prefix-sum'],
    color: '#38bdf8'
  },
  {
    phase: 3,
    title: 'Phase 3: Searching & Sorting',
    subtitle: 'Divide and conquer algorithms, binary search variants, and sorting properties.',
    rule: 'Rule: Always check if problem space is monotonic for Binary Search.',
    slugs: ['binary-search', 'sorting', 'divide-and-conquer'],
    color: '#3fb950'
  },
  {
    phase: 4,
    title: 'Phase 4: Fast Lookups & Hashing',
    subtitle: 'Leverage hash maps and sets for O(1) average lookup and frequency tracking.',
    rule: 'Rule: Trade O(N) memory space for O(1) time complexity.',
    slugs: ['hash-table', 'hashing', 'unordered-map'],
    color: '#a371f7'
  },
  {
    phase: 5,
    title: 'Phase 5: Linear Structures (LinkedList, Stack, Queue)',
    subtitle: 'Pointer-based nodes, LIFO evaluation stacks, FIFO queues, and monotonic stacks.',
    rule: 'Rule: Draw node pointer changes on paper before writing code.',
    slugs: ['linked-list', 'stack', 'queue', 'monotonic-stack'],
    color: '#ec4899'
  },
  {
    phase: 6,
    title: 'Phase 6: Recursion & Backtracking',
    subtitle: 'State space trees, combinations, permutations, and pruning paths.',
    rule: 'Rule: Identify base case, choice, and un-choice state resetting.',
    slugs: ['recursion', 'backtracking'],
    color: '#ffa116'
  },
  {
    phase: 7,
    title: 'Phase 7: Trees & Priority Queues',
    subtitle: 'Hierarchical tree traversals (DFS/BFS), BST invariants, and Min/Max Heaps.',
    rule: 'Rule: Use recursion for Trees and Heap for Top-K element tracking.',
    slugs: ['tree', 'binary-tree', 'binary-search-tree', 'heap-priority-queue', 'heap'],
    color: '#eab308'
  },
  {
    phase: 8,
    title: 'Phase 8: Greedy & Dynamic Programming',
    subtitle: 'Optimal substructure, overlapping subproblems, memoization, and Bitwise operations.',
    rule: 'Rule: Write recursive top-down DP first, then optimize to bottom-up table.',
    slugs: ['greedy', 'dynamic-programming', 'bit-manipulation'],
    color: '#f85149'
  },
  {
    phase: 9,
    title: 'Phase 9: Graphs & Network Traversal',
    subtitle: 'Adjacency representations, DFS, BFS, Disjoint Set Union (DSU), and Trie prefix trees.',
    rule: 'Rule: Detect cycles, connected components, and shortest paths.',
    slugs: ['graph', 'depth-first-search', 'breadth-first-search', 'union-find', 'trie'],
    color: '#a855f7'
  },
  {
    phase: 10,
    title: 'Phase 10: Advanced Topics & System Design',
    subtitle: '2D grid algorithms, geometry, segment trees, and system design data structures.',
    rule: 'Rule: Synthesize multiple data structures to solve complex interview problems.',
    slugs: ['matrix', 'geometry', 'design', 'segment-tree'],
    color: '#10b981'
  },
];

const SORT_OPTIONS = [
  { value: 'most', label: 'Most Problems' },
  { value: 'az',   label: 'A → Z' },
  { value: 'za',   label: 'Z → A' },
];

export default function Topics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('most');
  const [viewMode, setViewMode] = useState('phases'); // 'phases' | 'grid'
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'DSA Topics & Learning Roadmap — DSA Prep';
    async function load() {
      try {
        const data = await getTopics();
        setTopics(data.topics || data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filtered topics
  const filteredTopics = useMemo(() => {
    if (!search) return topics;
    const q = search.toLowerCase();
    return topics.filter(t => (t.name || t.topic || '').toLowerCase().includes(q));
  }, [topics, search]);

  // Group topics into the 10 Learning Phases
  const phaseGroups = useMemo(() => {
    const topicMap = new Map();
    filteredTopics.forEach(t => {
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
      return {
        ...phaseDef,
        topics: matchingTopics,
      };
    });

    // Catch any remaining topics that were not mapped into phases 1-10
    const remaining = filteredTopics.filter(t => !usedSlugs.has(t.name || t.topic));
    if (remaining.length > 0) {
      result.push({
        phase: 11,
        title: 'Elective & Specialized Topics',
        subtitle: 'Additional domain-specific and auxiliary interview topics.',
        rule: 'Explore after covering core Phase 1–10 topics.',
        slugs: [],
        color: '#64748b',
        topics: remaining,
      });
    }

    return result;
  }, [filteredTopics]);

  // Sorted list for flat grid view
  const sortedGridTopics = useMemo(() => {
    return [...filteredTopics].sort((a, b) => {
      const nameA = (a.name || a.topic || '').toLowerCase();
      const nameB = (b.name || b.topic || '').toLowerCase();
      const countA = a.problemCount || a.questionCount || 0;
      const countB = b.problemCount || b.questionCount || 0;

      if (sort === 'az')   return nameA.localeCompare(nameB);
      if (sort === 'za')   return nameB.localeCompare(nameA);
      if (sort === 'most') return countB - countA;
      return 0;
    });
  }, [filteredTopics, sort]);

  const totalProblems = useMemo(() => {
    return topics.reduce((acc, t) => acc + (t.problemCount || t.questionCount || 0), 0);
  }, [topics]);

  return (
    <div className="topics-page container">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="topics-header">
        <div className="topics-header-title-row">
          <h1>DSA Topics & Learning Roadmap</h1>
          <span className="topics-badge">10 Phases</span>
        </div>
        <p className="topics-subtitle">
          Structured 10-Phase step-by-step learning path for interview mastery ({totalProblems} questions)
        </p>
      </div>

      {/* ── Controls Bar: Search, View Mode Toggle, Sort ───────────────────── */}
      <div className="topics-controls-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search topics (e.g. Dynamic Programming, Graph)..."
          debounceMs={150}
        />

        {/* View Mode Toggle: 10 Phases vs All Grid */}
        <div className="topics-view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'phases' ? 'active' : ''}`}
            onClick={() => setViewMode('phases')}
          >
            <MapIcon size={15} />
            <span>10 Phases Roadmap</span>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid size={15} />
            <span>All Topics</span>
          </button>
        </div>

        {viewMode === 'grid' && (
          <div className="topics-sort-wrap">
            <ArrowUpDown size={14} className="sort-icon" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="filter-select"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Content Area ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="topics-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card topic-card-skeleton">
              <Skeleton width={44} height={44} style={{ borderRadius: 12 }} />
              <div style={{ flex: 1 }}>
                <Skeleton width="65%" height={18} />
                <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState message={`Failed to load topics: ${error}`} />
      ) : filteredTopics.length === 0 ? (
        <EmptyState message={`No topics match "${search}"`} />
      ) : viewMode === 'phases' ? (
        /* ── VIEW MODE: 10 PHASES ROADMAP ─────────────────────────────── */
        <div className="phases-roadmap-container">
          {phaseGroups.map((phaseGroup, phaseIdx) => {
            if (phaseGroup.topics.length === 0 && search) return null;

            return (
              <div
                key={phaseGroup.phase}
                className="phase-card"
                style={{ '--phase-color': phaseGroup.color }}
              >
                {/* Phase Header */}
                <div className="phase-header">
                  <div className="phase-number-badge">
                    <span>PHASE</span>
                    <strong>{phaseGroup.phase <= 10 ? phaseGroup.phase : '★'}</strong>
                  </div>

                  <div className="phase-header-info">
                    <h2 className="phase-title">{phaseGroup.title}</h2>
                    <p className="phase-subtitle">{phaseGroup.subtitle}</p>
                    <div className="phase-rule-tag">
                      <BookOpen size={13} />
                      <span>{phaseGroup.rule}</span>
                    </div>
                  </div>
                </div>

                {/* Phase Topic Cards */}
                <div className="phase-topics-grid">
                  {phaseGroup.topics.length > 0 ? (
                    phaseGroup.topics.map((topic, idx) => {
                      const name = topic.name || topic.topic;
                      const slug = name.toLowerCase().replace(/\s+/g, '-');
                      const count = topic.problemCount || topic.questionCount || 0;
                      const Icon = TOPIC_ICONS[slug] || TOPIC_ICONS[name.toLowerCase()] || Layers;
                      const style = TOPIC_COLORS[(phaseIdx + idx) % TOPIC_COLORS.length];

                      return (
                        <Link
                          key={name}
                          to={`/topics/${slug}`}
                          className="card topic-card phase-topic-card"
                          style={{
                            '--topic-color': phaseGroup.color || style.color,
                            '--topic-bg': style.bg,
                            '--topic-border': style.border,
                          }}
                        >
                          <div className="topic-card-icon-wrap">
                            <Icon size={20} />
                          </div>
                          <div className="topic-card-info">
                            <h3 className="topic-card-name" title={name}>{name}</h3>
                            <span className="topic-card-count">{count} problems</span>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="empty-phase-msg">
                      No topics matched in this phase for "{search}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── VIEW MODE: FLAT GRID ─────────────────────────────────────── */
        <div className="topics-grid" key={sort}>
          {sortedGridTopics.map((topic, idx) => {
            const name = topic.name || topic.topic;
            const slug = name.toLowerCase().replace(/\s+/g, '-');
            const count = topic.problemCount || topic.questionCount || 0;
            const Icon = TOPIC_ICONS[slug] || TOPIC_ICONS[name.toLowerCase()] || Layers;
            const style = TOPIC_COLORS[idx % TOPIC_COLORS.length];

            return (
              <Link
                key={name}
                to={`/topics/${slug}`}
                className="card topic-card"
                style={{
                  '--topic-color': style.color,
                  '--topic-bg': style.bg,
                  '--topic-border': style.border,
                }}
              >
                <div className="topic-card-icon-wrap">
                  <Icon size={20} />
                </div>
                <div className="topic-card-info">
                  <h3 className="topic-card-name" title={name}>{name}</h3>
                  <span className="topic-card-count">{count} problems</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
