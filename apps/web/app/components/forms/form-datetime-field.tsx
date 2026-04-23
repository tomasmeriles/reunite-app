import { useState } from 'react';
import { DateTime } from 'luxon';
import { CalendarIcon, X } from 'lucide-react';
import type { Matcher } from 'react-day-picker';
import {
  type FieldValues,
  type FieldPath,
  type Control,
} from 'react-hook-form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { Calendar } from '~/components/ui/calendar';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { cn } from '~/lib/utils';

// ─── PickerInput ──────────────────────────────────────────────────────────────
// Numeric-only input with clamped commit on blur.

function PickerInput({
  value,
  min,
  max,
  placeholder,
  padStart = 2,
  className,
  onCommit,
}: {
  value: number | undefined;
  min: number;
  max: number;
  placeholder: string;
  padStart?: number;
  className?: string;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);

  const display = focused
    ? draft
    : value !== undefined
      ? String(value).padStart(padStart, '0')
      : '';

  return (
    <Input
      inputMode="numeric"
      placeholder={placeholder}
      value={display}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
      onFocus={(e) => {
        setDraft(value !== undefined ? String(value) : '');
        setFocused(true);
        requestAnimationFrame(() => e.target.select());
      }}
      onBlur={() => {
        setFocused(false);
        const n = parseInt(draft, 10);
        if (!isNaN(n)) {
          onCommit(Math.min(max, Math.max(min, n)));
        }
      }}
      className={cn('text-center', className)}
    />
  );
}

// ─── Internal DateTimePicker ──────────────────────────────────────────────────

function DateTimePicker({
  value,
  onChange,
  onClear,
  disabled,
  disablePast = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear?: () => void;
  disabled?: Matcher | Matcher[];
  disablePast?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const dt = value ? DateTime.fromISO(value) : null;
  const isValid = dt?.isValid ?? false;

  const hour = isValid ? dt!.hour : undefined;
  const minute = isValid ? dt!.minute : undefined;
  const selected = isValid ? dt!.toJSDate() : undefined;

  const now = DateTime.now();
  const isToday = isValid && dt!.hasSame(now, 'day');
  const minHour = disablePast && isToday ? now.hour : 0;
  const minMinute =
    disablePast && isToday && hour === now.hour ? now.minute : 0;

  function handleDaySelect(day: Date | undefined) {
    if (!day) return;
    const dayDt = DateTime.fromJSDate(day);
    let h = hour ?? 0;
    let m = minute ?? 0;
    // If today is picked and the stored time is already past, snap to now
    if (disablePast && dayDt.hasSame(now, 'day')) {
      const candidate = dayDt.set({
        hour: h,
        minute: m,
        second: 0,
        millisecond: 0,
      });
      if (candidate < now) {
        h = now.hour;
        m = now.minute;
      }
    }
    const picked = dayDt.set({ hour: h, minute: m, second: 0, millisecond: 0 });
    onChange(
      picked.toISO({ suppressSeconds: true, includeOffset: false }) ?? '',
    );
    // Keep popover open so user can adjust time
  }

  function patchTime(fields: { hour?: number; minute?: number }) {
    if (!isValid) return;
    let next = dt!.set({ ...fields, second: 0, millisecond: 0 });
    // Clamp to now if the result would be in the past
    if (disablePast && next < now) {
      next = now.set({ second: 0, millisecond: 0 });
    }
    onChange(next.toISO({ suppressSeconds: true, includeOffset: false }) ?? '');
  }

  const display = isValid ? dt!.toFormat("MMM d, yyyy 'at' HH:mm") : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !display && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {display || <span>Pick a date &amp; time</span>}
          </span>
          {onClear && display && (
            <span
              role="button"
              aria-label="Clear date"
              className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0"
        align="start"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }
        }}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleDaySelect}
          disabled={disabled}
          autoFocus
        />

        <Separator />

        {/* Time section */}
        <div className="flex items-center justify-center gap-3 p-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Time
          </span>
          <div className="flex items-center gap-1">
            <PickerInput
              value={hour}
              min={minHour}
              max={23}
              placeholder="HH"
              className="w-12"
              onCommit={(v) => patchTime({ hour: v })}
            />
            <span className="px-0.5 font-bold text-muted-foreground">:</span>
            <PickerInput
              value={minute}
              min={minMinute}
              max={59}
              placeholder="MM"
              className="w-12"
              onCommit={(v) => patchTime({ minute: v })}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── FormDateTimeField ────────────────────────────────────────────────────────

interface FormDateTimeFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  optional?: boolean;
  disabled?: Matcher | Matcher[];
  disablePast?: boolean;
}

export function FormDateTimeField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  optional,
  disabled,
  disablePast,
}: FormDateTimeFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {optional && (
              <span className="text-[11px] font-normal text-muted-foreground/60 tracking-wide">
                optional
              </span>
            )}
          </FormLabel>
          <FormControl>
            <DateTimePicker
              value={field.value as string}
              onChange={field.onChange}
              onClear={optional ? () => field.onChange('') : undefined}
              disabled={disabled}
              disablePast={disablePast}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
