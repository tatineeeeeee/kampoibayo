"use client";

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { BOOKING_STATUS } from "../lib/constants/booking";

// Optimized stats interface
export interface DashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  walkInBookings: number;
  totalRevenue: number;
  confirmedRevenue: number;
  completedRevenue: number;
  averageBookingValue: number;
}

export interface ChartData {
  monthlyRevenue: Array<{
    name: string;
    revenue: number;
    bookings: number;
    confirmed: number;
    cancelled: number;
    pending: number;
    completed: number;
  }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
}

export function useAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    walkInBookings: 0,
    totalRevenue: 0,
    confirmedRevenue: 0,
    completedRevenue: 0,
    averageBookingValue: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    monthlyRevenue: [],
    statusDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isFirst = true;

    const fetchStats = async () => {
      try {
        if (isFirst) setLoading(true);
        setError(null);

        const { data: bookings, error: bookingsError } = await supabase
          .from("bookings")
          .select(
            "status, total_amount, created_at, check_in_date, special_requests",
          )
          .order("created_at", { ascending: false })
          .limit(500);

        if (bookingsError) throw bookingsError;

        if (bookings && bookings.length > 0) {
          // Single pass to count statuses and revenue
          let confirmedBookings = 0,
            pendingBookings = 0,
            cancelledBookings = 0,
            completedBookingsCount = 0,
            walkInBookingsCount = 0,
            confirmedRevenue = 0,
            completedRevenue = 0,
            totalRevenue = 0;

          for (const b of bookings) {
            const amount = b.total_amount || 0;
            switch (b.status) {
              case BOOKING_STATUS.CONFIRMED:
                confirmedBookings++;
                confirmedRevenue += amount;
                totalRevenue += amount;
                break;
              case BOOKING_STATUS.COMPLETED:
                completedBookingsCount++;
                completedRevenue += amount;
                totalRevenue += amount;
                break;
              case BOOKING_STATUS.PENDING:
                pendingBookings++;
                totalRevenue += amount;
                break;
              case BOOKING_STATUS.CANCELLED:
                cancelledBookings++;
                break;
            }
            if (String(b.special_requests || "").startsWith("[WALK-IN]")) {
              walkInBookingsCount++;
            }
          }

          const totalBookings = bookings.length;
          const averageBookingValue =
            confirmedBookings + completedBookingsCount > 0
              ? (confirmedRevenue + completedRevenue) / (confirmedBookings + completedBookingsCount)
              : 0;

          setStats({
            totalBookings,
            confirmedBookings,
            pendingBookings,
            cancelledBookings,
            completedBookings: completedBookingsCount,
            walkInBookings: walkInBookingsCount,
            totalRevenue,
            confirmedRevenue,
            completedRevenue,
            averageBookingValue,
          });

          // Generate chart data for the last 12 months
          const monthlyData = new Map<
            string,
            {
              revenue: number;
              confirmed: number;
              cancelled: number;
              pending: number;
              completed: number;
            }
          >();
          const now = new Date();

          for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
            monthlyData.set(monthKey, {
              revenue: 0,
              confirmed: 0,
              cancelled: 0,
              pending: 0,
              completed: 0,
            });
          }

          for (const booking of bookings) {
            const dateToUse = booking.created_at || booking.check_in_date;
            if (!dateToUse) continue;

            const monthKey = new Date(dateToUse).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });

            if (!monthlyData.has(monthKey)) {
              monthlyData.set(monthKey, {
                revenue: 0,
                confirmed: 0,
                cancelled: 0,
                pending: 0,
                completed: 0,
              });
            }

            const current = monthlyData.get(monthKey)!;
            if (booking.status === BOOKING_STATUS.CONFIRMED) {
              current.confirmed += 1;
              current.revenue += booking.total_amount || 0;
            } else if (booking.status === BOOKING_STATUS.CANCELLED) {
              current.cancelled += 1;
            } else if (booking.status === BOOKING_STATUS.PENDING) {
              current.pending += 1;
            } else if (booking.status === BOOKING_STATUS.COMPLETED) {
              current.completed += 1;
              current.revenue += booking.total_amount || 0;
            }
          }

          const monthlyRevenue = Array.from(monthlyData.entries()).map(
            ([name, data]) => ({
              name,
              revenue: data.revenue,
              bookings:
                data.confirmed + data.cancelled + data.pending + data.completed,
              confirmed: data.confirmed,
              cancelled: data.cancelled,
              pending: data.pending,
              completed: data.completed,
            }),
          );

          const statusDistribution = [
            { name: "Confirmed", value: confirmedBookings, color: "hsl(var(--chart-1))" },
            { name: "Pending", value: pendingBookings, color: "hsl(var(--chart-2))" },
            { name: "Cancelled", value: cancelledBookings, color: "hsl(var(--destructive))" },
            {
              name: "Completed",
              value: completedBookingsCount,
              color: "hsl(var(--chart-3))",
            },
          ].filter((item) => item.value > 0);

          setChartData({ monthlyRevenue, statusDistribution });
        } else {
          setStats({
            totalBookings: 0,
            confirmedBookings: 0,
            pendingBookings: 0,
            cancelledBookings: 0,
            completedBookings: 0,
            walkInBookings: 0,
            totalRevenue: 0,
            confirmedRevenue: 0,
            completedRevenue: 0,
            averageBookingValue: 0,
          });
          setChartData({ monthlyRevenue: [], statusDistribution: [] });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load statistics",
        );
      } finally {
        if (isFirst) {
          setLoading(false);
          isFirst = false;
        }
      }
    };

    fetchStats();

    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return {
    stats,
    chartData,
    loading,
    error,
    formatCurrency,
  };
}
