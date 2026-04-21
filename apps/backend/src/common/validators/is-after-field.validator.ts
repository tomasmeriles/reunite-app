import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DateTime } from 'luxon';

@ValidatorConstraint({ name: 'IsAfterField', async: false })
export class IsAfterFieldConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [siblingField] = args.constraints as [string];
    const sibling = (args.object as Record<string, unknown>)[siblingField];

    // Only validate when both values are strings — let @IsDateString handle format errors.
    if (typeof sibling !== 'string' || typeof value !== 'string') return true;

    const siblingDt = DateTime.fromISO(sibling);
    const valueDt = DateTime.fromISO(value);

    if (!siblingDt.isValid || !valueDt.isValid) return true;

    return valueDt > siblingDt;
  }

  defaultMessage(args: ValidationArguments): string {
    const [siblingField] = args.constraints as [string];
    return `${args.property} must be after ${siblingField}`;
  }
}
