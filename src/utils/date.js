import { format, isValid, formatDistanceToNow } from 'date-fns';

/**
 * Safely parse any date input into a valid Date object or null
 */
export function parseSafeDate(dateInput) {
  if (dateInput === null || dateInput === undefined || dateInput === '') {
    return null;
  }
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' 
      ? new Date(dateInput) 
      : dateInput;
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

/**
 * Safely format a date without throwing RangeError: Invalid time value
 */
export function formatSafeDate(dateInput, formatPattern = 'MMM dd, yyyy', fallback = 'N/A') {
  const parsed = parseSafeDate(dateInput);
  if (!parsed) return fallback;
  try {
    return format(parsed, formatPattern);
  } catch {
    return fallback;
  }
}

/**
 * Safely format distance to now without throwing
 */
export function formatSafeDistanceToNow(dateInput, options = {}, fallback = 'recently') {
  const parsed = parseSafeDate(dateInput);
  if (!parsed) return fallback;
  try {
    return formatDistanceToNow(parsed, options);
  } catch {
    return fallback;
  }
}
