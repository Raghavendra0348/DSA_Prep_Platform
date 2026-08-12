import { Link } from 'react-router-dom';
import './TopicChip.css';

export default function TopicChip({ topic, clickable = true }) {
  const slug = topic.toLowerCase().replace(/\s+/g, '-');

  if (clickable) {
    return (
      <Link
        to={`/topics/${slug}`}
        className="chip topic-chip"
        aria-label={`View ${topic} problems`}
      >
        {topic}
      </Link>
    );
  }

  return <span className="chip topic-chip topic-chip--static">{topic}</span>;
}
