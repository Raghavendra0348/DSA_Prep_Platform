import { useRef, useEffect } from 'react';
import './OtpInput.css';

/**
 * 6-Digit Segmented OTP Input
 * Supports:
 * - Auto-advance to next box on digit entry
 * - Backspace auto-retreat to previous box
 * - Keyboard Arrow navigation
 * - Clipboard pasting of 6-digit codes
 * - Mobile numeric keypad support
 */
export default function OtpInput({
  value = '',
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  autoFocus = true,
}) {
  const inputRefs = useRef([]);

  // Ensure value is padded/sliced to length
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (e, index) => {
    const rawVal = e.target.value;
    // Extract only digits
    const cleaned = rawVal.replace(/\D/g, '');

    if (!cleaned) {
      // Clear current digit
      const nextDigits = [...digits];
      nextDigits[index] = '';
      const nextValue = nextDigits.join('').trimEnd();
      onChange?.(nextValue);
      return;
    }

    // Single digit input
    const char = cleaned[cleaned.length - 1]; // take the newest character
    const nextDigits = [...digits];
    nextDigits[index] = char;
    const nextValue = nextDigits.join('');

    onChange?.(nextValue);

    // Auto-advance to next box
    if (index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
      inputRefs.current[index + 1].select();
    }

    // Trigger onComplete if full code entered
    if (nextValue.length === length && !nextValue.includes('')) {
      onComplete?.(nextValue);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        // Current is already empty, jump to previous and clear it
        e.preventDefault();
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        onChange?.(nextDigits.join('').trimEnd());
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasteData) return;

    onChange?.(pasteData);

    // Focus appropriate input box after paste
    const focusIdx = Math.min(pasteData.length, length - 1);
    inputRefs.current[focusIdx]?.focus();

    if (pasteData.length === length) {
      onComplete?.(pasteData);
    }
  };

  return (
    <div className="otp-input-container" onPaste={handlePaste} role="group" aria-label="Verification code input">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          className={`otp-digit-box ${digits[i] ? 'has-value' : ''}`}
          value={digits[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${length}`}
        />
      ))}
    </div>
  );
}
