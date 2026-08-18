import { useEffect, useRef, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Modal.css';

/**
 * Accessible, focus-trapped, ESC-dismissible modal portal.
 *
 * Props:
 *   isOpen    {boolean}  - Controls visibility
 *   onClose   {Function} - Called when modal should close
 *   title     {string}   - Modal heading (used for aria-labelledby)
 *   children  {ReactNode}
 *   size      {'sm'|'md'|'lg'|'xl'} - Width preset (default 'md')
 *   hideClose {boolean}  - Hides the X button
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md', hideClose = false }) {
  const panelRef = useRef(null);
  const generatedId = useId();
  const titleId = `modal-title-${generatedId}`;

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Focus first focusable element on open
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const focusable = panelRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable?.length) focusable[0].focus();
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // ESC to close + focus trap
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key !== 'Tab') return;

    const focusable = [...(panelRef.current?.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) ?? [])];
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-root" role="presentation" onKeyDown={handleKeyDown}>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`modal-panel modal-panel-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="modal-header">
            {title && <h2 id={titleId} className="modal-title">{title}</h2>}
            {!hideClose && (
              <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
