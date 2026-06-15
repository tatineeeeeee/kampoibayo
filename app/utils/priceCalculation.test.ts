import { describe, it, expect } from 'vitest';
import { calculateBookingPrice } from './priceCalculation';

// Reference dates (2026-06-15 = Monday, verified against the system date)
// Mon=1 Tue=2 Wed=3 Thu=4 Fri=5 Sat=6 Sun=0
const MON = '2026-06-15';
const TUE = '2026-06-16';
const WED = '2026-06-17';
const THU = '2026-06-18';
const FRI = '2026-06-19';
const SAT = '2026-06-20';
const SUN = '2026-06-21';
const MON_NEXT = '2026-06-22';

describe('calculateBookingPrice — validation', () => {
  it('rejects guest count of 0', () => {
    const result = calculateBookingPrice(MON, TUE, 0);
    expect(result.isValid).toBe(false);
    expect(result.totalAmount).toBe(0);
  });

  it('rejects guest count above MAX_GUESTS (25)', () => {
    const result = calculateBookingPrice(MON, TUE, 26);
    expect(result.isValid).toBe(false);
  });

  it('rejects non-integer guest count', () => {
    const result = calculateBookingPrice(MON, TUE, 15.5);
    expect(result.isValid).toBe(false);
  });

  it('rejects invalid date strings', () => {
    const result = calculateBookingPrice('not-a-date', TUE, 15);
    expect(result.isValid).toBe(false);
  });

  it('rejects check-out on same day as check-in', () => {
    const result = calculateBookingPrice(MON, MON, 15);
    expect(result.isValid).toBe(false);
  });

  it('rejects check-out before check-in', () => {
    const result = calculateBookingPrice(TUE, MON, 15);
    expect(result.isValid).toBe(false);
  });
});

describe('calculateBookingPrice — nightly rates', () => {
  it('charges weekday rate (₱9,000) for a Monday night', () => {
    const result = calculateBookingPrice(MON, TUE, 15);
    expect(result.isValid).toBe(true);
    expect(result.totalAmount).toBe(9000);
  });

  it('charges weekend rate (₱12,000) for a Friday night', () => {
    // Friday is treated as a weekend day (day === 5)
    const result = calculateBookingPrice(FRI, SAT, 15);
    expect(result.isValid).toBe(true);
    expect(result.totalAmount).toBe(12000);
  });

  it('charges weekend rate for a Saturday night', () => {
    const result = calculateBookingPrice(SAT, SUN, 15);
    expect(result.isValid).toBe(true);
    expect(result.totalAmount).toBe(12000);
  });

  it('charges weekend rate for a holiday that falls on a weekday (Bonifacio Day, Monday)', () => {
    // 2026-11-30 is Bonifacio Day and lands on a Monday
    const result = calculateBookingPrice('2026-11-30', '2026-12-01', 15);
    expect(result.isValid).toBe(true);
    expect(result.totalAmount).toBe(12000);
  });

  it('charges weekend rate for a peak-season weekday (summer, Wednesday)', () => {
    // 2026-04-01 is Wednesday and falls inside summer peak season (Mar 21 – May 31)
    const result = calculateBookingPrice('2026-04-01', '2026-04-02', 15);
    expect(result.isValid).toBe(true);
    expect(result.totalAmount).toBe(12000);
  });

  it('calculates a mixed Mon–Sun stay correctly', () => {
    // 6 nights: Mon–Thu = 4 × 9,000 = 36,000; Fri–Sat = 2 × 12,000 = 24,000
    const result = calculateBookingPrice(MON, SUN, 15);
    expect(result.isValid).toBe(true);
    expect(result.totalAmount).toBe(60000);
  });
});

describe('calculateBookingPrice — extra guest fees', () => {
  it('adds no extra fee when guest count equals INCLUDED_GUESTS (15)', () => {
    const result = calculateBookingPrice(MON, TUE, 15);
    expect(result.isValid).toBe(true);
    expect(result.totalAmount).toBe(9000);
  });

  it('adds ₱300/night per guest above 15', () => {
    // 1 weekday night, 20 guests (5 extra) → 9,000 + 5 × 300 = 10,500
    const result = calculateBookingPrice(MON, TUE, 20);
    expect(result.isValid).toBe(true);
    expect(result.totalAmount).toBe(10500);
  });

  it('accumulates extra guest fee across multiple nights', () => {
    // Mon–Wed (2 weekday nights), 17 guests (2 extra) → 2×9,000 + 2×2×300 = 19,200
    const result = calculateBookingPrice(MON, WED, 17);
    expect(result.isValid).toBe(true);
    expect(result.totalAmount).toBe(19200);
  });

  it('accepts exactly MAX_GUESTS (25) guests', () => {
    // 1 weekday night, 25 guests (10 extra) → 9,000 + 10×300 = 12,000
    const result = calculateBookingPrice(MON, TUE, 25);
    expect(result.isValid).toBe(true);
    expect(result.totalAmount).toBe(12000);
  });

  it('accepts exactly 1 guest', () => {
    const result = calculateBookingPrice(MON, TUE, 1);
    expect(result.isValid).toBe(true);
    expect(result.totalAmount).toBe(9000);
  });
});
