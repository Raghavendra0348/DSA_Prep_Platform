import { useState, useEffect, useRef } from 'react';

/**
 * Returns true when the referenced element enters the viewport.
 * Uses IntersectionObserver — fires once by default (unobserves after first intersection).
 *
 * @param {Object} options - IntersectionObserver options.
 * @param {boolean} once - If true (default), fires only once.
 * @returns {[React.RefObject, boolean]} [ref, isIntersecting]
 */
export function useIntersection(options = {}, once = true) {
  const ref = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        if (once) observer.unobserve(element);
      } else if (!once) {
        setIsIntersecting(false);
      }
    }, { threshold: 0.15, ...options });

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [once]); // eslint-disable-line react-hooks/exhaustive-deps

  return [ref, isIntersecting];
}
