import './StatusBadge.css';

export default function StatusBadge({ status = 'not-started', onClick }) {
  const isSolved   = status === 'solved';
  const isAttempted = status === 'attempted';

  const handleClick = (e) => {
    e.stopPropagation();
    if (!onClick) return;
    onClick(isSolved ? 'not-started' : 'solved');
  };

  return (
    <button
      className={`status-checkbox ${status} ${onClick ? 'clickable' : ''}`}
      onClick={handleClick}
      title={isSolved ? 'Completed (Click to uncheck)' : 'Mark as solved'}
      aria-label={isSolved ? 'Completed — click to unmark' : 'Mark as solved'}
      aria-pressed={isSolved}
      type="button"
    >
      <div className="checkbox-inner">
        {isSolved && (
          /* Animated checkmark SVG */
          <svg
            width="11"
            height="9"
            viewBox="0 0 11 9"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="checkbox-checkmark"
            aria-hidden="true"
          >
            <path
              d="M1 4.5L4 7.5L10 1.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="14"
              strokeDashoffset="14"
              className="checkbox-path"
            />
          </svg>
        )}
        {isAttempted && <span className="checkbox-attempted-dot" aria-hidden="true" />}
      </div>
    </button>
  );
}
