import { useCountUp } from '../../hooks/useCountUp';
import './StatCard.css';

/**
 * Animated stat display card with count-up, icon, label, and optional trend.
 *
 * Props:
 *   icon     {LucideIcon} - Icon component
 *   value    {number}     - Numeric value to animate to
 *   label    {string}     - Description label below value
 *   color    {string}     - CSS color for icon + value
 *   trend    {string}     - Optional trend text (e.g. "+8 this week")
 *   trendUp  {boolean}    - If true, trend shown in green; false = red
 *   suffix   {string}     - Optional suffix after value (e.g. '%')
 *   animate  {boolean}    - Enable count-up (default true)
 *   size     {'sm'|'md'}  - Card size preset
 */
export default function StatCard({
  icon: Icon,
  value = 0,
  label,
  color,
  trend,
  trendUp = true,
  suffix = '',
  animate = true,
  size = 'md',
}) {
  const displayValue = useCountUp(animate ? (value || 0) : 0, 900);
  const shown = animate ? displayValue : (value || 0);

  return (
    <div className={`stat-card card animate-in stat-card-${size}`}>
     
      <span className="stat-value text-code" style={{ color }}>
        {shown.toLocaleString()}{suffix}
      </span>
      {label && <span className="stat-label">{label}</span>}
      {trend && (
        <span className={`stat-trend ${trendUp ? 'stat-trend-up' : 'stat-trend-down'}`}>
          {trendUp ? '▲' : '▼'} {trend}
        </span>
      )}
    </div>
  );
}
