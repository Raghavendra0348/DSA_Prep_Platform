import './FilterBar.css';

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const SORT_OPTIONS = [
  { value: 'frequency',      label: 'Frequency' },
  { value: 'acceptanceRate', label: 'Acceptance' },
  { value: 'difficulty',     label: 'Difficulty' },
  { value: 'title',          label: 'Title' },
];

export default function FilterBar({
  difficulty = [],
  sortBy = 'frequency',
  onDifficultyChange,
  onSortChange,
}) {
  const toggleDifficulty = (diff) => {
    if (difficulty.includes(diff)) {
      onDifficultyChange(difficulty.filter(d => d !== diff));
    } else {
      onDifficultyChange([...difficulty, diff]);
    }
  };

  return (
    <div className="filter-bar">
      {/* Difficulty toggles */}
      <div className="filter-group">
        <span className="filter-label">Difficulty</span>
        <div className="filter-toggles">
          {DIFFICULTIES.map(diff => (
            <button
              key={diff}
              className={`filter-toggle filter-${diff.toLowerCase()} ${difficulty.includes(diff) ? 'active' : ''}`}
              onClick={() => toggleDifficulty(diff)}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Sort dropdown */}
      <div className="filter-group">
        <span className="filter-label">Sort by</span>
        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
