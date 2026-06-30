"use client";

import {
  TrendingUp,
  Footprints,
  PhilippinePeso,
} from "lucide-react";
import { Tables } from "@/database.types";
import { BOOKING_STATUS, PAYMENT_STATUS } from "@/app/lib/constants/booking";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type BookingRow = Tables<"bookings">;

interface BookingStatusReportProps {
  filteredBookings: BookingRow[];
  statusFilter: string;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
}

export default function BookingStatusReport({
  filteredBookings,
  statusFilter,
  isLoading,
  formatCurrency,
}: BookingStatusReportProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <PhilippinePeso className="w-5 h-5 text-success" />
          Payment Status Overview
        </h3>
        {isLoading ? (
          <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={(() => {
                  const statusBreakdown: Record<string, number> = {};

                  // When "All Status", exclude cancelled; otherwise respect the filter
                  const chartBookings = statusFilter === "all"
                    ? filteredBookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.COMPLETED)
                    : filteredBookings;
                  chartBookings.forEach((booking) => {
                    const status = booking.payment_status || "unknown";
                    const amount = booking.total_amount || 0;

                    // Group similar statuses
                    let displayStatus;
                    if (status === PAYMENT_STATUS.PAID || status === "verified") {
                      displayStatus = "Paid/Verified";
                    } else if (
                      status === PAYMENT_STATUS.PENDING ||
                      status === "partial"
                    ) {
                      displayStatus = "Pending/Partial";
                    } else {
                      displayStatus = "Other/Failed";
                    }

                    if (!statusBreakdown[displayStatus]) {
                      statusBreakdown[displayStatus] = 0;
                    }
                    statusBreakdown[displayStatus] += amount;
                  });

                  return Object.entries(statusBreakdown)
                    .map(([name, value]) => ({ name, value }))
                    .filter(
                      (item: { name: string; value: number }) =>
                        item.value > 0,
                    );
                })()}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="hsl(var(--chart-1))" />
                <Cell fill="hsl(var(--chart-2))" />
                <Cell fill="hsl(var(--muted-foreground))" />
              </Pie>
              <Tooltip
                formatter={(value) => [
                  `₱${value.toLocaleString()}`,
                  "Amount",
                ]}
              />
              <Legend wrapperStyle={{ color: "#000000" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="bg-card p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-info" />
          Payment Methods
        </h3>
        {isLoading ? (
          <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={(() => {
                const methodRevenue: Record<string, number> = {};

                // When "All Status", exclude cancelled; otherwise respect the filter
                (statusFilter === "all"
                  ? filteredBookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.COMPLETED)
                  : filteredBookings
                )
                  .filter(
                    (b) =>
                      b.payment_status === PAYMENT_STATUS.PAID ||
                      b.payment_status === "verified",
                  )
                  .forEach((booking) => {
                    const method = booking.payment_type || "cash";
                    const methodMap: Record<string, string> = {
                      stripe: "Credit Card",
                      gcash: "GCash",
                      maya: "Maya/PayMaya",
                      cash: "Cash Payment",
                      full: "Full Payment",
                      half: "Downpayment/Partial",
                      partial: "Downpayment/Partial",
                      downpayment: "Downpayment",
                      other: "Other Method",
                    };

                    const displayMethod =
                      methodMap[method] || method || "Other";
                    if (!methodRevenue[displayMethod]) {
                      methodRevenue[displayMethod] = 0;
                    }
                    methodRevenue[displayMethod] +=
                      booking.total_amount || 0;
                  });

                return Object.entries(methodRevenue)
                  .map(([method, revenue]) => ({ method, revenue }))
                  .filter(
                    (item: { method: string; revenue: number }) =>
                      item.revenue > 0,
                  )
                  .sort(
                    (
                      a: { method: string; revenue: number },
                      b: { method: string; revenue: number },
                    ) => b.revenue - a.revenue,
                  );
              })()}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="method"
                tick={{ fill: "#000000", fontSize: 12 }}
              />
              <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  color: "#000000",
                }}
                labelStyle={{ color: "#000000" }}
                formatter={(value) => [
                  `₱${value.toLocaleString()}`,
                  "Revenue",
                ]}
              />
              <Bar dataKey="revenue" fill="hsl(var(--chart-3))" name="Revenue (₱)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="bg-card p-6 rounded-xl shadow-md lg:col-span-2">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Footprints className="w-5 h-5 text-warning" />
          Walk-in vs Online Bookings
        </h3>
        {isLoading ? (
          <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        ) : (
          (() => {
            // When "All Status", exclude cancelled; otherwise respect the filter
            const activeBookings = statusFilter === "all"
              ? filteredBookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.COMPLETED)
              : filteredBookings;
            const walkIns = activeBookings.filter((b) =>
              String(b.special_requests || "").startsWith("[WALK-IN]"),
            );
            const online = activeBookings.filter(
              (b) => !String(b.special_requests || "").startsWith("[WALK-IN]"),
            );
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-warning/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-warning">
                    {walkIns.length}
                  </p>
                  <p className="text-sm text-warning">Walk-in Bookings</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-info">
                    {online.length}
                  </p>
                  <p className="text-sm text-primary">Online Bookings</p>
                </div>
                <div className="bg-warning/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-warning">
                    {formatCurrency(walkIns.reduce((sum, b) => sum + (b.total_amount || 0), 0))}
                  </p>
                  <p className="text-sm text-warning">Walk-in Revenue</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-info">
                    {formatCurrency(online.reduce((sum, b) => sum + (b.total_amount || 0), 0))}
                  </p>
                  <p className="text-sm text-primary">Online Revenue</p>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
