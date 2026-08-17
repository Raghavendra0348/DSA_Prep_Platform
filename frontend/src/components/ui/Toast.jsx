import { createContext, useContext, useState, useCallback, useRef } from 'react';
import './Toast.css';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts(prev =>
      prev.map(t => t.id === id ? { ...t, exiting: true } : t)
    );
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 380);
  }, []);

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  // Convenience helpers
  toast.success = (msg, dur) => toast(msg, 'success', dur);
  toast.error   = (msg, dur) => toast(msg, 'error', dur ?? 5000);
  toast.warning = (msg, dur) => toast(msg, 'warning', dur);
  toast.info    = (msg, dur) => toast(msg, 'info', dur);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
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
