// Booking-related constants

export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  PAYMENT_REVIEW: "payment_review",
  REJECTED: "rejected",
  FAILED: "failed",
} as const;

export const PAYMENT_TYPE = {
  FULL: "full",
  HALF: "half",
} as const;

/** Check-in time displayed to guests */
export const CHECK_IN_TIME = "3:00 PM";

/** Check-out time displayed to guests */
export const CHECK_OUT_TIME = "1:00 PM";

/** Duration of stay in hours */
export const STAY_DURATION_HOURS = 22;

/** Maximum number of pending bookings per user */
export const MAX_PENDING_BOOKINGS = 3;

/** Days before a pending booking auto-expires */
export const BOOKING_EXPIRY_DAYS = 7;

/** Default items per page for paginated tables */
export const ITEMS_PER_PAGE = 10;

/** Maximum number of confirmed bookings that can share the same check-in date */
export const MAX_CONCURRENT_BOOKINGS_PER_DAY = 2;

/** Maximum number of times a guest can resubmit a rejected review */
export const MAX_REVIEW_RESUBMISSIONS = 2;

/** Number of recent bookings shown on the admin dashboard */
export const RECENT_BOOKINGS_LIMIT = 5;

/** Prefix used when formatting booking numbers for display */
export const BOOKING_NUMBER_PREFIX = "KB-";

/** Zero-pad width for booking number IDs */
export const BOOKING_NUMBER_PAD_LENGTH = 4;
