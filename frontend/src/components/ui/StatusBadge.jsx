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
    const currentIndex = CYCLE.indexOf(status);
    const nextStatus = CYCLE[(currentIndex + 1) % CYCLE.length];
    onClick(nextStatus);
  };

  return (
    <button
      className={`status-badge ${config.className} ${onClick ? 'clickable' : ''}`}
      onClick={handleClick}
      title={config.label}
      disabled={!onClick}
    >
      <Icon size={18} />
    </button>
  );
}
