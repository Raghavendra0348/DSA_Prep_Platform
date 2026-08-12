import { useState } from 'react';
import { getCompanyDomain } from '../../data/companyDomains';
import './CompanyLogo.css';

/**
 * Renders a company logo with multi-stage fallback to ensure high reliability.
 */
export default function CompanyLogo({ slug, name, size = 48 }) {
  const domain = getCompanyDomain(slug);
  const [sourceIndex, setSourceIndex] = useState(0);

  // List of high-reliability logo / favicon CDN sources
  const logoSources = [
    `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://unavatar.io/${domain}?fallback=false`,
  ];

  const letter = (name || slug || '?').charAt(0).toUpperCase();

  // Generate a consistent color hue from the company name
  const hue = name
    ? name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360
    : 200;

  const handleImageError = () => {
    setSourceIndex((prev) => prev + 1);
  };

  if (sourceIndex >= logoSources.length) {
    return (
      <div
        className="company-logo company-logo--fallback"
        style={{
          width: size,
          height: size,
          '--logo-hue': hue,
        }}
        title={name}
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
    >
      <img
        src={logoSources[sourceIndex]}
        alt={`${name} logo`}
        width={size}
        height={size}
        loading="lazy"
        onError={handleImageError}
      />
    </div>
  );
}
