import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../../database.types';
import { BOOKING_STATUS } from '../lib/constants/booking';
import {
  LOYALTY_ELITE_BOOKINGS,
  LOYALTY_ELITE_SPENT,
  LOYALTY_VIP_BOOKINGS,
  LOYALTY_VIP_SPENT,
  LOYALTY_REGULAR_BOOKINGS,
  LOYALTY_REGULAR_SPENT,
  CUSTOMER_RECENT_BOOKINGS_LIMIT,
} from '../lib/constants/loyalty';

type Booking = Database['public']['Tables']['bookings']['Row'];

export interface BookingStats {
  totalBookings: number;
  totalNights: number;
  totalSpent: number;
  completedBookings: number;
  upcomingBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  recentBookings: Booking[];
  memberSince: string;
  loyaltyStatus: 'New' | 'Regular' | 'VIP' | 'Elite';
}

export function useBookingStats(user: User | null) {
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    totalNights: 0,
    totalSpent: 0,
    completedBookings: 0,
    upcomingBookings: 0,
    cancelledBookings: 0,
    pendingBookings: 0,
    recentBookings: [],
    memberSince: '',
    loyaltyStatus: 'New'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookingStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError('Failed to load booking statistics');
        return;
      }

      const now = new Date();
      const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });

      let totalNights = 0, totalSpent = 0, completedBookings = 0,
          upcomingBookings = 0, cancelledBookings = 0, pendingBookings = 0;

      bookings?.forEach(booking => {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const status = booking.status || BOOKING_STATUS.PENDING;

        if (status === BOOKING_STATUS.CANCELLED) {
          cancelledBookings++;
        } else if (status === BOOKING_STATUS.CONFIRMED) {
          totalSpent += booking.total_amount || 0;
          if (checkOut < now) {
            completedBookings++;
            totalNights += nights;
          } else {
            upcomingBookings++;
          }
        } else {
          pendingBookings++;
        }
      });

      let loyaltyStatus: 'New' | 'Regular' | 'VIP' | 'Elite' = 'New';
      if (completedBookings >= LOYALTY_ELITE_BOOKINGS || totalSpent >= LOYALTY_ELITE_SPENT) loyaltyStatus = 'Elite';
      else if (completedBookings >= LOYALTY_VIP_BOOKINGS || totalSpent >= LOYALTY_VIP_SPENT) loyaltyStatus = 'VIP';
      else if (completedBookings >= LOYALTY_REGULAR_BOOKINGS || totalSpent >= LOYALTY_REGULAR_SPENT) loyaltyStatus = 'Regular';

      setStats({
        totalBookings: bookings?.length || 0, totalNights, totalSpent,
        completedBookings, upcomingBookings, cancelledBookings, pendingBookings,
        recentBookings: bookings?.slice(0, CUSTOMER_RECENT_BOOKINGS_LIMIT) || [], memberSince, loyaltyStatus
      });
    } catch (err) {
      console.error('Error in fetchBookingStats:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookingStats();
  }, [fetchBookingStats]);

  return { stats, loading, error, refetch: fetchBookingStats };
}