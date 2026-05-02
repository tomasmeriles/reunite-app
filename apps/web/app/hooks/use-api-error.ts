import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '~/lib/axios';

/**
 * Returns a helper that translates API error codes to the active locale.
 * Use instead of calling getApiErrorMessage directly.
 */
export function useApiError() {
  const { t } = useTranslation();
  return (error: unknown, fallbackKey = 'errors:FALLBACK') =>
    getApiErrorMessage(error, t, fallbackKey);
}
