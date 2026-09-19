/**
 * useAnimationConfig.js
 *
 * Respects the OS-level "prefers-reduced-motion" setting.
 * When the user has enabled reduced motion, all animations are disabled
 * by returning zero-duration transitions and empty variants.
 *
 * Usage:
 *   const { variants, transition } = useAnimationConfig();
 *   <motion.div variants={variants(fadeUp)} transition={transition({ duration: 0.4 })} />
 */
import { useReducedMotion } from 'framer-motion';

export function useAnimationConfig() {
  const prefersReduced = useReducedMotion();

  return {
    /**
     * Wraps a variant object. Returns empty object if reduced motion is preferred,
     * so Framer Motion renders elements at their final state immediately.
     */
    variants: (v) => (prefersReduced ? {} : v),

    /**
     * Wraps a transition config. Returns { duration: 0 } if reduced motion is
     * preferred, making all transitions instant.
     */
    transition: (config) => (prefersReduced ? { duration: 0 } : config),

    /** Boolean — true if user prefers reduced motion */
    isReduced: prefersReduced,
  };
}
