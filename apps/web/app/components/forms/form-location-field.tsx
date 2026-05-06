import { useEffect, useRef, useState } from 'react';
import { useController } from 'react-hook-form';
import type { Control, FieldValues, FieldPath } from 'react-hook-form';
import { MapPin, Loader2, X } from 'lucide-react';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { FormItem, FormMessage } from '~/components/ui/form';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '~/components/ui/popover';
import { cn } from '~/lib/utils';
import { getSystemTimezone } from '~/lib/datetime';
import type { UseLocationPickerReturn } from '~/hooks/use-location-picker';

interface FormLocationFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  picker: UseLocationPickerReturn;
  /** Name of the latitude field on the same form */
  latName?: FieldPath<TFieldValues>;
  /** Name of the longitude field on the same form */
  lngName?: FieldPath<TFieldValues>;
  /** Name of the timezone field on the same form */
  timezoneName?: FieldPath<TFieldValues>;
  /** Name of the address field on the same form */
  addressName?: FieldPath<TFieldValues>;
  /** Name of the city field on the same form */
  cityName?: FieldPath<TFieldValues>;
  /** Name of the state field on the same form */
  stateName?: FieldPath<TFieldValues>;
  /** Name of the country field on the same form */
  countryName?: FieldPath<TFieldValues>;
  /** Name of the placeId field on the same form */
  placeIdName?: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  optional?: boolean;
  onTimezoneResolved?: (timezone: string) => void;
}

export function FormLocationField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  picker,
  latName,
  lngName,
  timezoneName,
  addressName,
  cityName,
  stateName,
  countryName,
  placeIdName,
  label = 'Location',
  placeholder = 'Search for a venue or address…',
  optional,
  onTimezoneResolved,
}: FormLocationFieldProps<TFieldValues, TName>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const { field, fieldState } = useController({ control, name });
  const latController = latName
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useController({ control, name: latName })
    : null;
  const lngController = lngName
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useController({ control, name: lngName })
    : null;
  const timezoneController = timezoneName
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useController({ control, name: timezoneName })
    : null;
  const addressController = addressName
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useController({ control, name: addressName })
    : null;
  const cityController = cityName
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useController({ control, name: cityName })
    : null;
  const stateController = stateName
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useController({ control, name: stateName })
    : null;
  const countryController = countryName
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useController({ control, name: countryName })
    : null;
  const placeIdController = placeIdName
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useController({ control, name: placeIdName })
    : null;

  // Sync form fields when picker.selected changes
  useEffect(() => {
    const p = picker.selected;
    if (!p) return;

    field.onChange(p.shortName);
    latController?.field.onChange(p.lat);
    lngController?.field.onChange(p.lng);
    addressController?.field.onChange(p.address ?? '');
    cityController?.field.onChange(p.city ?? '');
    stateController?.field.onChange(p.state ?? '');
    countryController?.field.onChange(p.country ?? '');
    placeIdController?.field.onChange(p.placeId);

    if (timezoneController || onTimezoneResolved) {
      const params = new URLSearchParams({
        lat: String(p.lat),
        lng: String(p.lng),
      });
      fetch(
        `${import.meta.env.VITE_API_URL}/geo/timezone?${params.toString()}`,
        { credentials: 'include' },
      )
        .then((res) => (res.ok ? (res.json() as Promise<{ timezone: string | null }>) : null))
        .then((data) => {
          if (data?.timezone) {
            timezoneController?.field.onChange(data.timezone);
            onTimezoneResolved?.(data.timezone);
          }
        })
        .catch(() => {/* Timezone is optional — silently ignore */});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picker.selected]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    picker.setQuery(value);
    field.onChange(value);
    latController?.field.onChange(undefined);
    lngController?.field.onChange(undefined);
    addressController?.field.onChange('');
    cityController?.field.onChange('');
    stateController?.field.onChange('');
    countryController?.field.onChange('');
    placeIdController?.field.onChange('');
    timezoneController?.field.onChange(getSystemTimezone());
    setOpen(!!value.trim());
  };

  const handleSelect = (index: number) => {
    const p = picker.predictions[index];
    if (!p) return;
    picker.select(p);
    setOpen(false);
  };

  const handleClear = () => {
    picker.clear();
    field.onChange('');
    latController?.field.onChange(undefined);
    lngController?.field.onChange(undefined);
    addressController?.field.onChange('');
    cityController?.field.onChange('');
    stateController?.field.onChange('');
    countryController?.field.onChange('');
    placeIdController?.field.onChange('');
    timezoneController?.field.onChange(getSystemTimezone());
    setOpen(false);
    inputRef.current?.focus();
  };

  const isSearching = picker.status === 'loading';
  const hasValue = !!picker.query;
  const showDropdown = open && picker.predictions.length > 0;

  return (
    <FormItem>
      {label && (
        <Label>
          {label}
          {optional && (
            <span className="ml-1 text-xs text-muted-foreground">optional</span>
          )}
        </Label>
      )}
      <Popover open={showDropdown} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground pointer-events-none" />
            )}
            {!isSearching && optional && hasValue && (
              <span
                role="button"
                aria-label="Clear location"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground cursor-pointer"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClear();
                }}
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <Input
              ref={inputRef}
              value={picker.query}
              onChange={handleInput}
              onBlur={() => {
                field.onBlur();
                setTimeout(() => setOpen(false), 150);
              }}
              onFocus={() => {
                if (picker.predictions.length > 0) setOpen(true);
              }}
              placeholder={placeholder}
              autoComplete="off"
              className={cn(
                'pl-9 text-ellipsis',
                (isSearching || (optional && hasValue)) && 'pr-9',
                fieldState.error && 'border-destructive',
              )}
            />
          </div>
        </PopoverAnchor>

        <PopoverContent
          className="p-0 w-(--radix-popover-anchor-width)"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ul>
            {picker.predictions.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(i)}
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span>{p.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>

      {fieldState.error && (
        <FormMessage>{fieldState.error.message}</FormMessage>
      )}
    </FormItem>
  );
}
