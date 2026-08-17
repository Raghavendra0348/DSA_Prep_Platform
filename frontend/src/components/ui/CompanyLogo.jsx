import { useState } from 'react';
import { getCompanyDomain } from '../../data/companyDomains';
import './CompanyLogo.css';

/**
 * Renders a company logo with:
 *  - Skeleton placeholder while loading
 *  - Multi-CDN fallback chain (3 sources)
 *  - Smooth fade-in on load
 *  - Letter avatar as final fallback
 */
export default function CompanyLogo({ slug, name, size = 48 }) {
  const domain = getCompanyDomain(slug);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const logoSources = [
    `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://unavatar.io/${domain}?fallback=false`,
  ];

  const letter = (name || slug || '?').charAt(0).toUpperCase();
  const hue = name
    ? name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360
    : 200;

  const handleError = () => {
    setLoaded(false);
    setSourceIndex(prev => prev + 1);
  };

  // ── Fallback: letter avatar ───────────────────────────────────────────────
  if (sourceIndex >= logoSources.length) {
    return (
      <div
        className="company-logo company-logo--fallback"
        style={{ width: size, height: size, '--logo-hue': hue }}
        title={name}
        aria-label={`${name} logo`}
        role="img"
      >
        {letter}
      </div>
    );
  }

  return (
    <div
      className="company-logo"
      style={{ width: size, height: size }}
      title={name}
      role="img"
      aria-label={`${name} logo`}
    >
      {/* Skeleton shown until image loads */}
      {!loaded && (
        <div
          className="company-logo-skeleton skeleton"
          style={{ width: size, height: size, borderRadius: size * 0.2 }}
          aria-hidden="true"
        />
      )}
      <img
        src={logoSources[sourceIndex]}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`company-logo-img ${loaded ? 'loaded' : ''}`}
      />
    </div>
  );
}
