// Timeout and delay constants (in milliseconds)

/** Auth session fetch timeout */
export const SESSION_TIMEOUT_MS = 5000;

/** Supabase auth operation timeout */
export const AUTH_TIMEOUT_MS = 3000;

/** Logout operation timeout */
export const LOGOUT_TIMEOUT_MS = 2000;

/** Supabase realtime subscription timeout */
export const REALTIME_TIMEOUT_MS = 30000;

/** Default toast notification duration */
export const TOAST_DURATION_MS = 4000;

/** Delay between retry attempts */
export const RETRY_DELAY_MS = 1000;

/** Maintenance mode check interval */
export const MAINTENANCE_CHECK_INTERVAL_MS = 3000;

/** Session token refresh buffer (refresh 60s before expiry) */
export const SESSION_REFRESH_BUFFER_MS = 60000;

/** Maximum retry attempts for auth operations */
export const MAX_AUTH_RETRIES = 3;

/** SMS API timeout */
export const SMS_TIMEOUT_MS = 30000;

/** Admin notification bell polling interval */
export const ADMIN_NOTIFICATION_POLL_MS = 30000;

/** Delay before redirecting after successful login */
export const LOGIN_REDIRECT_DELAY_MS = 1500;

/** Delay before triggering onSignupSuccess callback */
export const SIGNUP_SUCCESS_DELAY_MS = 2000;

/** Delay to clear modal props after close animation completes */
export const MODAL_ANIMATION_CLOSE_MS = 300;
