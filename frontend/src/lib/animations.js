/**
 * animations.js — Shared Framer Motion variant library
 *
 * Import what you need:
 *   import { fadeUp, staggerContainer, listItem } from '../lib/animations';
 *
 * All variants use GPU-accelerated properties only (opacity, transform, scale)
 * so they never trigger layout reflows.
 */

// ── Base Easing Curves ─────────────────────────────────────────────────────
export const EASE_OUT     = [0.16, 1, 0.3, 1];   // Fast out — snappy
export const EASE_SPRING  = { type: 'spring', stiffness: 400, damping: 30 };
export const EASE_SPRING_SOFT = { type: 'spring', stiffness: 280, damping: 28 };

// ── Fade Up (most common — page sections, cards) ───────────────────────────
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.22, ease: 'easeIn' } },
};

// ── Fade In (subtle, for overlays / badges) ────────────────────────────────
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

// ── Scale In (modals, cards popping in) ───────────────────────────────────
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.32, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// ── Slide In from Left ─────────────────────────────────────────────────────
export const slideInLeft = {
  hidden: { opacity: 0, x: -28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.38, ease: EASE_OUT },
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

// ── Slide In from Right ────────────────────────────────────────────────────
export const slideInRight = {
  hidden: { opacity: 0, x: 28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.38, ease: EASE_OUT },
  },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

// ── Slide Up from Bottom (mobile drawers, toasts) ─────────────────────────
export const slideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: EASE_SPRING_SOFT,
  },
  exit: {
    opacity: 0,
    y: 32,
    transition: { duration: 0.22, ease: 'easeIn' },
  },
};

// ── Slide Down from Top (dropdowns, command palette) ──────────────────────
export const slideDown = {
  hidden: { opacity: 0, y: -16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.97,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// ── Stagger Container (parent — controls children delay) ──────────────────
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

// ── Stagger Container (fast — for long lists) ──────────────────────────────
export const staggerContainerFast = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

// ── List Item (child of staggerContainer) ─────────────────────────────────
export const listItem = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.22 } },
};

// ── Card Item (child of staggerContainer — used for grid cards) ────────────
export const cardItem = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: EASE_OUT },
  },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.2 } },
};

// ── Modal Backdrop ────────────────────────────────────────────────────────
export const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// ── Modal Panel ───────────────────────────────────────────────────────────
export const modalPanel = {
  hidden: { opacity: 0, scale: 0.93, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.32, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 12,
    transition: { duration: 0.22, ease: 'easeIn' },
  },
};

// ── Toast notification ─────────────────────────────────────────────────────
export const toastVariant = {
  hidden: { opacity: 0, x: 60, scale: 0.92 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: EASE_SPRING_SOFT,
  },
  exit: {
    opacity: 0,
    x: 60,
    scale: 0.9,
    transition: { duration: 0.22, ease: 'easeIn' },
  },
};

// ── Page Wrapper (route-level transition) ──────────────────────────────────
export const pageTransition = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};
