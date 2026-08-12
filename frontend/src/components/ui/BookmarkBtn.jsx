import { Star } from 'lucide-react';
import './BookmarkBtn.css';

export default function BookmarkBtn({ active, onClick }) {
  return (
    <button
      className={`bookmark-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      title={active ? 'Remove bookmark' : 'Bookmark this problem'}
      aria-label={active ? 'Remove bookmark' : 'Bookmark this problem'}
      aria-pressed={active}
    >
      <Star size={18} fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  );
}
