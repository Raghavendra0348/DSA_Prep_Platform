import { useRef, useState, useEffect, useCallback } from 'react';
import './PeriodTabs.css';

const PERIODS = [
  { key: '30days',  label: '30 Days' },
  { key: '3months', label: '3 Months' },
  { key: '6months', label: '6 Months' },
  { key: '6plus',   label: '6+ Months' },
  { key: 'all',     label: 'All Time' },
];

export default function PeriodTabs({ active = 'all', onChange, stats = {} }) {
  const containerRef = useRef(null);
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const activeEl = tabRefs.current[active];
    const container = containerRef.current;
    if (activeEl && container) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeEl.getBoundingClientRect();
      setIndicator({
        left: tabRect.left - containerRect.left + container.scrollLeft,
        width: tabRect.width,
      });
    }
  }, [active]);

  useEffect(() => {
    updateIndicator();
    const activeEl = tabRefs.current[active];
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [active, updateIndicator]);

  // Recalculate on window resize or scroll
  useEffect(() => {
    const container = containerRef.current;
    window.addEventListener('resize', updateIndicator);
    if (container) {
      container.addEventListener('scroll', updateIndicator);
    }
    return () => {
      window.removeEventListener('resize', updateIndicator);
      if (container) {
        container.removeEventListener('scroll', updateIndicator);
      }
    };
  }, [updateIndicator]);

  return (
    <div className="period-tabs" role="tablist" aria-label="Time period filter" ref={containerRef}>
      {/* Sliding indicator */}
      <div
        className="period-tabs-indicator"
        style={{ left: indicator.left, width: indicator.width }}
      />

      {PERIODS.map(({ key, label }) => (
        <button
          key={key}
          ref={(el) => { tabRefs.current[key] = el; }}
          className={`period-tab ${active === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
          role="tab"
          aria-selected={active === key}
          aria-label={`${label}${stats[key]?.total != null ? ` — ${stats[key].total} problems` : ''}`}
        >
          {label}
          {stats[key] != null && (
            <span className="period-tab-count">{stats[key].total}</span>
          )}
        </button>
      ))}
    </div>
  );
}
