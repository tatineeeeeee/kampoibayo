// Pricing constants for Kampo Ibayo Resort

/** Base rate per night on weekdays (Mon-Thu) in PHP */
export const BASE_RATE_WEEKDAY = 9000;

/** Base rate per night on weekends (Fri-Sun), holidays, and peak season in PHP */
export const BASE_RATE_WEEKEND = 12000;

/** Fee per excess guest per night in PHP */
export const EXTRA_GUEST_FEE = 300;

/** Number of guests included in the base rate */
export const INCLUDED_GUESTS = 15;

/** Maximum number of guests allowed per booking */
export const MAX_GUESTS = 25;

/** Multiplier used to calculate a half (down) payment amount */
export const HALF_PAYMENT_MULTIPLIER = 0.5;

/** Minimum percentage of total used to detect a half payment (inclusive) */
export const HALF_PAYMENT_MIN_PCT = 45;

/** Maximum percentage of total used to detect a half payment (inclusive) */
export const HALF_PAYMENT_MAX_PCT = 55;

/** Minimum percentage of total used to detect a full payment */
export const FULL_PAYMENT_MIN_PCT = 95;

/**
 * Peak season date ranges — ALL days (including weekdays) within these ranges
 * are charged at BASE_RATE_WEEKEND regardless of day of week.
 *
 * Philippine peak seasons:
 * - Summer / Hot Season: mid-March to May (school summer break + hottest months)
 * - Christmas Season: December 15 – January 3
 * - Holy Week: varies yearly (see PHILIPPINE_HOLIDAYS for specific dates)
 */
export const PEAK_SEASON_RANGES: { start: string; end: string; label: string }[] = [
  // Summer / Hot season (school vacation, hottest months)
  { start: "2026-03-21", end: "2026-05-31", label: "Summer Season" },
  // Christmas & New Year peak season
  { start: "2025-12-15", end: "2026-01-03", label: "Christmas Season" },
  { start: "2026-12-15", end: "2027-01-03", label: "Christmas Season" },
];

/**
 * Official Philippine public holidays for 2026.
 * Holidays always use BASE_RATE_WEEKEND even outside peak season ranges.
 * Source: Proclamation of Philippine Official Holidays
 */
export const PHILIPPINE_HOLIDAYS = [
  // 2025 trailing holidays
  "2025-12-25", // Christmas Day
  "2025-12-30", // Rizal Day
  "2025-12-31", // New Year's Eve

  // 2026 Regular Holidays
  "2026-01-01", // New Year's Day
  "2026-04-02", // Maundy Thursday (Holy Week)
  "2026-04-03", // Good Friday (Holy Week)
  "2026-04-04", // Black Saturday
  "2026-04-09", // Day of Valor (Araw ng Kagitingan)
  "2026-05-01", // Labor Day
  "2026-06-12", // Independence Day
  "2026-08-31", // National Heroes Day
  "2026-11-30", // Bonifacio Day
  "2026-12-25", // Christmas Day
  "2026-12-30", // Rizal Day

  // 2026 Special Non-Working Holidays
  "2026-01-02", // Special holiday (post New Year)
  "2026-02-14", // Valentine's Day (special non-working)
  "2026-02-25", // EDSA People Power Revolution Anniversary
  "2026-08-21", // Ninoy Aquino Day
  "2026-11-01", // All Saints' Day
  "2026-11-02", // All Souls' Day
  "2026-12-08", // Feast of the Immaculate Conception
  "2026-12-24", // Christmas Eve (special non-working)
  "2026-12-31", // Last Day of the Year
] as const;
