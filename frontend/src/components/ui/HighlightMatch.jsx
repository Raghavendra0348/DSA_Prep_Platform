import React from 'react';

/**
 * Escapes regex special characters.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * HighlightMatch component
 * Highlights characters matching the search query within the given text.
 */
function splitText(text, cleanQuery) {
  try {
    const regex = new RegExp(`(${escapeRegExp(cleanQuery)})`, 'gi');
    const parts = text.split(regex);
    return { parts, regex };
  } catch {
    return { parts: [text], regex: null };
  }
}

/**
 * HighlightMatch component
 * Highlights characters matching the search query within the given text.
 */
export default function HighlightMatch({ text = '', query = '', className = 'search-highlight' }) {
  if (!text || !query || query.trim().length < 2) {
    return <>{text}</>;
  }

  const cleanQuery = query.trim();
  const { parts, regex } = splitText(text, cleanQuery);

  if (!regex) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className={className}>
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}
