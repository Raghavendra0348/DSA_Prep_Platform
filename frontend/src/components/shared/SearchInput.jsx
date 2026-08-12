import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import './SearchInput.css';

export default function SearchInput({ value = '', onChange, placeholder = 'Search...', debounceMs = 300, autoFocus = false }) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef(null);

  // Sync from parent
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(val);
    }, debounceMs);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="search-input-wrapper">
      <Search size={18} className="search-input-icon" />
      <input
        type="text"
        className="input search-input"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {localValue && (
        <button className="search-input-clear" onClick={handleClear}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}
