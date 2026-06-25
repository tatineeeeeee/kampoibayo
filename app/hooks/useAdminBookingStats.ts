import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { BOOKING_STATUS, RECENT_BOOKINGS_LIMIT } from "../lib/constants/booking";

interface AdminBookingStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageBookingValue: number;
  occupancyRate: number;
  monthlyData: Array<{ month: string; bookings: number; revenue: number; cancellations: number }>;
  statusDistribution: Array<{ status: string; count: number; percentage: number }>;
  recentBookings: Array<{
    id: number;
    guest_name: string;
    check_in_date: string;
    check_out_date: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
  growthMetrics: {
    bookingsGrowth: number;
    revenueGrowth: number;
  };
}

export const useAdminBookingStats = () => {
  const [stats, setStats] = useState<AdminBookingStats>({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageBookingValue: 0,
    occupancyRate: 0,
    monthlyData: [],
    statusDistribution: [],
    recentBookings: [],
    growthMetrics: {
      bookingsGrowth: 0,
      revenueGrowth: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminBookingStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) {
        throw bookingsError;
      }

      if (!bookings) {
        setStats(prev => ({ ...prev }));
        return;
      }

      // Calculate basic stats
      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter(b => b.status === BOOKING_STATUS.CONFIRMED).length;
      const pendingBookings = bookings.filter(b => b.status === BOOKING_STATUS.PENDING).length;
      const cancelledBookings = bookings.filter(b => b.status === BOOKING_STATUS.CANCELLED).length;
      
      const totalRevenue = bookings
        .filter(b => b.status === BOOKING_STATUS.CONFIRMED)
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
      
      const averageBookingValue = confirmedBookings > 0 ? totalRevenue / confirmedBookings : 0;

      // Calculate monthly stats
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const thisMonthBookings = bookings.filter(b => {
        if (!b.created_at) return false;
        const bookingDate = new Date(b.created_at);
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      });
      
      const lastMonthBookings = bookings.filter(b => {
        if (!b.created_at) return false;
        const bookingDate = new Date(b.created_at);
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return bookingDate.getMonth() === lastMonth && bookingDate.getFullYear() === lastMonthYear;
      });

      const monthlyRevenue = thisMonthBookings
        .filter(b => b.status === BOOKING_STATUS.CONFIRMED)
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);

      // Calculate growth rates
      const thisMonthCount = thisMonthBookings.length;
      const lastMonthCount = lastMonthBookings.length;
      const bookingsGrowth = lastMonthCount > 0 ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100 : 0;
      
      const lastMonthRevenue = lastMonthBookings
        .filter(b => b.status === BOOKING_STATUS.CONFIRMED)
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const revenueGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      // Generate monthly data for charts (last 6 months)
      const monthlyData = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const monthBookings = bookings.filter(b => {
          if (!b.created_at) return false;
          const bookingDate = new Date(b.created_at);
          return bookingDate.getMonth() === month && bookingDate.getFullYear() === year;
        });
        
        const monthRevenue = monthBookings
          .filter(b => b.status === BOOKING_STATUS.CONFIRMED)
          .reduce((sum, b) => sum + (b.total_amount || 0), 0);
        
        const monthCancellations = monthBookings.filter(b => b.status === BOOKING_STATUS.CANCELLED).length;
        
        monthlyData.push({
          month: monthNames[month],
          bookings: monthBookings.length,
          revenue: monthRevenue,
          cancellations: monthCancellations
        });
      }

      // Status distribution
      const statusDistribution = [
        { status: 'Confirmed', count: confirmedBookings, percentage: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0 },
        { status: 'Pending', count: pendingBookings, percentage: totalBookings > 0 ? (pendingBookings / totalBookings) * 100 : 0 },
        { status: 'Cancelled', count: cancelledBookings, percentage: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0 }
      ];

      // Recent bookings (last 5) - filter out invalid dates
      const recentBookings = bookings
        .filter(b => {
          // Check if all required dates exist and are valid
          if (!b.created_at || !b.check_in_date || !b.check_out_date) return false;
          
          // Check if dates are actually valid dates
          const createdAt = new Date(b.created_at);
          const checkIn = new Date(b.check_in_date);
          const checkOut = new Date(b.check_out_date);
          
          return !isNaN(createdAt.getTime()) && 
                 !isNaN(checkIn.getTime()) && 
                 !isNaN(checkOut.getTime());
        })
        .slice(0, RECENT_BOOKINGS_LIMIT)
        .map(b => ({
          id: b.id,
          guest_name: b.guest_name,
          check_in_date: b.check_in_date,
          check_out_date: b.check_out_date,
          total_amount: b.total_amount || 0,
          status: b.status || 'pending',
          created_at: b.created_at!
        }));

      // Calculate occupancy rate based on actual nights booked vs available nights
      // Get confirmed bookings for current month
      const currentMonthConfirmed = thisMonthBookings.filter(b => b.status === BOOKING_STATUS.CONFIRMED);
      
      // Calculate total nights booked this month
      let totalNightsBooked = 0;
      currentMonthConfirmed.forEach(booking => {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        if (nights > 0) {
          totalNightsBooked += nights;
        }
      });
      
      // Calculate available nights in current month (assuming 1 property)
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const availableNights = daysInMonth;
      
      // Calculate occupancy rate as percentage
      const occupancyRate = availableNights > 0 ? Math.min((totalNightsBooked / availableNights) * 100, 100) : 0;

      setStats({
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        totalRevenue,
        monthlyRevenue,
        averageBookingValue,
        occupancyRate,
        monthlyData,
        statusDistribution,
        recentBookings,
        growthMetrics: {
          bookingsGrowth,
          revenueGrowth
        }
      });

    } catch (err) {
      console.error('Error fetching admin booking stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load booking statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Delayed fetch to not block initial page render
    const initialTimer = setTimeout(() => {
      fetchAdminBookingStats();
    }, 50);

    // Set up real-time subscription for bookings changes with debouncing
    let refreshTimeout: NodeJS.Timeout | null = null;
    const debouncedRefresh = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        fetchAdminBookingStats();
      }, 1000); // Debounce 1 second
    };

    const subscription = supabase
      .channel(`admin_booking_stats_changes_${Date.now()}`) // Unique channel name
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        debouncedRefresh
      )
      .subscribe();

    return () => {
      clearTimeout(initialTimer);
      if (refreshTimeout) clearTimeout(refreshTimeout);
      supabase.removeChannel(subscription);
    };
  }, []);

  return { stats, loading, error, refreshStats: fetchAdminBookingStats };
};