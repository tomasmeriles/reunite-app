import { DateTime, Duration } from 'luxon';

const HHMM_DURATION_REGEX = /^\d{2}:[0-5]\d$/;

export function getSystemTimezone(): string {
  return DateTime.local().zoneName ?? 'UTC';
}

export function formatDate(
  date: string | Date,
  format = 'DD',
  timezone = getSystemTimezone(),
): string {
  const dt =
    typeof date === 'string'
      ? DateTime.fromISO(date, { zone: timezone })
      : DateTime.fromJSDate(date, { zone: timezone });

  return dt.toFormat(format);
}

/*
 * Convenience wrapper for common date-time format (e.g. "Apr 20, 2024, 3:45 PM").
 */
export function formatDateTime(
  date: string | Date,
  format = 'd LLL yyyy, HH:mm',
  timezone = getSystemTimezone(),
): string {
  return formatDate(date, format, timezone);
}

export function fromNow(
  date: string | Date,
  timezone = getSystemTimezone(),
): string {
  const dt =
    typeof date === 'string'
      ? DateTime.fromISO(date, { zone: timezone })
      : DateTime.fromJSDate(date, { zone: timezone });

  return dt.toRelative() ?? '';
}

export function toLocalDateTime(isoUtc: string, tz: string): string {
  return DateTime.fromISO(isoUtc).setZone(tz).toISO({ includeOffset: false }) ?? isoUtc;
}

/**
 * Interprets a naive local ISO string (YYYY-MM-DDTHH:mm, no offset) as a
 * moment in the given timezone and returns a full UTC-offset ISO string.
 * Use when a date picker returns a timezone-unaware value that must be sent
 * to the API anchored to the event's timezone.
 */
export function localISOToEventISO(localIso: string, timezone: string): string | undefined {
  return DateTime.fromISO(localIso, { zone: timezone }).toISO() ?? undefined;
}

function parseHHMMDuration(value: string): Duration | null {
  if (!HHMM_DURATION_REGEX.test(value)) return null;

  const duration = Duration.fromISOTime(value);
  if (!duration.isValid) return null;

  const minutes = duration.minutes ?? 0;
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) return null;

  return duration;
}

export function isValidHHMMDuration(value: string): boolean {
  return parseHHMMDuration(value) !== null;
}

export function hhmmToMinutes(value: string): number {
  const duration = parseHHMMDuration(value);
  if (!duration) return NaN;

  return Math.trunc(duration.as('minutes'));
}

export function minutesToHHMM(minutes: number): string {
  const wholeMinutes = Math.max(0, Math.trunc(minutes));
  const duration = Duration.fromObject({ minutes: wholeMinutes }).shiftTo(
    'hours',
    'minutes',
  );

  return `${String(duration.hours ?? 0).padStart(2, '0')}:${String(
    Math.trunc(duration.minutes ?? 0),
  ).padStart(2, '0')}`;
}

export function formatMinutesDuration(minutes: number): string {
  const wholeMinutes = Math.max(0, Math.trunc(minutes));
  const hours = Math.floor(wholeMinutes / 60);
  const remainingMinutes = wholeMinutes % 60;

  return hours > 0
    ? `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`
    : `${remainingMinutes}m`;
}

export function formatHHMMDuration(value: string): string {
  const totalMinutes = hhmmToMinutes(value);
  return Number.isNaN(totalMinutes) ? value : formatMinutesDuration(totalMinutes);
}

export { DateTime, Duration };
