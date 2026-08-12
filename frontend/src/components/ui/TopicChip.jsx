import { Link } from 'react-router-dom';

export default function TopicChip({ topic, clickable = true }) {
  const slug = topic.toLowerCase().replace(/\s+/g, '-');

  if (clickable) {
    return (
      <Link to={`/topics/${slug}`} className="chip">
        {topic}
      </Link>
    );
  }

  return <span className="chip">{topic}</span>;
}
