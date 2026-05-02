import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './input';

interface DebouncedSearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function DebouncedSearchInput({
  value: externalValue = '',
  onChange,
  placeholder = 'Search…',
  debounceMs = 300,
  className,
}: DebouncedSearchInputProps) {
  const [local, setLocal] = useState(externalValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync if parent resets the value (e.g. on filter clear)
  useEffect(() => {
    if (externalValue !== local) setLocal(externalValue);
    // Only sync downward — omit `local` from deps intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocal(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(val), debounceMs);
  };

  const handleClear = () => {
    setLocal('');
    if (timer.current) clearTimeout(timer.current);
    onChange('');
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-8 pr-8"
      />
      {local && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
