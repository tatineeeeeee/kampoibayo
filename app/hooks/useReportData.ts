"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/app/supabaseClient";
import { Tables } from "@/database.types";
import { useToast } from "@/app/components/Toast";
import { Clock, Users, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CHECK_IN_TIME, CHECK_OUT_TIME } from "@/lib/constants/booking";

type BookingRow = Tables<"bookings">;

export interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const REPORT_TYPES: ReportType[] = [
  {
    id: "daily-operations",
    name: "Daily Operations",
    description:
      "Today's check-ins, check-outs & current guests (staff planning)",
    icon: Clock,
    color: "blue",
  },
  {
    id: "user-database",
    name: "User Report",
    description:
      "Customer list with contact info, visits & spending (for marketing)",
    icon: Users,
    color: "purple",
  },
  {
    id: "booking-status",
    name: "Booking Status Report",
    description:
      "All bookings by status - Paid, Pending, Cancelled (financial tracking)",
    icon: FileText,
    color: "green",
  },
];

export type UserRecord = {
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string | null;
  role: string | null;
};

interface UseReportDataOptions {
  statusFilter: string;
  paymentStatusFilter: string;
  paymentMethodFilter: string;
  setCustomerPage: (page: number) => void;
}

export function useReportData({
  statusFilter,
  paymentStatusFilter,
  paymentMethodFilter,
  setCustomerPage,
}: UseReportDataOptions) {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedReport, setSelectedReport] = useState<ReportType>(REPORT_TYPES[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("bookings").select("*");

      if (selectedReport.id === "daily-operations") {
        // Fetch all bookings overlapping the selected date (arrivals + departures + staying)
        query = query
          .lte("check_in_date", startDate)
          .gte("check_out_date", startDate)
          .order("check_in_date", { ascending: false });
      } else if (selectedReport.id === "user-database") {
        // Fetch ALL bookings — customer database is not date-scoped
        query = query.order("created_at", { ascending: false });
      } else {
        // Booking Status: filter by check_in_date range + status/payment filters
        query = query
          .gte("check_in_date", startDate)
          .lte("check_in_date", endDate)
          .order("check_in_date", { ascending: false });

        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }
        if (paymentStatusFilter !== "all") {
          query = query.eq("payment_status", paymentStatusFilter);
        }
        if (paymentMethodFilter !== "all") {
          query = query.eq("payment_type", paymentMethodFilter);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      setBookings(data || []);

      // For User Report, also fetch all registered users
      if (selectedReport.id === "user-database") {
        const { data: usersData } = await supabase
          .from("users")
          .select("email, full_name, phone, created_at, role")
          .order("created_at", { ascending: false });
        setAllUsers(usersData || []);
        setCustomerPage(1);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedReport,
    startDate,
    endDate,
    statusFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    setCustomerPage,
  ]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Filtered bookings for charts (respects date filters)
  const filteredBookings = bookings.filter((booking) => {
    // User Report shows all-time data — skip date/status filtering
    if (selectedReport.id === "user-database") return true;

    const checkInDate = booking.check_in_date;
    const isInDateRange = checkInDate >= startDate && checkInDate <= endDate;
    const matchesStatus =
      statusFilter === "all" || booking.status === statusFilter;
    const matchesPaymentStatus =
      paymentStatusFilter === "all" ||
      booking.payment_status === paymentStatusFilter;
    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      booking.payment_type === paymentMethodFilter;

    return (
      isInDateRange &&
      matchesStatus &&
      matchesPaymentStatus &&
      matchesPaymentMethod
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const confirmedBookings = filteredBookings.filter(
    (b) => b.status === "confirmed",
  );
  const totalRevenue = confirmedBookings.reduce(
    (sum, b) => sum + b.total_amount,
    0,
  );

  const exportReport = async () => {
    setIsExporting(true);
    try {
      if (filteredBookings.length === 0) {
        showToast({
          type: "warning",
          title: "No Data to Export",
          message:
            "Please adjust your date range or filters to include bookings.",
        });
        return;
      }

      // Add small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      let headers: string[] = [];
      let rows: string[][] = [];
      let filename = "";

      switch (selectedReport.id) {
        case "daily-operations":
          // Daily operational checklist - current and upcoming activities
          const today = new Date().toISOString().split("T")[0];
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

          // Include today's activities plus current guests and near-future arrivals
          const operationalActivity = filteredBookings.filter((b) => {
            const checkIn = b.check_in_date;
            const checkOut = b.check_out_date;

            // REAL RESORT LOGIC: Current guests must be confirmed AND paid
            const isCurrentGuest =
              checkIn <= today &&
              checkOut > today &&
              b.status === "confirmed" &&
              (b.payment_status === "paid" || b.payment_status === "confirmed");

            // For operational planning, show confirmed + pending (but mark pending clearly)
            const isTodayCheckIn = checkIn === today;
            const isTodayCheckOut = checkOut === today;
            const isTomorrowCheckIn = checkIn === tomorrow;
            const isRecentCheckOut =
              checkOut === yesterday && b.status === "confirmed";

            const isOperationallyRelevant =
              isTodayCheckIn ||
              isTodayCheckOut ||
              isTomorrowCheckIn ||
              isCurrentGuest ||
              isRecentCheckOut;

            return isOperationallyRelevant;
          });

          if (operationalActivity.length === 0) {
            const nextBooking = filteredBookings.find(
              (b) => b.check_in_date > today,
            );
            const daysUntilNext = nextBooking
              ? Math.ceil(
                  (new Date(nextBooking.check_in_date).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                )
              : 0;

            showToast({
              type: "info",
              title: `\u{1F4CB} Quiet Day - No Activities for ${today}`,
              message: nextBooking
                ? `Your next booking "${nextBooking.guest_name}" checks in on ${nextBooking.check_in_date} (${daysUntilNext} days from now). Use "Booking Schedule" to see future bookings.`
                : 'No upcoming bookings found. Use "Booking Schedule" report to see all future reservations.',
              duration: 6000,
            });
            return;
          }

          headers = [
            "Date",
            "Time",
            "Guest Name",
            "Phone",
            "Email",
            "Action Required",
            "Status",
            "Payment Status",
            "Amount",
            "Guests",
            "Special Requests",
            "Pet",
            "Booking ID",
            "Priority",
            "Booking Type",
          ];
          rows = operationalActivity
            .map((booking) => {
              let actionDate, actionTime, action, priority;
              const isConfirmed = booking.status === "confirmed";
              const isPending = booking.status === "pending";

              if (booking.check_in_date === today) {
                actionDate = today;
                actionTime = CHECK_IN_TIME;
                if (isConfirmed) {
                  action = "\u{1F3E8} GUEST ARRIVAL - Welcome & Check-in";
                  priority = "HIGH";
                } else if (isPending) {
                  action = "\u26A0\uFE0F PENDING ARRIVAL - Confirm Status";
                  priority = "HIGH";
                } else {
                  action = "\u2753 UNCERTAIN ARRIVAL - Check Status";
                  priority = "MEDIUM";
                }
              } else if (booking.check_out_date === today) {
                actionDate = today;
                actionTime = CHECK_OUT_TIME;
                if (isConfirmed) {
                  action = "\u{1F44B} GUEST DEPARTURE - Check-out & Farewell";
                  priority = "HIGH";
                } else {
                  action = "\u2753 UNCLEAR DEPARTURE - Verify Status";
                  priority = "MEDIUM";
                }
              } else if (booking.check_in_date === tomorrow) {
                actionDate = tomorrow;
                actionTime = CHECK_IN_TIME;
                if (isConfirmed) {
                  action = "\u{1F4CB} CONFIRMED ARRIVAL Tomorrow - Prepare Resort";
                  priority = "MEDIUM";
                } else if (isPending) {
                  action = "\u{1F570}\uFE0F PENDING ARRIVAL Tomorrow - Await Confirmation";
                  priority = "LOW";
                } else {
                  action = "\u2753 UNCERTAIN BOOKING Tomorrow - Check Status";
                  priority = "LOW";
                }
              } else if (
                booking.check_in_date <= today &&
                booking.check_out_date > today
              ) {
                actionDate = "Current";
                actionTime = "Ongoing";

                // REAL RESORT VALIDATION
                if (
                  isConfirmed &&
                  (booking.payment_status === "paid" ||
                    booking.payment_status === "confirmed")
                ) {
                  action = "\u{1F3D6}\uFE0F CURRENT GUEST - Monitor & Assist";
                  priority = "LOW";
                } else if (isConfirmed && booking.payment_status !== "paid") {
                  action = "\u26A0\uFE0F CURRENT GUEST - PAYMENT ISSUE! Collect payment";
                  priority = "HIGH";
                } else if (isPending) {
                  action =
                    "\u{1F6A8} IMPOSSIBLE! Pending guest cannot be current - Fix booking status";
                  priority = "HIGH";
                } else {
                  action =
                    "\u{1F6A8} STATUS ERROR - Guest at resort but booking unclear";
                  priority = "HIGH";
                }
              } else if (booking.check_out_date === yesterday && isConfirmed) {
                actionDate = yesterday;
                actionTime = CHECK_OUT_TIME;
                action = "\u2705 RECENT DEPARTURE - Follow-up & Review";
                priority = "LOW";
              } else {
                actionDate = booking.check_in_date || booking.check_out_date;
                actionTime = "TBD";
                action = `\u{1F4C5} ${
                  booking.status?.toUpperCase() || "UNKNOWN"
                } BOOKING - Monitor`;
                priority = "LOW";
              }

              return [
                actionDate,
                actionTime,
                booking.guest_name,
                booking.guest_phone
                  ? String(booking.guest_phone)
                      .replace(/e\+/gi, "")
                      .replace(/^(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3")
                  : "No phone",
                booking.guest_email || "No email",
                action,
                booking.status || "pending",
                booking.payment_status || "unknown",
                `\u20B1${
                  (booking.payment_amount || booking.total_amount)?.toFixed(
                    2,
                  ) || "0.00"
                }`,
                (() => {
                  const guests = booking.number_of_guests || 0;
                  const warning = guests > 15 ? " \u26A0\uFE0F HIGH CAPACITY" : "";
                  return `${guests} ${
                    guests === 1 ? "guest" : "guests"
                  }${warning}`;
                })(),
                booking.special_requests || "None",
                booking.brings_pet ? "Pet Friendly" : "No Pets",
                `KB-${String(booking.id).padStart(4, "0")}`,
                priority,
                String(booking.special_requests || "").startsWith("[WALK-IN]")
                  ? "Walk-in"
                  : "Online",
              ];
            })
            .sort((a, b) => {
              // Sort by priority: HIGH -> MEDIUM -> LOW
              const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
              return (
                priorityOrder[a[13] as keyof typeof priorityOrder] -
                priorityOrder[b[13] as keyof typeof priorityOrder]
              );
            });
          filename = `daily-checklist-${startDate}-to-${endDate}.csv`;
          break;

        case "user-database":
          // Simple user report for marketing and customer service
          const guestDatabase = new Map();

          // Build simple guest list
          filteredBookings.forEach((booking) => {
            if (booking.guest_name) {
              const key = booking.guest_email || booking.guest_name;
              if (!guestDatabase.has(key)) {
                guestDatabase.set(key, {
                  name: booking.guest_name,
                  email: booking.guest_email || "No email",
                  phone: booking.guest_phone || "No phone",
                  visits: 0,
                  spent: 0,
                });
              }
              const guest = guestDatabase.get(key);
              guest.visits += 1;
              guest.spent += booking.total_amount || 0;
            }
          });

          headers = [
            "Guest Name",
            "Email",
            "Phone",
            "Total Visits",
            "Total Spent",
            "Customer Type",
          ];
          rows = Array.from(guestDatabase.values()).map((guest) => {
            let type = "New";
            if (guest.visits >= 3) type = "VIP";
            else if (guest.visits >= 2) type = "Regular";

            return [
              guest.name,
              guest.email,
              `"${guest.phone}"`, // Wrap phone in quotes to prevent scientific notation
              guest.visits.toString(),
              `\u20B1${guest.spent.toLocaleString()}`,
              type,
            ];
          });

          filename = `user-database-${startDate}-to-${endDate}.csv`;
          break;

        case "booking-status":
          // Simple booking status report for financial tracking
          headers = [
            "Booking ID",
            "Guest Name",
            "Email",
            "Phone",
            "Check-in",
            "Check-out",
            "Amount",
            "Payment Method",
            "Payment Type",
            "Payment Status",
            "Booking Status",
            "Booking Type",
          ];

          rows = filteredBookings.map((booking) => {
            // Enhanced payment status display
            let paymentStatusDisplay = "Unknown";
            const paymentStatus = booking.payment_status;
            const bookingStatus = booking.status;

            // Check if booking is in the future or past
            const today = new Date().toISOString().split("T")[0];
            const checkInDate = booking.check_in_date;
            const isFutureBooking = checkInDate > today;

            // IMPORTANT: If booking is cancelled, payment status should reflect that
            if (bookingStatus === "cancelled") {
              paymentStatusDisplay = "\u274C Booking Cancelled";
            } else if (
              paymentStatus === "verified" ||
              paymentStatus === "paid"
            ) {
              if (isFutureBooking) {
                paymentStatusDisplay = "\u2705 Fully Paid (Future Stay)";
              } else {
                paymentStatusDisplay = "\u2705 Paid & Completed";
              }
            } else if (paymentStatus === "payment_review") {
              paymentStatusDisplay = "\u{1F50D} Under Review";
            } else if (paymentStatus === "pending") {
              paymentStatusDisplay = "\u23F3 Awaiting Payment";
            } else if (paymentStatus === "partial") {
              paymentStatusDisplay = "\u{1F4B0} Partial Payment";
            } else if (paymentStatus === null || paymentStatus === "") {
              paymentStatusDisplay = "\u{1F4DD} New Booking";
            } else if (
              paymentStatus === "cancelled" ||
              paymentStatus === "failed"
            ) {
              paymentStatusDisplay = "\u274C Cancelled/Failed";
            }

            // Enhanced booking status display
            let bookingStatusDisplay = "Unknown";

            if (bookingStatus === "confirmed") {
              bookingStatusDisplay = "\u2705 Confirmed";
            } else if (bookingStatus === "pending") {
              bookingStatusDisplay = "\u23F3 Pending Approval";
            } else if (bookingStatus === "cancelled") {
              bookingStatusDisplay = "\u274C Cancelled";
            } else if (bookingStatus === "completed") {
              bookingStatusDisplay = "\u{1F3C1} Completed";
            }

            // Determine payment method and type
            // Show payment type (half/full) instead of payment method since we don't have payment method in bookings table
            const paymentMethod = booking.payment_type
              ? booking.payment_type.toUpperCase()
              : "\u2753 Not Set";

            // Determine payment type - use payment_type field as primary indicator
            let paymentType = "N/A";
            const totalAmount = booking.total_amount || 0;
            const paidAmount = booking.payment_amount || 0;

            if (
              booking.payment_status === "paid" ||
              booking.payment_status === "verified"
            ) {
              // Use payment_type field to determine if it's a 50% downpayment
              if (booking.payment_type === "half") {
                paymentType = "\u{1F550} 50% Downpayment";
              } else if (booking.payment_type === "full") {
                paymentType = "\u{1F4B0} Full Payment";
              } else if (paidAmount >= totalAmount * 0.95) {
                // Fallback: Full payment (within 5% tolerance for fees)
                paymentType = "\u{1F4B0} Full Payment";
              } else if (
                paidAmount >= totalAmount * 0.4 &&
                paidAmount <= totalAmount * 0.6
              ) {
                // Fallback: 50% downpayment range
                paymentType = "\u{1F550} 50% Downpayment";
              } else if (paidAmount > 0) {
                // Other partial amount
                const percentage = Math.round((paidAmount / totalAmount) * 100);
                paymentType = `\u{1F4B5} ${percentage}% Partial`;
              } else {
                paymentType = "\u{1F4B0} Full Payment"; // Default for paid status
              }
            } else if (booking.payment_status === "payment_review") {
              paymentType = "\u{1F50D} Under Review";
            } else if (
              booking.payment_status === "pending" ||
              booking.payment_status === null
            ) {
              paymentType = "\u23F3 Not Paid";
            } else {
              paymentType = "\u2753 Unknown";
            }

            return [
              booking.id?.toString() || "N/A",
              booking.guest_name || "No name",
              booking.guest_email || "No email",
              `"${booking.guest_phone || "No phone"}"`, // Fix phone format
              booking.check_in_date || "No date",
              booking.check_out_date || "No date",
              `\u20B1${(booking.total_amount || 0).toLocaleString()}`,
              paymentMethod,
              paymentType,
              paymentStatusDisplay,
              bookingStatusDisplay,
              String(booking.special_requests || "").startsWith("[WALK-IN]")
                ? "Walk-in"
                : "Online",
            ];
          });

          // Add payment breakdown summary
          const paymentSummary = {
            totalBookings: filteredBookings.length,
            confirmedPaid: 0,
            pending: 0,
            cancelled: 0,
            totalRevenue: 0,
            pendingRevenue: 0,
            walkInBookings: filteredBookings.filter((b) =>
              String(b.special_requests || "").startsWith("[WALK-IN]"),
            ).length,
            onlineBookings: filteredBookings.filter(
              (b) => !String(b.special_requests || "").startsWith("[WALK-IN]"),
            ).length,
          };

          filteredBookings.forEach((booking) => {
            const amount = booking.total_amount || 0;
            const paidAmount = booking.payment_amount || amount;
            const paymentStatus = booking.payment_status;
            const bookingStatus = booking.status;
            const today = new Date().toISOString().split("T")[0];
            const isFutureBooking = booking.check_in_date > today;

            // IMPORTANT: Check cancelled FIRST - cancelled bookings don't count as revenue
            if (bookingStatus === "cancelled") {
              paymentSummary.cancelled++;
            } else if (
              (paymentStatus === "paid" || paymentStatus === "verified") &&
              bookingStatus === "confirmed"
            ) {
              if (isFutureBooking && paidAmount < amount) {
                // Future booking with partial payment
                paymentSummary.confirmedPaid++;
                paymentSummary.totalRevenue += paidAmount; // Only count what's actually received
                paymentSummary.pending++;
                paymentSummary.pendingRevenue += amount - paidAmount; // Remaining balance
              } else {
                // Completed booking or full payment
                paymentSummary.confirmedPaid++;
                paymentSummary.totalRevenue += amount;
              }
            } else if (
              paymentStatus === "pending" ||
              bookingStatus === "pending"
            ) {
              paymentSummary.pending++;
              paymentSummary.pendingRevenue += amount;
            }
          });

          // Add summary rows
          rows.push(
            ["", "", "", "", "", "", "", "", ""], // Empty row
            ["PAYMENT SUMMARY", "", "", "", "", "", "", "", ""],
            [
              "Total Bookings:",
              paymentSummary.totalBookings.toString(),
              "",
              "",
              "",
              "",
              "",
              "",
              "",
            ],
            [
              "Confirmed & Paid:",
              paymentSummary.confirmedPaid.toString(),
              "",
              "",
              "",
              "",
              `\u20B1${paymentSummary.totalRevenue.toLocaleString()}`,
              "\u2705 Revenue",
              "",
            ],
            [
              "Pending (Payment/Approval):",
              paymentSummary.pending.toString(),
              "",
              "",
              "",
              "",
              `\u20B1${paymentSummary.pendingRevenue.toLocaleString()}`,
              "\u23F3 Potential",
              "",
            ],
            [
              "Cancelled:",
              paymentSummary.cancelled.toString(),
              "",
              "",
              "",
              "",
              "\u20B10",
              "\u274C Lost",
              "",
              "",
              "",
              "",
            ],
            ["", "", "", "", "", "", "", "", "", "", "", ""],
            [
              "BOOKING TYPE BREAKDOWN",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
            ],
            [
              "Walk-in Bookings:",
              paymentSummary.walkInBookings.toString(),
              "",
              "",
              "",
              "",
              `\u20B1${filteredBookings
                .filter((b) =>
                  String(b.special_requests || "").startsWith("[WALK-IN]"),
                )
                .reduce((sum, b) => sum + (b.total_amount || 0), 0)
                .toLocaleString()}`,
              "\u{1F6B6} Walk-in",
              "",
              "",
              "",
              "",
            ],
            [
              "Online Bookings:",
              paymentSummary.onlineBookings.toString(),
              "",
              "",
              "",
              "",
              `\u20B1${filteredBookings
                .filter(
                  (b) =>
                    !String(b.special_requests || "").startsWith("[WALK-IN]"),
                )
                .reduce((sum, b) => sum + (b.total_amount || 0), 0)
                .toLocaleString()}`,
              "\u{1F310} Online",
              "",
              "",
              "",
              "",
            ],
            ["", "", "", "", "", "", "", "", ""],
            ["PAYMENT STRUCTURE BREAKDOWN", "", "", "", "", "", "", "", ""],
            [
              "50% Downpayment Bookings:",
              filteredBookings
                .filter(
                  (b) =>
                    b.status !== "cancelled" &&
                    (b.payment_status === "paid" ||
                      b.payment_status === "verified") &&
                    b.payment_type === "half",
                )
                .length.toString(),
              "",
              "",
              "",
              "",
              `\u20B1${filteredBookings
                .filter(
                  (b) =>
                    b.status !== "cancelled" &&
                    (b.payment_status === "paid" ||
                      b.payment_status === "verified") &&
                    b.payment_type === "half",
                )
                .reduce((sum, b) => sum + (b.total_amount || 0), 0)
                .toLocaleString()}`,
              "\u{1F550} 50% Down",
              "",
            ],
            [
              "Full Payment Bookings:",
              filteredBookings
                .filter(
                  (b) =>
                    b.status !== "cancelled" &&
                    (b.payment_status === "paid" ||
                      b.payment_status === "verified") &&
                    b.payment_type === "full",
                )
                .length.toString(),
              "",
              "",
              "",
              "",
              `\u20B1${filteredBookings
                .filter(
                  (b) =>
                    b.status !== "cancelled" &&
                    (b.payment_status === "paid" ||
                      b.payment_status === "verified") &&
                    b.payment_type === "full",
                )
                .reduce((sum, b) => sum + (b.total_amount || 0), 0)
                .toLocaleString()}`,
              "\u{1F4B0} Full Pay",
              "",
            ],
            ["", "", "", "", "", "", "", "", ""],
            ["PAYMENT COLLECTIONS BREAKDOWN", "", "", "", "", "", "", "", ""],
            [
              "Awaiting Payment:",
              filteredBookings
                .filter(
                  (b) =>
                    b.status !== "cancelled" && b.payment_status === "pending",
                )
                .length.toString(),
              "",
              "",
              "",
              "",
              `\u20B1${filteredBookings
                .filter(
                  (b) =>
                    b.status !== "cancelled" && b.payment_status === "pending",
                )
                .reduce((sum, b) => sum + (b.total_amount || 0), 0)
                .toLocaleString()}`,
              "\u23F3 To Collect",
              "",
            ],
            ["", "", "", "", "", "", "", "", ""],
            ["50% DOWNPAYMENT BOOKINGS", "", "", "", "", "", "", "", ""],
            [
              "Future F2F Collections:",
              filteredBookings
                .filter((b) => {
                  if (b.status === "cancelled") return false;
                  const today = new Date().toISOString().split("T")[0];
                  const isFutureBooking = b.check_in_date > today;
                  const paidAmount = b.payment_amount || 0;
                  const totalAmount = b.total_amount || 0;
                  const isVerified =
                    b.payment_status === "paid" ||
                    b.payment_status === "verified";
                  const is50Percent =
                    paidAmount > 0 &&
                    paidAmount >= totalAmount * 0.4 &&
                    paidAmount <= totalAmount * 0.6;
                  const hasBalance = paidAmount < totalAmount;
                  return (
                    isVerified && is50Percent && hasBalance && isFutureBooking
                  );
                })
                .length.toString(),
              "",
              "",
              "",
              "",
              `\u20B1${filteredBookings
                .filter((b) => {
                  if (b.status === "cancelled") return false;
                  const today = new Date().toISOString().split("T")[0];
                  const isFutureBooking = b.check_in_date > today;
                  const paidAmount = b.payment_amount || 0;
                  const totalAmount = b.total_amount || 0;
                  const isVerified =
                    b.payment_status === "paid" ||
                    b.payment_status === "verified";
                  const is50Percent =
                    paidAmount > 0 &&
                    paidAmount >= totalAmount * 0.4 &&
                    paidAmount <= totalAmount * 0.6;
                  const hasBalance = paidAmount < totalAmount;
                  return (
                    isVerified && is50Percent && hasBalance && isFutureBooking
                  );
                })
                .reduce((sum, b) => {
                  const paidAmount = b.payment_amount || 0;
                  const totalAmount = b.total_amount || 0;
                  return sum + (totalAmount - paidAmount);
                }, 0)
                .toLocaleString()}`,
              "\u{1F3E8} Future F2F",
              "",
            ],
            [
              "Completed F2F Payments:",
              filteredBookings
                .filter((b) => {
                  if (b.status === "cancelled") return false;
                  const today = new Date().toISOString().split("T")[0];
                  const isPastBooking = b.check_in_date <= today;
                  const isVerified =
                    b.payment_status === "paid" ||
                    b.payment_status === "verified";
                  // Use payment_type field to identify 50% downpayments
                  const is50Percent = b.payment_type === "half";
                  return isVerified && is50Percent && isPastBooking;
                })
                .length.toString(),
              "",
              "",
              "",
              "",
              `\u20B1${filteredBookings
                .filter((b) => {
                  if (b.status === "cancelled") return false;
                  const today = new Date().toISOString().split("T")[0];
                  const isPastBooking = b.check_in_date <= today;
                  const isVerified =
                    b.payment_status === "paid" ||
                    b.payment_status === "verified";
                  const is50Percent = b.payment_type === "half";
                  return isVerified && is50Percent && isPastBooking;
                })
                .reduce((sum, b) => {
                  // For 50% downpayments, F2F portion is always 50% of total
                  const totalAmount = b.total_amount || 0;
                  return sum + totalAmount * 0.5; // 50% F2F portion
                }, 0)
                .toLocaleString()}`,
              "\u2705 F2F Done",
              "",
            ],
            ["", "", "", "", "", "", "", "", ""],
            [
              "TOTAL TO COLLECT:",
              "",
              "",
              "",
              "",
              "",
              `\u20B1${(
                filteredBookings
                  .filter(
                    (b) =>
                      b.status !== "cancelled" &&
                      b.payment_status === "pending",
                  )
                  .reduce((sum, b) => sum + (b.total_amount || 0), 0) +
                filteredBookings
                  .filter((b) => {
                    if (b.status === "cancelled") return false;
                    const paidAmount = b.payment_amount || 0;
                    const totalAmount = b.total_amount || 0;
                    const hasRemainingBalance =
                      paidAmount > 0 && paidAmount < totalAmount;
                    const isVerified =
                      b.payment_status === "paid" ||
                      b.payment_status === "verified";
                    return isVerified && hasRemainingBalance;
                  })
                  .reduce((sum, b) => {
                    const paidAmount = b.payment_amount || 0;
                    const totalAmount = b.total_amount || 0;
                    return sum + (totalAmount - paidAmount);
                  }, 0)
              ).toLocaleString()}`,
              "\u{1F4B5} CASH NEEDED",
              "",
            ],
          );

          filename = `booking-status-${startDate}-to-${endDate}.csv`;
          break;

        case "money-summary-unused":
          // Simple financial overview for staff and management
          const todayMoney = new Date().toISOString().split("T")[0];

          // Calculate money metrics
          const paidBookings = filteredBookings.filter(
            (b) =>
              b.payment_status === "paid" || b.payment_status === "verified",
          );

          const pendingPayments = filteredBookings.filter(
            (b) =>
              b.payment_status === "pending" || b.payment_status === "partial",
          );

          const upcomingCheckouts = filteredBookings.filter((b) => {
            const checkOut = new Date(b.check_out_date);
            const today = new Date(todayMoney);
            const nextWeek = new Date(
              today.getTime() + 7 * 24 * 60 * 60 * 1000,
            );
            return (
              checkOut >= today &&
              checkOut <= nextWeek &&
              (b.payment_status === "paid" || b.payment_status === "verified")
            );
          });

          // Calculate totals
          const totalEarned = paidBookings.reduce(
            (sum, b) => sum + (b.total_amount || 0),
            0,
          );
          const totalPending = pendingPayments.reduce(
            (sum, b) => sum + (b.total_amount || 0),
            0,
          );
          const weeklyExpected = upcomingCheckouts.reduce(
            (sum, b) => sum + (b.total_amount || 0),
            0,
          );

          // Payment method breakdown
          const paymentMethods: Record<
            string,
            { count: number; amount: number }
          > = {};
          paidBookings.forEach((booking) => {
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
            const displayMethod = methodMap[method] || method || "Other";
            if (!paymentMethods[displayMethod]) {
              paymentMethods[displayMethod] = { count: 0, amount: 0 };
            }
            paymentMethods[displayMethod].count += 1;
            paymentMethods[displayMethod].amount += booking.total_amount || 0;
          });

          headers = [
            "Money Category",
            "Amount (\u20B1)",
            "Count",
            "Average (\u20B1)",
            "Status",
            "Staff Action Needed",
          ];

          const avgEarned =
            paidBookings.length > 0 ? totalEarned / paidBookings.length : 0;
          const avgPending =
            pendingPayments.length > 0
              ? totalPending / pendingPayments.length
              : 0;

          rows = [
            [
              "\u{1F4B0} MONEY EARNED (Paid Bookings)",
              `\u20B1${totalEarned.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}`,
              `${paidBookings.length} bookings`,
              `\u20B1${avgEarned.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}`,
              totalEarned > 100000
                ? "\u{1F7E2} Excellent"
                : totalEarned > 50000
                  ? "\u{1F7E1} Good"
                  : "\u{1F534} Low",
              "Money secured - track daily deposits",
            ],
            [
              "\u23F3 MONEY PENDING (Awaiting Payment)",
              `\u20B1${totalPending.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}`,
              `${pendingPayments.length} bookings`,
              `\u20B1${avgPending.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}`,
              pendingPayments.length === 0
                ? "\u{1F7E2} All paid"
                : pendingPayments.length < 5
                  ? "\u{1F7E1} Few pending"
                  : "\u{1F534} Many pending",
              pendingPayments.length > 0
                ? "Follow up on pending payments ASAP"
                : "All payments current",
            ],
            [
              "\u{1F4C5} MONEY THIS WEEK (Expected from checkouts)",
              `\u20B1${weeklyExpected.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}`,
              `${upcomingCheckouts.length} checkouts`,
              upcomingCheckouts.length > 0
                ? `\u20B1${(
                    weeklyExpected / upcomingCheckouts.length
                  ).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                : "\u20B10.00",
              upcomingCheckouts.length > 0
                ? "\u{1F4BC} Expected income"
                : "\u{1F3D6}\uFE0F No checkouts",
              upcomingCheckouts.length > 0
                ? "Prepare for guest departures this week"
                : "No scheduled checkouts",
            ],
          ];

          // Add payment method breakdown
          Object.entries(paymentMethods).forEach(([method, data]) => {
            const avg = data.count > 0 ? data.amount / data.count : 0;
            rows.push([
              `\u{1F4B3} ${method} Payments`,
              `\u20B1${data.amount.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}`,
              `${data.count} transactions`,
              `\u20B1${avg.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
              "\u{1F4B0} Payment method",
              method === "Cash Payment"
                ? "Count cash daily, deposit safely"
                : "Digital payment - verify receipts",
            ]);
          });

          // Add summary row
          const totalRevenueMoney = totalEarned + totalPending;

          rows.push([
            "\u{1F4CA} TOTAL REVENUE (All bookings this period)",
            `\u20B1${totalRevenueMoney.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}`,
            `${filteredBookings.length} total bookings`,
            `\u20B1${(
              totalRevenueMoney / Math.max(filteredBookings.length, 1)
            ).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            "\u{1F4C8} Period total",
            "Review daily revenue goals vs actual performance",
          ]);

          filename = `money-summary-${startDate}-to-${endDate}.csv`;
          break;

        default:
          headers = ["Error"];
          rows = [["Unknown report type"]];
          filename = "error.csv";
      }

      if (rows.length === 0) {
        alert(
          `No ${selectedReport.name.toLowerCase()} data found for the selected period.`,
        );
        return;
      }

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) => {
              // Handle null/undefined
              if (cell === null || cell === undefined) return '""';

              let value = String(cell).trim();

              // For numeric values that might show asterisks in Excel
              if (!isNaN(Number(cell)) && cell !== "" && cell !== null) {
                const num = Number(cell);
                // Format currency/decimal values with proper precision
                if (
                  headers.some(
                    (h) =>
                      h.toLowerCase().includes("amount") ||
                      h.toLowerCase().includes("revenue") ||
                      h.toLowerCase().includes("value") ||
                      h.toLowerCase().includes("spent"),
                  )
                ) {
                  value = num.toFixed(2);
                } else {
                  value = num.toString();
                }
              }

              // Escape quotes and wrap in quotes if contains special characters
              if (
                value.includes(",") ||
                value.includes('"') ||
                value.includes("\n") ||
                value.includes(";")
              ) {
                return `"${value.replace(/"/g, '""')}"`;
              }

              return `"${value}"`;
            })
            .join(","),
        ),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      showToast({
        type: "success",
        title: "Export Completed",
        message: `${selectedReport.name} exported successfully! Downloaded ${rows.length} records.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      showToast({
        type: "error",
        title: "Export Failed",
        message:
          "Failed to export report. Please try again or contact support.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    bookings,
    isLoading,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedReport,
    setSelectedReport,
    isExporting,
    allUsers,
    filteredBookings,
    confirmedBookings,
    totalRevenue,
    formatCurrency,
    fetchBookings,
    exportReport,
    showToast,
  };
}
