/** Format local date to YYYY-MM-DD */
export function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD to local Date; invalid or empty → today at midnight */
export function parseYYYYMMDDToDate(s: string): Date {
  const t = s.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    return new Date(y, mo, d, 0, 0, 0, 0);
  }
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return n;
}

/** HH:mm from Date (24h) */
export function formatHHmmFromDate(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Strip API time to HH:mm (handles "10:00:00", "9:30") */
export function normalizeApiTimeToHHmm(t: string | undefined, fallback: string): string {
  if (!t || !t.trim()) return fallback;
  const s = t.trim();
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?/.exec(s);
  if (!m) return fallback;
  return `${String(parseInt(m[1], 10)).padStart(2, '0')}:${m[2]}`;
}

/** Fixed calendar date with time from HH:mm string (for time picker value) */
export function dateFromHHmmString(hhmm: string): Date {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  const d = new Date(2000, 0, 1, 9, 0, 0, 0);
  if (m) {
    d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
  }
  return d;
}
