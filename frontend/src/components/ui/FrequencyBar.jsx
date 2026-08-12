import './FrequencyBar.css';

export default function FrequencyBar({ value }) {
  const clamped = Math.min(100, Math.max(0, value || 0));

  return (
    <div className="freq-bar">
      <div className="freq-bar-fill" style={{ width: `${clamped}%` }} />
      <span className="freq-bar-label">{clamped.toFixed(0)}</span>
    </div>
  );
}
