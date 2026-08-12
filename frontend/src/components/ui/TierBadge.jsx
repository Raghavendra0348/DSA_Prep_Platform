import { Trophy, Star, Rocket, Briefcase, Building2 } from 'lucide-react';
import { TIER_INFO } from '../../data/companyClassification';
import './TierBadge.css';

const TIER_ICONS = {
  1: Trophy,
  2: Star,
  3: Rocket,
  4: Briefcase,
  0: Building2,
};

export default function TierBadge({ tier, size = 'md' }) {
  const info = TIER_INFO[tier] || TIER_INFO[0];
  const Icon = TIER_ICONS[tier] || TIER_ICONS[0];
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span
      className={`tier-badge tier-badge--${size}`}
      style={{ '--tier-color': info.color }}
      title={`${info.label} — ${info.title} (${info.ctc})`}
    >
      <Icon size={iconSize} className="tier-badge-icon" />
      <span className="tier-badge-label">{info.label}</span>
    </span>
  );
}
