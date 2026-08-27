import { Link } from 'react-router-dom';
import './TopicChip.css';

const TOPIC_CONFIG = {
  'array':                { prefix: '::', color: '#a855f7' },
  'string':               { prefix: 'Aa', color: '#22c55e' },
  'hash-table':           { prefix: '#',  color: '#eab308' },
  'hash table':           { prefix: '#',  color: '#eab308' },
  'dynamic-programming':  { prefix: '⚡', color: '#3b82f6' },
  'dynamic programming':  { prefix: '⚡', color: '#3b82f6' },
  'math':                 { prefix: '∑',  color: '#ec4899' },
  'tree':                 { prefix: '🌲', color: '#10b981' },
  'binary-tree':          { prefix: '🌲', color: '#10b981' },
  'depth-first-search':   { prefix: '↓',  color: '#6366f1' },
  'breadth-first-search': { prefix: '→',  color: '#06b6d4' },
  'binary-search':        { prefix: '⌕',  color: '#f97316' },
  'binary search':        { prefix: '⌕',  color: '#f97316' },
  'matrix':               { prefix: '▦',  color: '#8b5cf6' },
  'two-pointers':         { prefix: '⇄',  color: '#14b8a6' },
  'two pointers':         { prefix: '⇄',  color: '#14b8a6' },
  'stack':                { prefix: '▤',  color: '#f43f5e' },
  'heap-priority-queue':  { prefix: '▲',  color: '#e11d48' },
  'graph':                { prefix: '☍',  color: '#8b5cf6' },
  'greedy':               { prefix: '★',  color: '#eab308' },
  'sliding-window':       { prefix: '◫',  color: '#0ea5e9' },
  'sliding window':       { prefix: '◫',  color: '#0ea5e9' },
  'backtracking':         { prefix: '↺',  color: '#d946ef' },
  'bit-manipulation':     { prefix: '01', color: '#64748b' },
};

export default function TopicChip({ topic, clickable = true, showIcon = true }) {
  const name = typeof topic === 'object' && topic !== null ? (topic.name || topic.topic || '') : String(topic || '');
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const config = TOPIC_CONFIG[name.toLowerCase()] || TOPIC_CONFIG[slug];

  const content = (
    <>
      {showIcon && config && (
        <span className="topic-chip-icon" style={{ color: config.color }}>
          {config.prefix}
        </span>
      )}
      <span className="topic-chip-text">{name}</span>
    </>
  );

  if (clickable) {
    return (
      <Link
        to={`/topics/${slug}`}
        className="chip topic-chip"
        aria-label={`View ${name} problems`}
      >
        {content}
      </Link>
    );
  }

  return <span className="chip topic-chip topic-chip--static">{content}</span>;
}

