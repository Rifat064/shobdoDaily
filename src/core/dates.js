/**
 * Date and timezone utilities.
 * Enforces 'Asia/Dhaka' timezone as per Spec D3.
 */

const DEFAULT_TZ = 'Asia/Dhaka';

export function getTodayKey(tz = DEFAULT_TZ) {
    const now = new Date();
    return toDateKey(now, tz);
}

export function toDateKey(dateObj, tz = DEFAULT_TZ) {
    // Returns YYYY-MM-DD in the specified timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(dateObj);
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    const d = parts.find(p => p.type === 'day').value;
    return `${y}-${m}-${d}`;
}

export function subtractDays(dateStr, days) {
    const d = new Date(`${dateStr}T12:00:00Z`); // use noon UTC to avoid shift
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString().split('T')[0];
}
