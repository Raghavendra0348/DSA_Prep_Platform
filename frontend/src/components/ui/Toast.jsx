import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import './Toast.css';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastContext } from '../../context/ToastContext';

let nextToastId = 0;
const MAX_TOASTS = 5;

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev =>
      prev.map(t => t.id === id ? { ...t, exiting: true } : t)
    );
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
  }, []);

  const showToast = useCallback((message, type = 'info', options = {}) => {
    // Support legacy (message, type, duration) signature
    const duration = typeof options === 'number' ? options : (options.duration ?? 3500);
    const action   = typeof options === 'object' ? options.action : undefined;

    const id = ++nextToastId;

    setToasts(prev => {
      const next = [...prev, { id, message, type, duration, action, exiting: false }];
      // Enforce max stack — dismiss oldest if over limit
      if (next.length > MAX_TOASTS) {
        const toRemove = next[0];
        setTimeout(() => dismiss(toRemove.id), 0);
      }
      return next;
    });

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  // Convenience helpers
  const toast = useMemo(() => {
    return Object.assign(
      (message, type, options) => showToast(message, type, options),
      {
        success: (msg, opts) => showToast(msg, 'success', opts),
        error:   (msg, opts) => showToast(msg, 'error',   typeof opts === 'number' ? opts : { duration: 4000, ...opts }),
        warning: (msg, opts) => showToast(msg, 'warning', opts),
        info:    (msg, opts) => showToast(msg, 'info',    opts),
      }
    );
  }, [showToast]);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ── Icons per type ─────────────────────────────────────────────────────────────
const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

// ── Container ──────────────────────────────────────────────────────────────────
function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t, i) => (
        <ToastItem
          key={t.id}
          toast={t}
          index={i}
          total={toasts.length}
          onDismiss={() => dismiss(t.id)}
        />
      ))}
    </div>
  );
}

// ── Single Toast ───────────────────────────────────────────────────────────────
function ToastItem({ toast: { message, type, duration, action, exiting }, onDismiss, index, total }) {
  const Icon = ICONS[type] || Info;
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef   = useRef(Date.now());
  const pausedAtRef = useRef(null);

  // Track elapsed for accurate progress resume after hover
  useEffect(() => {
    if (paused) {
      pausedAtRef.current = Date.now();
    } else if (pausedAtRef.current) {
      const pauseDuration = Date.now() - pausedAtRef.current;
      startRef.current += pauseDuration;
      pausedAtRef.current = null;
    }
  }, [paused]);

  const handleAction = (e) => {
    e.stopPropagation();
    action?.handler?.();
    onDismiss();
  };

  // Stack depth visual cue — older toasts slightly scaled/faded
  const depth = total - 1 - index;
  const depthScale  = 1 - depth * 0.025;
  const depthOpacity = 1 - depth * 0.08;
  const depthY = depth * 4;

  return (
    <div
      className={`toast toast-${type} ${exiting ? 'toast-exit' : ''} ${paused ? 'toast-paused' : ''}`}
      role={type === 'error' ? 'alert' : 'status'}
      style={{
        '--toast-duration': `${duration || 3500}ms`,
        '--depth-scale':   depthScale,
        '--depth-opacity': depthOpacity,
        '--depth-y':       `${depthY}px`,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Accent left bar */}
      <div className="toast-accent" aria-hidden="true" />

      {/* Icon */}
      <div className="toast-icon-wrap" aria-hidden="true">
        <Icon size={16} className="toast-icon" />
      </div>

      {/* Body */}
      <div className="toast-body">
        <span className="toast-message">{message}</span>
        {action && (
          <button className="toast-action-btn" onClick={handleAction}>
            {action.label}
          </button>
        )}
      </div>

      {/* Close */}
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss notification">
        <X size={14} />
      </button>

      {/* Progress bar */}
      {duration > 0 && (
        <div className={`toast-progress ${paused ? 'toast-progress-paused' : ''}`} aria-hidden="true" />
      )}
    </div>
  );
}
