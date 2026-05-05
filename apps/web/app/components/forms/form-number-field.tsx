import {
  type FieldValues,
  type FieldPath,
  type Control,
} from 'react-hook-form';
import { Input } from '~/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';

interface FormNumberFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  optional?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Whether to parse the value as a float. Defaults to integer. */
  valueAs?: 'int' | 'float';
}

export function FormNumberField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  optional,
  placeholder,
  min,
  max,
  step,
  valueAs = 'int',
}: FormNumberFieldProps<TFieldValues, TName>) {
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
            <Input
              type="number"
              min={min}
              max={max}
              step={step}
              placeholder={placeholder}
              value={field.value ?? ''}
              onBlur={field.onBlur}
              onChange={(e) =>
                field.onChange(
                  e.target.value === ''
                    ? undefined
                    : valueAs === 'float'
                      ? parseFloat(e.target.value)
                      : parseInt(e.target.value, 10),
                )
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
