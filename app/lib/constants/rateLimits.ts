/** Rate limit constants for API route protection */

/** Maximum requests allowed per window for admin action routes */
export const ADMIN_RATE_LIMIT_MAX = 10;

/** Maximum requests allowed per window for user action routes */
export const USER_RATE_LIMIT_MAX = 5;

/** Rate limit sliding window duration (1 minute) */
export const RATE_LIMIT_WINDOW_MS = 60_000;
