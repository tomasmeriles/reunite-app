import { useMemo } from 'react';
import { DateTime } from 'luxon';
import type { Matcher } from 'react-day-picker';

/**
 * Returns `disabled` matchers for a start/end date pair so that each picker
 * automatically blocks dates that would violate the range.
 *
 * - `startDisabled`: disables days *after* the current end date (+ past days when `disablePast`)
 * - `endDisabled`:   disables days *before* the current start date (+ past days when `disablePast`)
 *
 * @param disablePast - When true, both pickers also block all past dates.
 */
export function useDateRangeDisabled(
  startDate: string | undefined,
  endDate: string | undefined,
  { disablePast = false }: { disablePast?: boolean } = {},
): {
  startDisabled: Matcher | Matcher[] | undefined;
  endDisabled: Matcher | Matcher[] | undefined;
} {
  return useMemo(() => {
    const pastMatcher: Matcher = { before: new Date() };
    const startDt = startDate ? DateTime.fromISO(startDate) : null;
    const endDt = endDate ? DateTime.fromISO(endDate) : null;

    const startMatchers: Matcher[] = [];
    if (disablePast) startMatchers.push(pastMatcher);
    if (endDt?.isValid) startMatchers.push({ after: endDt.toJSDate() });

    const endMatchers: Matcher[] = [];
    if (disablePast) endMatchers.push(pastMatcher);
    if (startDt?.isValid) endMatchers.push({ before: startDt.toJSDate() });

    return {
      startDisabled:
        startMatchers.length === 0
          ? undefined
          : startMatchers.length === 1
            ? startMatchers[0]
            : startMatchers,
      endDisabled:
        endMatchers.length === 0
          ? undefined
          : endMatchers.length === 1
            ? endMatchers[0]
            : endMatchers,
    };
  }, [startDate, endDate, disablePast]);
}
