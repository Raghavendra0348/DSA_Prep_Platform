import './PeriodTabs.css';

const PERIODS = [
  { key: '30days',  label: '30 Days' },
  { key: '3months', label: '3 Months' },
  { key: '6months', label: '6 Months' },
  { key: '6plus',   label: '6+ Months' },
  { key: 'all',     label: 'All Time' },
];

export default function PeriodTabs({ active = 'all', onChange, stats = {} }) {
  return (
    <div className="period-tabs">
      {PERIODS.map(({ key, label }) => (
        <button
          key={key}
          className={`period-tab ${active === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
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
