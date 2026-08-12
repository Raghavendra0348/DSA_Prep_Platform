import { Circle, CircleDot, CheckCircle2 } from 'lucide-react';
import './StatusBadge.css';

const STATUS_CONFIG = {
  'not-started': { icon: Circle,       label: 'Not Started', className: 'status-unsolved' },
  'attempted':   { icon: CircleDot,    label: 'Attempted',   className: 'status-attempted' },
  'solved':      { icon: CheckCircle2, label: 'Solved',      className: 'status-solved' },
};

const CYCLE = ['not-started', 'attempted', 'solved'];

export default function StatusBadge({ status = 'not-started', onClick }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['not-started'];
  const Icon = config.icon;

  const handleClick = () => {
    if (!onClick) return;
    const currentIdx = CYCLE.indexOf(status);
    const next = CYCLE[(currentIdx + 1) % CYCLE.length];
    onClick(next);
  };

  const nextStatus = CYCLE[(CYCLE.indexOf(status) + 1) % CYCLE.length];
  const nextLabel = STATUS_CONFIG[nextStatus]?.label || 'Not Started';

  return (
    <button
      className={`status-badge ${config.className} ${onClick ? 'clickable' : ''}`}
      onClick={handleClick}
      title={config.label}
      aria-label={onClick ? `Status: ${config.label}. Click to mark as ${nextLabel}` : `Status: ${config.label}`}
      disabled={!onClick}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
