import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2, ArrowUpDown, ChevronDown, ChevronRight,
  Trophy, Star, Rocket, Briefcase,
  LayoutGrid, Code2, Layers,
} from 'lucide-react';
import { useCompanies } from '../hooks/useCompanies';
import { TIER_INFO, TYPE_INFO, getClassification, filterByType, groupByTier } from '../data/companyClassification';
import { getLogoUrl } from '../data/companyDomains';
import SearchInput from '../components/shared/SearchInput';
import CompanyLogo from '../components/ui/CompanyLogo';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './Companies.css';

const SORT_OPTIONS = [
  { value: 'az',        label: 'A → Z' },
  { value: 'za',        label: 'Z → A' },
  { value: 'questions', label: 'Most Questions' },
];

const TYPE_TABS = [
  { key: 'all',     label: 'All',            Icon: LayoutGrid },
  { key: 'product', label: 'Product-Based',  Icon: Code2 },
  { key: 'service', label: 'Service-Based',  Icon: Layers },
];

// Lucide icons for each tier header
const TIER_ICONS = {
  1: Trophy,
  2: Star,
  3: Rocket,
  4: Briefcase,
  0: Building2,
};

export default function Companies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort, setSort] = useState('az');
  const [collapsedTiers, setCollapsedTiers] = useState(new Set());
  const [expandedOther, setExpandedOther] = useState(false);

  const query = searchParams.get('q') || '';
  const activeType = searchParams.get('type') || 'all';

  // TanStack Query — fetch once, cached for 5 min, navigate-back is instant
  const { companies, loading, error } = useCompanies();

  // page title
  useMemo(() => { document.title = 'Companies — DSA Prep'; }, []);

  // ── URL handlers ────────────────────────────────────────────────────────
  const handleSearch = (q) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (q) { params.set('q', q); } else { params.delete('q'); }
      return params;
    }, { replace: true });
  };

  const handleTypeChange = (type) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (type === 'all') { params.delete('type'); } else { params.set('type', type); }
      return params;
    }, { replace: true });
  };

  const toggleTierCollapse = (tier) => {
    setCollapsedTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) { next.delete(tier); } else { next.add(tier); }
      return next;
    });
  };

  // ── Derived data: filter → sort → group ─────────────────────────────────
  const tierGroups = useMemo(() => {
    let list = companies;

    // Filter by type
    list = filterByType(list, activeType);

    // Search filter
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name);
      if (sort === 'za') return b.name.localeCompare(a.name);
      if (sort === 'questions') return (b.questionCount || 0) - (a.questionCount || 0);
      return 0;
    });

    // Group by tier
    return groupByTier(list);
  }, [companies, query, sort, activeType]);

  const totalFiltered = useMemo(() => {
    let count = 0;
    for (const list of tierGroups.values()) count += list.length;
    return count;
  }, [tierGroups]);

  return (
    <div className="companies-page container">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="companies-header">
        <h1>Companies</h1>
        <p className="companies-subtitle">
          Browse {companies.length} companies organized by tier
        </p>
      </div>

      {/* ── Unified Controls Bar: Type Tabs | Search + Sort ──────────────── */}
      <div className="companies-controls-bar">
        {/* Left: Company Type Filter */}
        <div className="type-toggle" role="tablist" aria-label="Company type filter">
          {TYPE_TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`type-toggle-btn ${activeType === key ? 'active' : ''}`}
              onClick={() => handleTypeChange(key)}
              role="tab"
              aria-selected={activeType === key}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Right: Search + Sort */}
        <div className="companies-search-sort">
          <SearchInput
            value={query}
            onChange={handleSearch}
            placeholder="Search companies..."
            debounceMs={150}
          />
          <div className="companies-sort">
            <ArrowUpDown size={14} />
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
        </div>
      </div>


      {/* ── Content ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="tier-sections">
          {[1, 2, 3].map(i => (
            <div key={i} className="tier-section">
              <div className="tier-section-header">
                <Skeleton width={200} height={24} />
                <Skeleton width={60} height={20} style={{ borderRadius: 999 }} />
              </div>
              <div className="companies-grid">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="card company-card-skeleton">
                    <Skeleton width="70%" height={20} />
                    <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                      <Skeleton width={50} height={22} style={{ borderRadius: 6 }} />
                      <Skeleton width={60} height={22} style={{ borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState message={`Failed to load companies: ${error}`} />
      ) : totalFiltered === 0 ? (
        <EmptyState
          message={query
            ? `No companies match "${query}"`
            : `No ${activeType === 'all' ? '' : TYPE_INFO[activeType]?.label + ' '}companies found`
          }
        />
      ) : (
        <div className="tier-sections" key={activeType}>
          {Array.from(tierGroups.entries()).map(([tier, tierCompanies]) => {
            const tierInfo = TIER_INFO[tier];
            const TierIcon = TIER_ICONS[tier] || Building2;
            const isCollapsed = collapsedTiers.has(tier);

            // "Other" tier: show 12 by default, rest on expand
            const canPartial = tier === 0 && !query && tierCompanies.length > 12;
            const isPartial = canPartial && !expandedOther;
            const displayCompanies = isCollapsed
              ? []
              : isPartial
                ? tierCompanies.slice(0, 12)
                : tierCompanies;

            return (
              <section
                key={tier}
                className={`tier-section ${isCollapsed ? 'tier-section--collapsed' : ''}`}
                style={{ '--section-tier-color': tierInfo.color }}
              >
                {/* Tier Header */}
                <button
                  className="tier-section-header"
                  onClick={() => toggleTierCollapse(tier)}
                  aria-expanded={!isCollapsed}
                >
                  <div className="tier-section-title">
                    <div className="tier-section-icon-wrap" aria-hidden="true">
                      <TierIcon size={20} />
                    </div>
                    <div>
                      <h2>{tierInfo.label} — {tierInfo.title}</h2>
                      <span className="tier-section-meta">{tierInfo.ctc} • {tierInfo.description}</span>
                    </div>
                  </div>
                  <div className="tier-section-right">
                    <span className="tier-section-count">{tierCompanies.length}</span>
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {/* Company Grid */}
                {!isCollapsed && (
                  <>
                    <div className="companies-grid">
                      {displayCompanies.map(company => {
                        const { tier: compTier } = getClassification(company.slug);
                        const compTierInfo = TIER_INFO[compTier];
                        const logoBgUrl = getLogoUrl(company.slug, 128);

                        return (
                          <Link
                            key={company.slug}
                            to={`/company/${company.slug}`}
                            className="card company-card company-card-img-bg"
                            style={{ '--card-tier-color': compTierInfo.color }}
                          >
                            {/* Full Card Image Background */}
                            <div
                              className="company-card-bg-img"
                              style={{ backgroundImage: `url(${logoBgUrl})` }}
                              aria-hidden="true"
                            />
                            {/* Dark Gradient Overlay for Text Legibility */}
                            <div className="company-card-bg-gradient" />

                            {/* Card Top Row: Logo Badge + Tier Badge */}
                            <div className="company-card-top-row">
                              <CompanyLogo slug={company.slug} name={company.name} size={36} />
                            
                            </div>

                            {/* Overlay Text Content */}
                            <div className="company-card-overlay-text">
                              <h3 className="company-card-name">{company.name}</h3>
                              <p className="company-card-count">
                                {company.questionCount} problems
                              </p>
                              {(company.topTopics || []).length > 0 && (
                                <div className="company-card-topics">
                                  {company.topTopics.slice(0, 3).map(t => (
                                    <span key={t} className="chip">{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Show more/less for "Other" tier */}
                    {canPartial && (
                      <button
                        className="tier-show-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedOther(!expandedOther);
                        }}
                      >
                        {expandedOther
                          ? 'Show fewer companies'
                          : `Show all ${tierCompanies.length} companies`
                        }
                      </button>
                    )}
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Result count */}
      {!loading && !error && (query || activeType !== 'all') && (
        <p className="companies-result-count">
          Showing {totalFiltered} of {companies.length} companies
        </p>
      )}
    </div>
  );
}
