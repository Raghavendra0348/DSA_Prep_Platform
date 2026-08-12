import './DifficultyBadge.css';

export default function DifficultyBadge({ difficulty }) {
  const level = (difficulty || '').toUpperCase();
  const className = `badge badge-${level === 'EASY' ? 'easy' : level === 'MEDIUM' ? 'medium' : 'hard'}`;

  return <span className={className}>{level}</span>;
}
