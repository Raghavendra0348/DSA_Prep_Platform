import { useRef, useEffect } from 'react';
import { Calendar, Filter } from 'lucide-react';
import './PeriodTabs.css';

const PERIODS = [
  { key: '30days',  label: '30 Days',   subtitle: 'Recent Activity' },
  { key: '3months', label: '3 Months',  subtitle: 'Longer Period' },
  { key: '6months', label: '6 Months',  subtitle: 'Past Half Year' },
  { key: '6plus',   label: '6+ Months', subtitle: 'Historical' },
  { key: 'all',     label: 'All Time',  subtitle: 'Complete Set' },
];

export default function PeriodTabs({
  active = '30days',
  onChange,
  stats = {},
  onToggleFilterDrawer,
  hasActiveFilters = false,
}) {
  const scrollRef = useRef(null);
  const activeTabRef = useRef(null);

  // Auto-scroll active card into view smoothly on mobile
  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [active]);

  return (
    <div className="period-cards-container">
      <div className="period-cards-wrapper">
        {/* Horizontally scrollable row of period cards */}
        <div className="period-cards-scroll" ref={scrollRef} role="tablist" aria-label="Time period filters">
          {PERIODS.map(({ key, label, subtitle }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                ref={isActive ? activeTabRef : null}
                type="button"
                className={`period-card ${isActive ? 'active' : ''}`}
                onClick={() => onChange(key)}
                aria-selected={isActive}
                role="tab"
              >
                <div className="period-card-header">
                  <Calendar size={15} className="period-card-icon" />
                  <span className="period-card-title">{label}</span>
                </div>
                <span className="period-card-sub">{subtitle}</span>
                {stats[key]?.total != null && (
                  <span className="period-card-count">{stats[key].total}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Filter toggle button */}
        {onToggleFilterDrawer && (
          <div className="period-filter-wrapper">
            <button
              type="button"
              className={`period-filter-btn ${hasActiveFilters ? 'active' : ''}`}
              onClick={onToggleFilterDrawer}
              title="Filter by difficulty & sorting"
              aria-label="Toggle difficulty and sorting filters"
            >
              <Filter size={18} />
              {hasActiveFilters && <span className="filter-active-dot" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


