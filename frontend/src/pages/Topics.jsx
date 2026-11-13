import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpDown, BookOpen, ChevronDown, Layers, LayoutGrid, List, Map, Search, SearchX, X } from 'lucide-react';
import { useTopics } from '../hooks/useTopics';
import { LEARNING_PHASES, TOPIC_CATEGORIES, TOPIC_ICONS, getTopicCategory } from '../data/topicMetadata';
import HighlightMatch from '../components/ui/HighlightMatch';
import Skeleton from '../components/ui/Skeleton';
import './Topics.css';

const CATEGORY_FILTERS = [...TOPIC_CATEGORIES, { id: 'other', label: 'Other topics' }];

const VIEWS = [
  { id: 'phases', label: 'Learning path', Icon: Map },
  { id: 'categories', label: 'By category', Icon: LayoutGrid },
  { id: 'table', label: 'All topics', Icon: List },
];
const SORT_OPTIONS = [
  { value: 'most', label: 'Most problems' },
  { value: 'least', label: 'Fewest problems' },
  { value: 'az', label: 'Name: A–Z' },
  { value: 'za', label: 'Name: Z–A' },
];

export default function Topics() {
  const { topics, allTopics, rawCount, loading, error, search, setSearch, category, setCategory } = useTopics();
  const [sort, setSort] = useState('most');
  const [view, setView] = useState('phases');
  const [collapsed, setCollapsed] = useState(new Set());

  useEffect(() => { document.title = 'Topics & Learning Path — DSA Prep'; }, []);

  const sortedTopics = useMemo(() => [...topics].sort((a, b) => {
    const names = (a.name || a.topic || '').localeCompare(b.name || b.topic || '');
    if (sort === 'az') return names;
    if (sort === 'za') return -names;
    const difference = (a.problemCount || 0) - (b.problemCount || 0);
    return (sort === 'least' ? difference : -difference) || names;
  }), [topics, sort]);

  const phaseGroups = useMemo(() => {
    const used = new Set();
    const groups = LEARNING_PHASES.map(phase => {
      const matches = sortedTopics.filter(topic => phase.slugs.includes(topic.slug) && !used.has(topic.slug));
      matches.forEach(topic => used.add(topic.slug));
      return { ...phase, topics: matches };
    });
    const remaining = sortedTopics.filter(topic => !used.has(topic.slug));
    if (remaining.length) groups.push({ phase: 11, title: 'More to explore', subtitle: 'Specialized techniques and additional interview topics.', tier: 'Elective', topics: remaining });
    return groups.filter(group => group.topics.length);
  }, [sortedTopics]);

  const categoryGroups = useMemo(() => {
    const groups = TOPIC_CATEGORIES.filter(item => item.id !== 'all').map(item => ({ ...item, topics: sortedTopics.filter(topic => getTopicCategory(topic.slug) === item.id) }));
    const other = sortedTopics.filter(topic => getTopicCategory(topic.slug) === 'other');
    if (other.length) groups.push({ id: 'other', label: 'Other topics', topics: other });
    return groups.filter(group => group.topics.length);
  }, [sortedTopics]);

  const resetFilters = () => { setSearch(''); setCategory('all'); };
  const togglePhase = phase => setCollapsed(current => {
    const next = new Set(current);
    if (next.has(phase)) next.delete(phase); else next.add(phase);
    return next;
  });

  return (
    <div className="topics-page container">
      <header className="topics-intro">
        <div>
          <p className="topics-eyebrow">THE PRACTICE LIBRARY / TOPICS</p>
          <h1>One pattern at a time.</h1>
          <p className="topics-intro-copy">Build the fundamentals, connect the patterns, and find your next problem.</p>
          <div className="topics-library-meta"><span>{loading || error ? '—' : rawCount.toLocaleString()} topics</span><span>10 core learning stages</span></div>
        </div>
        <Link to="/topics/array" className="topics-start-card">
          <span className="topics-start-icon"><BookOpen size={19} aria-hidden="true" /></span>
          <span><span className="topics-start-kicker">NEW TO DSA?</span><strong>Start with arrays</strong><span className="topics-start-description">A good place to build your foundations.</span></span>
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </header>

      <div className="topics-workspace">
        <aside className="topics-sidebar" aria-label="Topic categories">
          <h2>Browse by category</h2>
          <div className="topics-category-list" role="group" aria-label="Filter topics by category">
            {CATEGORY_FILTERS.map(item => (
              <button key={item.id} type="button" aria-pressed={category === item.id} className={category === item.id ? 'is-selected' : ''} onClick={() => setCategory(item.id)}>
                <span>{item.label}</span><span className="topics-category-count">{loading || error ? '—' : item.id === 'all' ? rawCount : allTopics.filter(topic => getTopicCategory(topic.slug) === item.id).length}</span>
              </button>
            ))}
          </div>
          <div className="topics-sidebar-note"><Layers size={17} aria-hidden="true" /><p>Learn the approach.<br />Practice it across problems.</p><span>Follow the learning path in order, or jump into a topic you want to improve.</span></div>
        </aside>

        <div className="topics-catalog">
          <div className="topics-toolbar">
            <div className="topics-search-field">
              <Search size={17} aria-hidden="true" />
              <input type="search" aria-label="Search topics" placeholder="Find a topic, e.g. binary search" value={search} onChange={event => setSearch(event.target.value)} />
              {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear topic search"><X size={16} /></button>}
            </div>
            <label className="topics-sort-control"><ArrowUpDown size={14} aria-hidden="true" /><span className="sr-only">Sort topics</span><select aria-label="Sort topics" value={sort} onChange={event => setSort(event.target.value)}>{SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          </div>
          <div className="topics-view-bar">
            <div className="topics-view-switch" role="group" aria-label="Topic view">
              {VIEWS.map(({ id, label, Icon }) => <button key={id} type="button" aria-pressed={view === id} className={view === id ? 'is-selected' : ''} onClick={() => setView(id)}><Icon size={15} aria-hidden="true" />{label}</button>)}
            </div>
            <span className="topics-result-count" role="status">{!loading && !error && `${topics.length} ${topics.length === 1 ? 'topic' : 'topics'}${search || category !== 'all' ? ' found' : ' to explore'}`}</span>
          </div>

          {loading ? (
            <div className="topics-loading" role="status" aria-label="Loading topics">{Array.from({ length: 6 }, (_, index) => <div className="topics-loading-card" key={index}><Skeleton width={32} height={32} /><Skeleton width="75%" height={17} /><Skeleton width="100%" height={6} /></div>)}</div>
          ) : error ? (
            <div className="topics-feedback" role="alert"><BookOpen size={28} /><h2>Topics couldn’t load</h2><p>{error}</p><button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>Try again</button></div>
          ) : !topics.length ? (
            <div className="topics-feedback"><SearchX size={30} /><h2>No matching topics</h2><p>Try a different search or choose another category.</p><button type="button" className="btn btn-ghost" onClick={resetFilters}>Clear filters</button></div>
          ) : view === 'phases' ? (
            <div className="topics-learning-path">
              <div className="topics-section-caption"><span>A SUGGESTED ORDER, AT YOUR OWN PACE</span><button type="button" onClick={() => setCollapsed(collapsed.size ? new Set() : new Set(phaseGroups.map(group => group.phase)))}>{collapsed.size ? 'Expand all' : 'Collapse all'}</button></div>
              {phaseGroups.map(group => (
                <section className="topics-phase" key={group.phase} aria-labelledby={`topics-phase-title-${group.phase}`}>
                  <h2 className="topics-phase-section-title"><button className="topics-phase-toggle" type="button" aria-expanded={!collapsed.has(group.phase)} aria-controls={`topics-phase-body-${group.phase}`} onClick={() => togglePhase(group.phase)}>
                    <span className="topics-phase-number">{group.phase > 10 ? '+' : String(group.phase).padStart(2, '0')}</span>
                    <span className="topics-phase-heading"><span className="topics-phase-meta">{group.tier}{group.duration && ` · ${group.duration}`}<span> · {group.topics.length} {group.topics.length === 1 ? 'topic' : 'topics'}</span></span><span className="topics-phase-title" id={`topics-phase-title-${group.phase}`}>{group.title.replace(/^Phase \d+: /, '')}</span></span>
                    <ChevronDown size={18} className={collapsed.has(group.phase) ? '' : 'is-expanded'} aria-hidden="true" />
                  </button></h2>
                  <div id={`topics-phase-body-${group.phase}`} hidden={collapsed.has(group.phase)}>
                    <p className="topics-phase-description">{group.subtitle}</p>
                    <div className="topics-topic-list">{group.topics.map(topic => <TopicRow key={topic.slug} topic={topic} search={search} />)}</div>
                    {group.rule && <p className="topics-phase-tip"><span>Keep in mind</span>{group.rule}</p>}
                  </div>
                </section>
              ))}
            </div>
          ) : view === 'categories' ? (
            <div className="topics-domain-groups">{categoryGroups.map(group => <section key={group.id} className="topics-domain"><div className="topics-domain-heading"><h2>{group.label}</h2><span>{group.topics.length} topics</span></div><div className="topics-topic-list">{group.topics.map(topic => <TopicRow key={topic.slug} topic={topic} search={search} />)}</div></section>)}</div>
          ) : (
            <div className="topics-table-scroll" role="region" aria-label="All topics table" tabIndex={0}>
              <table className="topics-directory-table"><thead><tr><th scope="col">Topic</th><th scope="col">Category</th><th scope="col">Problems</th><th scope="col">Difficulty</th><th scope="col"><span className="sr-only">Practice</span></th></tr></thead><tbody>{sortedTopics.map(topic => <tr key={topic.slug}><td><Link to={`/topics/${topic.slug}`}><HighlightMatch text={topic.name || topic.topic} query={search} /></Link></td><td>{TOPIC_CATEGORIES.find(item => item.id === getTopicCategory(topic.slug))?.label || 'Other topics'}</td><td>{(topic.problemCount || 0).toLocaleString()}</td><td><DifficultyBreakdown topic={topic} compact /></td><td><Link to={`/topics/${topic.slug}`} aria-label={`Practice ${topic.name || topic.topic}`}><ArrowRight size={16} /></Link></td></tr>)}</tbody></table>
            </div>
          )}
          {!loading && !error && topics.length > 0 && <p className="topics-catalog-footnote">A problem can appear under more than one topic. Pick the pattern you want to practice.</p>}
        </div>
      </div>
    </div>
  );
}

function TopicRow({ topic, search }) {
  const name = topic.name || topic.topic || topic.slug;
  const Icon = TOPIC_ICONS[topic.slug] || TOPIC_ICONS[name.toLowerCase()] || Layers;
  return (
    <Link className="topics-topic-row" to={`/topics/${topic.slug}`}>
      <span className="topics-topic-icon"><Icon size={18} aria-hidden="true" /></span>
      <span className="topics-topic-identity">
        <span className="topics-topic-name"><HighlightMatch text={name} query={search} /></span>
        <span className="topics-topic-count">{(topic.problemCount || 0).toLocaleString()} problems</span>
      </span>
      <DifficultyBreakdown topic={topic} />
      <span className="topics-topic-action">Practice <ArrowRight size={15} aria-hidden="true" /></span>
    </Link>
  );
}

function DifficultyBreakdown({ topic, compact = false }) {
  return (
    <div className={`topics-difficulty-legend ${compact ? 'is-compact' : ''}`}>
      {[
        { key: 'easy', label: 'Easy', short: 'E', count: topic.easyCount || 0 },
        { key: 'medium', label: 'Medium', short: 'M', count: topic.mediumCount || 0 },
        { key: 'hard', label: 'Hard', short: 'H', count: topic.hardCount || 0 },
      ].map(item => (
        <span key={item.key} className={`topics-difficulty-item topics-difficulty-item-${item.key}`} title={item.label}>
          <span>{compact ? item.short : item.label}</span><strong>{item.count.toLocaleString()}</strong>
        </span>
      ))}
    </div>
  );
}
