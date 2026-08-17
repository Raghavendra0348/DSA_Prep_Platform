import { useEffect, useRef } from 'react';
import './ProgressBar.css';

/**
 * Animated labeled progress bar.
 *
 * Props:
 *   label    {string}  - Left label
 *   value    {number}  - Current value
 *   max      {number}  - Maximum value
 *   color    {string}  - Bar fill color (CSS value)
 *   animated {boolean} - Animate fill on mount (default true)
 *   showCount {boolean} - Show "value/max" on right (default true)
 *   height   {number}  - Bar height in px (default 6)
 *   className {string}
 */
export default function ProgressBar({
  label,
  value = 0,
  max = 100,
  color,
  animated = true,
  showCount = true,
  height = 6,
  className = '',
}) {
  const fillRef = useRef(null);
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  useEffect(() => {
    const el = fillRef.current;
    if (!el || !animated) return;
    // Trigger CSS animation after paint
    requestAnimationFrame(() => {
      el.style.setProperty('--target-width', `${pct}%`);
      el.classList.add('progress-fill-animate');
    });
  }, [pct, animated]);

  return (
    <div className={`progress-bar-wrap ${className}`}>
      {(label || showCount) && (
        <div className="progress-bar-meta">
          {label && (
            <span className="progress-bar-label" style={{ color }}>
              {label}
            </span>
          )}
          {showCount && (
            <span className="progress-bar-count">
              {value}<span className="progress-bar-max">/{max}</span>
            </span>
          )}
        </div>
      )}
      <div
        className="progress-bar-track"
        style={{ height }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          ref={fillRef}
          className="progress-bar-fill"
          style={{
            width: animated ? '0%' : `${pct}%`,
            background: color,
            height,
          }}
        />
      </div>
    </div>
  );
}
