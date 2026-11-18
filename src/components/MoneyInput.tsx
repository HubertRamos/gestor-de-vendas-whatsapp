import React from 'react';

interface MoneyInputProps {
  id?: string;
  value: string; // Numeric string with dot decimal (e.g. "12.50" or "")
  onChange: (nextNumericString: string) => void;
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function formatCentsToBrDisplay(numericStr: string): string {
  if (!numericStr) return '';
  const num = parseFloat(numericStr);
  if (Number.isNaN(num) || num === 0) return '';
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function MoneyInput({
  id,
  value,
  onChange,
  placeholder = '0,00',
  required = false,
  hasError = false,
  disabled = false,
  autoFocus = false,
  className = '',
  'aria-label': ariaLabel,
}: MoneyInputProps) {
  const displayValue = formatCentsToBrDisplay(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      onChange('');
      return;
    }
    const cents = parseInt(digits, 10);
    if (Number.isNaN(cents) || cents === 0) {
      onChange('');
      return;
    }
    onChange((cents / 100).toFixed(2));
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <span
        className="pointer-events-none absolute left-3 text-xs font-semibold text-slate-400 select-none"
        aria-hidden="true"
      >
        R$
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        className={`h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-right font-mono text-sm font-medium tabular-nums text-slate-900 transition-colors focus:outline-none ${
          hasError
            ? 'border-red-400 focus:border-red-500'
            : 'border-slate-300 focus:border-[#6D4AFF]'
        } ${disabled ? 'bg-slate-50 text-slate-400' : ''}`}
      />
    </div>
  );
}
