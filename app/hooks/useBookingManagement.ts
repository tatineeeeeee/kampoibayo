"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useToastHelpers } from "../components/Toast";
import { getFreshSession } from "../utils/apiTimeout";
import type { Booking, PaymentProof, PaymentHistoryEntry } from "../lib/types";
import { ITEMS_PER_PAGE } from "../lib/constants";
import { BOOKING_STATUS, PAYMENT_STATUS } from "../lib/constants/booking";
import {
  formatBookingNumber,
  parseBookingNumber,
} from "../utils/bookingNumber";

export interface PaymentSummaryData {
  totalAmount: number;
  totalPaid: number;
  pendingAmount: number;
  remainingBalance: number;
}

export interface UseBookingManagementReturn {
  // Booking data
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  filteredBookings: Booking[];
  paginatedBookings: Booking[];
  loading: boolean;
  refreshing: boolean;

  // Search & filter
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  showDeletedUsers: boolean;
  setShowDeletedUsers: React.Dispatch<React.SetStateAction<boolean>>;

  // Pagination
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;

  // Real-time
  newBookingAlert: string | null;
  refreshTrigger: number;
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
  lastRealTimeEvent: string | null;
  setLastRealTimeEvent: React.Dispatch<React.SetStateAction<string | null>>;
  realTimeStatus: "connecting" | "active" | "degraded" | "offline";
  isManualRefreshing: boolean;

  // Payment history
  paymentHistory: PaymentHistoryEntry[];
  paymentHistoryLoading: boolean;
  showPaymentHistory: boolean;
  setShowPaymentHistory: React.Dispatch<React.SetStateAction<boolean>>;
  paymentSummary: PaymentSummaryData | null;
  setPaymentSummary: React.Dispatch<
    React.SetStateAction<PaymentSummaryData | null>
  >;

  // Functions
  fetchBookings: (isRefresh?: boolean, silent?: boolean) => Promise<void>;
  fetchPaymentHistory: (bookingId: number) => Promise<void>;
  handleManualRefresh: () => Promise<void>;
  setPaymentHistory: React.Dispatch<
    React.SetStateAction<PaymentHistoryEntry[]>
  >;
}

export function useBookingManagement(): UseBookingManagementReturn {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDeletedUsers, setShowDeletedUsers] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(ITEMS_PER_PAGE);
  const [paginatedBookings, setPaginatedBookings] = useState<Booking[]>([]);

  // Real-time state
  const [newBookingAlert, setNewBookingAlert] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastRealTimeEvent, setLastRealTimeEvent] = useState<string | null>(
    null,
  );
  const [realTimeStatus, setRealTimeStatus] = useState<
    "connecting" | "active" | "degraded" | "offline"
  >("connecting");
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>(
    [],
  );
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentSummary, setPaymentSummary] =
    useState<PaymentSummaryData | null>(null);

  // Toast helpers
  const { success, error: showError, warning } = useToastHelpers();

  // Use ref to avoid stale closure in subscriptions
  const statusFilterRef = useRef(statusFilter);
  useEffect(() => {
    statusFilterRef.current = statusFilter;
  }, [statusFilter]);

  // Fetch payment history for a booking
  const fetchPaymentHistory = useCallback(async (bookingId: number) => {
    setPaymentHistoryLoading(true);
    try {
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        console.error("Authentication required for payment history");
        setPaymentHistory([]);
        setPaymentSummary(null);
        setPaymentHistoryLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/payment-history/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setPaymentHistory(data.paymentHistory || []);
        setPaymentSummary(data.paymentSummary || null);
      } else {
        console.error("Failed to fetch payment history:", data.error);
        setPaymentHistory([]);
        setPaymentSummary(null);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
      setPaymentHistory([]);
      setPaymentSummary(null);
    } finally {
      setPaymentHistoryLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(
    async (isRefresh = false, silent = false) => {
      try {
        if (!silent) {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }
        }

        // Step 1: Get all bookings with error handling
        const { data: bookingsData, error } = await supabase
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching bookings:", error);
          showError(
            `Failed to fetch bookings: ${error.message || "Unknown error"}`,
          );
          return;
        }

        // If no bookings, return early
        if (!bookingsData || bookingsData.length === 0) {
          setBookings([]);
          return;
        }

        // Step 2: Get all unique user IDs from bookings
        const userIds = Array.from(
          new Set(
            bookingsData.map((booking) => booking.user_id).filter(Boolean),
          ),
        );

        // Step 3: Single query to check which users exist
        let existingUserIds = new Set<string>();

        if (userIds.length > 0) {
          const { data: existingUsers, error: usersError } = await supabase
            .from("users")
            .select("auth_id")
            .in("auth_id", userIds);

          if (usersError) {
            console.warn(
              "Error fetching users (continuing with default):",
              usersError,
            );
            existingUserIds = new Set(userIds);
          } else {
            existingUserIds = new Set(
              existingUsers
                ?.map((user) => user.auth_id)
                .filter((id): id is string => Boolean(id)) || [],
            );
          }
        }

        // Step 4: Add user_exists flag efficiently
        const bookingsWithUserStatus = bookingsData.map((booking) => ({
          ...booking,
          user_exists:
            existingUserIds.has(booking.user_id) || !booking.user_id,
        }));

        // Step 5: Sort bookings by workflow priority
        const currentStatusFilter = statusFilterRef.current;

        const sortedBookings = bookingsWithUserStatus.sort((a, b) => {
          const statusA = a.status || BOOKING_STATUS.PENDING;
          const statusB = b.status || BOOKING_STATUS.PENDING;
          const paymentStatusA = a.payment_status || PAYMENT_STATUS.PENDING;
          const paymentStatusB = b.payment_status || PAYMENT_STATUS.PENDING;

          const getPriority = (
            status: string,
            paymentStatus: string,
            cancelledBy: string | null,
          ) => {
            if (
              currentStatusFilter === BOOKING_STATUS.CANCELLED &&
              status === BOOKING_STATUS.CANCELLED
            ) {
              return 90;
            }

            if (status === BOOKING_STATUS.CANCELLED) {
              if (cancelledBy === "user") {
                return 99;
              } else if (cancelledBy === "admin") {
                return 98;
              } else {
                return 97;
              }
            }

            if (
              status === "pending_verification" ||
              paymentStatus === PAYMENT_STATUS.PAYMENT_REVIEW
            )
              return 1;

            if (paymentStatus === PAYMENT_STATUS.REJECTED) return 2;
            if (status === BOOKING_STATUS.PENDING) return 3;
            if (status === BOOKING_STATUS.CONFIRMED) return 4;
            if (status === BOOKING_STATUS.COMPLETED) return 5;

            return 6;
          };

          const priorityA = getPriority(
            statusA,
            paymentStatusA,
            a.cancelled_by,
          );
          const priorityB = getPriority(
            statusB,
            paymentStatusB,
            b.cancelled_by,
          );

          if (priorityA === priorityB) {
            const timeA = new Date(a.created_at || "").getTime();
            const timeB = new Date(b.created_at || "").getTime();
            return timeB - timeA;
          }

          return priorityA - priorityB;
        });

        setBookings(sortedBookings as Booking[]);
      } catch (error) {
        console.error("Unexpected error in fetchBookings:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        showError(`Failed to load bookings: ${errorMessage}`);
      } finally {
        if (!silent) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [showError],
  );

  // Main effect: delayed fetch + real-time subscriptions
  useEffect(() => {
    // Delayed fetch to not block navigation
    const timer = setTimeout(() => {
      fetchBookings();
    }, 100);

    // Set up real-time subscriptions for instant updates
    setRealTimeStatus("connecting");

    // Set up real-time subscription for bookings with enhanced reliability
    const bookingsSubscription = supabase
      .channel("admin-bookings-realtime", {
        config: {
          broadcast: { self: true },
          presence: { key: "admin-user" },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            // Show alert for payment proof uploads
            if (
              payload.old?.payment_status !== PAYMENT_STATUS.PAYMENT_REVIEW &&
              payload.new.payment_status === PAYMENT_STATUS.PAYMENT_REVIEW
            ) {
              if (!document.hidden) {
                success(
                  "Payment Proof Uploaded!",
                  `Booking ${payload.new.id} (${payload.new.guest_name}) uploaded payment proof - Ready for review!`,
                );
                setRefreshTrigger((prev) => prev + 1);
              }
            }

            // Handle ANY cancellation - auto-cancel payment proofs when booking is cancelled
            if (
              payload.old?.status !== BOOKING_STATUS.CANCELLED &&
              payload.new.status === BOOKING_STATUS.CANCELLED
            ) {
              const cancelPaymentProofs = async () => {
                try {
                  const cancelledBy = payload.new.cancelled_by || "system";
                  const adminNote = `Booking cancelled by ${cancelledBy} - Payment proof automatically cancelled`;

                  const { error } = await supabase
                    .from("payment_proofs")
                    .update({
                      status: "cancelled",
                      admin_notes: `${adminNote} (by ${cancelledBy})`,
                      verified_at: new Date().toISOString(),
                    })
                    .eq("booking_id", payload.new.id)
                    .in("status", ["pending", "verified", "rejected"]);

                  if (error) {
                    console.error("Failed to cancel payment proofs:", error);
                  }
                } catch (error) {
                  console.error("Error cancelling payment proofs:", error);
                }
              };

              cancelPaymentProofs();

              if (!document.hidden) {
                const cancelledBy =
                  payload.new.cancelled_by === "user" ? "user" : "admin";
                warning(
                  "Booking Cancelled",
                  `Booking ${payload.new.id} (${payload.new.guest_name}) was cancelled by ${cancelledBy}`,
                );
                setRefreshTrigger((prev) => prev + 1);
                setTimeout(() => setRefreshTrigger((prev) => prev + 1), 500);
              }
            }

            // Instantly update the booking with all new data
            setBookings((prevBookings) => {
              return prevBookings.map((booking) => {
                if (booking.id === payload.new.id) {
                  return {
                    ...booking,
                    ...payload.new,
                    user_exists: booking.user_exists,
                  };
                }
                return booking;
              });
            });

            setRefreshTrigger((prev) => prev + 1);
          } else if (payload.eventType === "INSERT" && payload.new) {
            const newBookingWithStatus = {
              ...payload.new,
              user_exists: true,
            } as Booking;

            setBookings((prevBookings) => {
              const existingIndex = prevBookings.findIndex(
                (b) => b.id === payload.new.id,
              );

              if (existingIndex >= 0) {
                return prevBookings.map((booking, index) =>
                  index === existingIndex ? newBookingWithStatus : booking,
                );
              } else {
                const updatedBookings = [newBookingWithStatus, ...prevBookings];
                return updatedBookings.sort(
                  (a, b) =>
                    new Date(b.created_at || "").getTime() -
                    new Date(a.created_at || "").getTime(),
                );
              }
            });

            if (!document.hidden) {
              setNewBookingAlert(
                `New booking from ${payload.new.guest_name || "Guest"}!`,
              );
              setTimeout(() => setNewBookingAlert(null), 5000);
            }

            // Verify user status in background
            setTimeout(async () => {
              try {
                const { data: userData, error } = await supabase
                  .from("users")
                  .select("auth_id")
                  .eq("auth_id", payload.new.user_id)
                  .single();

                const userExists = !error && userData;

                if (!userExists) {
                  setBookings((prevBookings) =>
                    prevBookings.map((booking) =>
                      booking.id === payload.new.id
                        ? { ...booking, user_exists: false }
                        : booking,
                    ),
                  );
                }
              } catch (error) {
                console.warn(
                  "Failed to verify user status for new booking:",
                  error,
                );
              }
            }, 1000);
          } else if (payload.eventType === "DELETE" && payload.old) {
            setBookings((prevBookings) => {
              return prevBookings.filter(
                (booking) => booking.id !== payload.old.id,
              );
            });
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealTimeStatus("active");
          setLastRealTimeEvent(new Date().toISOString());
        }
      });

    // Set up real-time subscription for users (to detect user deletions)
    const usersSubscription = supabase
      .channel("users_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
        },
        () => {
          setTimeout(() => {
            fetchBookings(false, true);
          }, 500);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealTimeStatus("active");
          setLastRealTimeEvent(new Date().toISOString());
        }
      });

    // Backup sync system for reliability
    const syncInterval = setInterval(() => {
      const now = Date.now();
      const lastEvent = lastRealTimeEvent;
      const timeSinceLastRealTime = lastEvent
        ? now - new Date(lastEvent).getTime()
        : 0;

      if (
        !document.hidden &&
        document.hasFocus() &&
        lastEvent &&
        timeSinceLastRealTime > 60000
      ) {
        setRealTimeStatus("degraded");
        fetchBookings(false, true);
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBookings(false, true);
      }
    };

    const handleFocus = () => {
      fetchBookings(false, true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Cleanup subscriptions on unmount
    return () => {
      clearTimeout(timer);
      clearInterval(syncInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      supabase.removeChannel(bookingsSubscription);
      supabase.removeChannel(usersSubscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Auto-complete confirmed bookings that have passed their checkout date
  useEffect(() => {
    const autoComplete = async () => {
      try {
        const session = await getFreshSession(supabase);
        if (!session?.access_token) return;

        const response = await fetch("/api/bookings/auto-complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.completedCount > 0) {
            fetchBookings(false, true);
          }
        }
      } catch {
        // Silent fail - auto-complete is non-critical
      }
    };

    const timer = setTimeout(autoComplete, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter bookings based on user preference AND search term
  useEffect(() => {
    let filtered = bookings;

    if (!showDeletedUsers) {
      filtered = filtered.filter((booking) => booking.user_exists);
    }

    if (statusFilter === "walk-in") {
      filtered = filtered.filter((booking) =>
        String(booking.special_requests || "").startsWith("[WALK-IN]"),
      );
    } else if (statusFilter !== "all") {
      filtered = filtered.filter(
        (booking) =>
          booking.status?.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const searchUpper = searchTerm.toUpperCase().trim();

      filtered = filtered.filter((booking) => {
        const bookingNumber = formatBookingNumber(booking.id);
        const matchesBookingNumber = bookingNumber.includes(searchUpper);

        const parsedId = parseBookingNumber(searchUpper);
        const matchesParsedBookingNumber = parsedId === booking.id;

        return (
          matchesBookingNumber ||
          matchesParsedBookingNumber ||
          booking.guest_name?.toLowerCase().includes(searchLower) ||
          booking.guest_email?.toLowerCase().includes(searchLower) ||
          booking.guest_phone
            ?.replace(/[\s-]/g, "")
            .includes(searchTerm.replace(/[\s-]/g, "")) ||
          booking.id.toString().includes(searchTerm.trim())
        );
      });
    }

    if (statusFilter === "cancelled") {
      filtered = filtered.sort((a, b) => {
        return (
          new Date(b.created_at || "").getTime() -
          new Date(a.created_at || "").getTime()
        );
      });
    }

    setFilteredBookings(filtered);
  }, [bookings, showDeletedUsers, searchTerm, statusFilter]);

  // Pagination logic
  useEffect(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    setPaginatedBookings(filteredBookings.slice(startIdx, endIdx));
  }, [filteredBookings, currentPage, itemsPerPage]);

  // Reset to first page only when filter criteria change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Refresh trigger effect
  useEffect(() => {
    if (refreshTrigger > 0) {
      // No need to fetch bookings here - the individual components will update via their own subscriptions
    }
  }, [refreshTrigger]);

  // Pagination helpers
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    filteredBookings.length,
  );

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
  );

  const goToFirstPage = useCallback(() => setCurrentPage(1), []);
  const goToLastPage = useCallback(
    () => setCurrentPage(totalPages),
    [totalPages],
  );
  const goToPreviousPage = useCallback(
    () => setCurrentPage((prev) => Math.max(1, prev - 1)),
    [],
  );
  const goToNextPage = useCallback(
    () =>
      setCurrentPage((prev) => Math.min(totalPages, prev + 1)),
    [totalPages],
  );

  const handleManualRefresh = useCallback(async () => {
    if (isManualRefreshing) return;

    setIsManualRefreshing(true);

    try {
      await fetchBookings(true);
      setLastRealTimeEvent(new Date().toISOString());
      success("Bookings refreshed successfully");
    } catch {
      showError("Failed to refresh bookings. Please try again.");
    } finally {
      setTimeout(() => {
        setIsManualRefreshing(false);
      }, 500);
    }
  }, [isManualRefreshing, fetchBookings, success, showError]);

  return {
    // Booking data
    bookings,
    setBookings,
    filteredBookings,
    paginatedBookings,
    loading,
    refreshing,

    // Search & filter
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    showDeletedUsers,
    setShowDeletedUsers,

    // Pagination
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToPreviousPage,
    goToNextPage,

    // Real-time
    newBookingAlert,
    refreshTrigger,
    setRefreshTrigger,
    lastRealTimeEvent,
    setLastRealTimeEvent,
    realTimeStatus,
    isManualRefreshing,

    // Payment history
    paymentHistory,
    paymentHistoryLoading,
    showPaymentHistory,
    setShowPaymentHistory,
    paymentSummary,
    setPaymentSummary,

    // Functions
    fetchBookings,
    fetchPaymentHistory,
    handleManualRefresh,
    setPaymentHistory,
  };
}
