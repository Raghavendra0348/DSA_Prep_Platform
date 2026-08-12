import './StatusBadge.css';

const CYCLE = ['not-started', 'solved'];

export default function StatusBadge({ status = 'not-started', onClick }) {
  const isSolved = status === 'solved';
  const isAttempted = status === 'attempted';

  const handleClick = (e) => {
    e.stopPropagation();
    if (!onClick) return;
    const next = isSolved ? 'not-started' : 'solved';
    onClick(next);
  };

  return (
    <button
      className={`status-checkbox ${status} ${onClick ? 'clickable' : ''}`}
      onClick={handleClick}
      title={isSolved ? 'Completed (Click to uncheck)' : 'Mark as solved'}
      aria-label={isSolved ? 'Completed' : 'Mark as solved'}
      type="button"
    >
      <div className="checkbox-inner">
        {isSolved && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4.5L4 7.5L10 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {isAttempted && (
          <span className="checkbox-attempted-dot" />
        )}
      </div>
    </button>
  );
}
