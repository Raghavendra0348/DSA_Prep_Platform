import { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import './SearchInput.css';

export default function SearchInput({ value = '', onChange, placeholder = 'Search...', debounceMs = 300 }) {
  const [prevValue, setPrevValue] = useState(value);
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef(null);

  // Sync from parent if prop changed externally
  if (prevValue !== value) {
    setPrevValue(value);
    setLocalValue(value);
  }

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
      />
      {localValue && (
        <button className="search-input-clear" onClick={handleClear} aria-label="Clear search">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
