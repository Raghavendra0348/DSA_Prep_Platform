import { Bookmark } from 'lucide-react';
import './BookmarkBtn.css';

export default function BookmarkBtn({ active, onClick, size = 18 }) {
  return (
    <button
      className={`bookmark-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      title={active ? 'Remove bookmark' : 'Bookmark this problem'}
      aria-label={active ? 'Remove bookmark' : 'Bookmark this problem'}
      aria-pressed={active}
      type="button"
    >
      <Bookmark size={size} fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
      <span className="bookmark-ripple" aria-hidden="true" />
    </button>
  );
}

