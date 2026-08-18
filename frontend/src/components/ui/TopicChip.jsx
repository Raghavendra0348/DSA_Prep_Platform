import { Link } from 'react-router-dom';
import './TopicChip.css';

export default function TopicChip({ topic, clickable = true }) {
  const name = typeof topic === 'object' && topic !== null ? (topic.name || topic.topic || '') : String(topic || '');
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  if (clickable) {
    return (
      <Link
        to={`/topics/${slug}`}
        className="chip topic-chip"
        aria-label={`View ${name} problems`}
      >
        {name}
      </Link>
    );
  }

  return <span className="chip topic-chip topic-chip--static">{name}</span>;
}
