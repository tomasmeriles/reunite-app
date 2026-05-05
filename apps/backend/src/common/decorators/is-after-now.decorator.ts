import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsAfterNowConstraint } from '../validators/is-after-now.validator';

/**
 * Validates that the decorated date field is strictly after the current time.
 *
 * Accepts `Date` objects and ISO 8601 strings. When the value is missing or
 * unparseable the check is skipped so that `@IsDate` / `@IsDateString` can
 * report the format error first.
 *
 * @example
 * \@IsDate()
 * \@ToDate()
 * \@IsAfterNow({ message: 'Event must start in the future' })
 * startAt!: Date;
 */
export function IsAfterNow(options?: ValidationOptions): PropertyDecorator {
  return (object, propertyName) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options,
      constraints: [],
      validator: IsAfterNowConstraint,
    });
  };
}
