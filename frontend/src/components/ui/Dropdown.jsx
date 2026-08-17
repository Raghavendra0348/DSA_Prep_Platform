import { useState, useRef, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import './Dropdown.css';

/**
 * Animated custom dropdown — replaces native <select> elements.
 *
 * Props:
 *   options   {Array<{value, label, icon?}>} - Option list
 *   value     {string}  - Currently selected value
 *   onChange  {Function(value)} - Change handler
 *   placeholder {string} - Placeholder text when nothing is selected
 *   disabled  {boolean}
 *   size      {'sm'|'md'} (default 'md')
 *   id        {string}  - For label association
 */
export default function Dropdown({ options = [], value, onChange, placeholder = 'Select...', disabled = false, size = 'md', id }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useClickOutside(ref, useCallback(() => setOpen(false), []));

  const selected = options.find(o => o.value === value);

  const handleSelect = (opt) => {
    onChange?.(opt.value);
    setOpen(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); }
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault();
      const idx = options.findIndex(o => o.value === value);
      const next = options[(idx + 1) % options.length];
      onChange?.(next.value);
    }
    if (e.key === 'ArrowUp' && open) {
      e.preventDefault();
      const idx = options.findIndex(o => o.value === value);
      const prev = options[(idx - 1 + options.length) % options.length];
      onChange?.(prev.value);
    }
  };

  return (
    <div
      ref={ref}
      className={`dropdown dropdown-${size} ${open ? 'dropdown-open' : ''} ${disabled ? 'dropdown-disabled' : ''}`}
    >
      {/* Trigger */}
      <button
        id={id}
        type="button"
        className="dropdown-trigger"
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
      >
        {selected?.icon && <selected.icon size={14} className="dropdown-trigger-icon" aria-hidden="true" />}
        <span className={`dropdown-trigger-label ${!selected ? 'dropdown-placeholder' : ''}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={14} className="dropdown-chevron" aria-hidden="true" />
      </button>

      {/* Options list */}
      {open && (
        <ul className="dropdown-menu" role="listbox" aria-label={placeholder}>
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={`dropdown-option ${isSelected ? 'dropdown-option-selected' : ''}`}
                onClick={() => handleSelect(opt)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSelect(opt); }}
                tabIndex={0}
              >
                {opt.icon && <opt.icon size={14} aria-hidden="true" className="dropdown-option-icon" />}
                <span>{opt.label}</span>
                {isSelected && <Check size={13} className="dropdown-check" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
