export const PRICING = {
  WEEKDAY_RATE: 9000,
  WEEKEND_RATE: 12000,
  MAX_INCLUDED_GUESTS: 15,
  EXCESS_GUEST_FEE_PER_NIGHT: 300,
  // Sunday = 0, Friday = 5, Saturday = 6
  WEEKEND_DAYS: [0, 5, 6] as const,
} as const;
