import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DateTime } from 'luxon';

@ValidatorConstraint({ name: 'IsAfterNow', async: false })
export class IsAfterNowConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    const dt =
      value instanceof Date
        ? DateTime.fromJSDate(value)
        : typeof value === 'string'
          ? DateTime.fromISO(value)
          : null;

    // Skip when the value is missing or invalid — let @IsDate/@IsDateString report that.
    if (!dt?.isValid) return true;

    return dt > DateTime.now();
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a future date`;
  }
}
