import { useState, useCallback, useMemo } from 'react';
import './Toast.css';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastContext } from '../../context/ToastContext';

let nextToastId = 0;

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev =>
      prev.map(t => t.id === id ? { ...t, exiting: true } : t)
    );
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 380);
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++nextToastId;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  // Convenience helpers constructed immutably
  const toast = useMemo(() => {
    return Object.assign(
      (message, type, duration) => showToast(message, type, duration),
      {
        success: (msg, dur) => showToast(msg, 'success', dur),
        error:   (msg, dur) => showToast(msg, 'error', dur ?? 5000),
        warning: (msg, dur) => showToast(msg, 'warning', dur),
        info:    (msg, dur) => showToast(msg, 'info', dur),
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

// ── Icons per type ────────────────────────────────────────────────────────────
const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

// ── Container ─────────────────────────────────────────────────────────────────
function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

// ── Single Toast ──────────────────────────────────────────────────────────────
function ToastItem({ toast: { message, type, exiting }, onDismiss }) {
  const Icon = ICONS[type] || Info;

  return (
    <div
      className={`toast toast-${type} ${exiting ? 'toast-exit' : ''}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      <Icon size={17} className="toast-icon" aria-hidden="true" />
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss notification">
        <X size={14} />
      </button>
    </div>
  );
}
