"use client";

import { useCallback, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useToastHelpers } from "../components/Toast";
import type { Booking, PaymentProof } from "../lib/types";
import { BOOKING_STATUS, PAYMENT_STATUS } from "../lib/constants/booking";
import type { UseBookingManagementReturn } from "./useBookingManagement";
import type { UseBookingModalsReturn } from "./useBookingModals";

export interface UseBookingActionsReturn {
  updateBookingStatus: (bookingId: number, newStatus: string) => Promise<void>;
  handleAdminCancelBooking: (
    bookingId: number,
    shouldRefund?: boolean,
  ) => Promise<void>;
  handleAdminReschedule: () => Promise<void>;
  handlePaymentProofAction: (
    action: "approve" | "reject",
    proofId: number,
  ) => Promise<void>;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
}

export function useBookingActions(
  management: UseBookingManagementReturn,
  modals: UseBookingModalsReturn,
): UseBookingActionsReturn {
  const { success, error: showError, warning } = useToastHelpers();

  const {
    bookings,
    setBookings,
    fetchBookings,
    fetchPaymentHistory,
    setRefreshTrigger,
    paymentSummary,
    setPaymentSummary,
    setPaymentHistory,
    setShowPaymentHistory,
  } = management;

  const {
    selectedBooking,
    setSelectedBooking,
    showPaymentProofModal,
    selectedPaymentProof,
    setSelectedPaymentProof,
    paymentProofLoading,
    setPaymentProofLoading,
    verificationNotes,
    setVerificationNotes,
    rejectionReason,
    setRejectionReason,
    customRejectionReason,
    setCustomRejectionReason,
    rejectionReasons,
    setShowPaymentProofModal,
    showConfirmCancel,
    setShowConfirmCancel,
    setIsProcessing,
    adminCancellationReason,
    rescheduleCheckIn,
    rescheduleCheckOut,
    rescheduleReason,
    setRescheduleLoading,
    showModal,
    setShowModal,
    setShowCancelModal,
    setAdminCancellationReason,
    setShouldRefund,
    setShowRescheduleModal,
    setRescheduleCheckIn,
    setRescheduleCheckOut,
    setRescheduleReason,
    imageZoomed,
    setImageZoomed,
  } = modals;

  // Real-time subscription for payment proofs - moved here since it needs modal state
  useEffect(() => {
    const paymentProofsSubscription = supabase
      .channel("admin-payment-proofs-realtime", {
        config: {
          broadcast: { self: true },
          presence: { key: "admin-payment-reviews" },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_proofs",
        },
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new && payload.old) {
            const { new: newProof, old: oldProof } = payload;

            if (oldProof.status !== newProof.status) {
              const statusMessages = {
                verified: {
                  type: "success",
                  title: "Payment Verified!",
                  message: `Payment proof for booking ${newProof.booking_id} approved`,
                },
                rejected: {
                  type: "warning",
                  title: "Payment Rejected",
                  message: `Payment proof for booking ${newProof.booking_id} rejected`,
                },
                cancelled: {
                  type: "info",
                  title: "Payment Cancelled",
                  message: `Payment proof for booking ${newProof.booking_id} cancelled`,
                },
              };

              const statusInfo =
                statusMessages[newProof.status as keyof typeof statusMessages];
              if (statusInfo) {
                if (newProof.status === "verified") {
                  success(statusInfo.title, statusInfo.message);
                } else if (newProof.status === "rejected") {
                  warning(statusInfo.title, statusInfo.message);
                } else if (newProof.status === "cancelled") {
                  warning(statusInfo.title, statusInfo.message);
                } else {
                  showError(statusInfo.title, statusInfo.message);
                }
              }
            }

            // If modal is open for this booking, refresh it immediately
            if (
              showPaymentProofModal &&
              selectedBooking &&
              selectedBooking.id === newProof.booking_id
            ) {
              fetchPaymentHistory(newProof.booking_id);

              if (
                selectedPaymentProof &&
                selectedPaymentProof.id === newProof.id
              ) {
                setSelectedPaymentProof(newProof as PaymentProof);
              }

              (async () => {
                try {
                  const { data: latestProof } = await supabase
                    .from("payment_proofs")
                    .select("*")
                    .eq("booking_id", newProof.booking_id)
                    .order("uploaded_at", { ascending: false })
                    .limit(1)
                    .single();

                  if (latestProof) {
                    setSelectedPaymentProof(latestProof);
                  }
                } catch (error) {
                  // Silent fail
                }
              })();
            }

            setRefreshTrigger((prev) => prev + 1);

            if (
              newProof.status === "cancelled" ||
              newProof.status === "rejected"
            ) {
              setTimeout(() => setRefreshTrigger((prev) => prev + 1), 100);
            }
          }

          if (payload.eventType === "INSERT" && payload.new) {
            management.setLastRealTimeEvent(new Date().toISOString());

            if (!document.hidden) {
              success(
                "Payment Proof Uploaded!",
                `New payment proof received for booking ${payload.new.booking_id} - Ready for review!`,
              );

              if (Notification.permission === "granted") {
                new Notification("New Payment Proof Uploaded!", {
                  body: `Booking ${payload.new.booking_id} uploaded payment proof`,
                  icon: "/favicon.ico",
                  tag: `payment-proof-${payload.new.booking_id}`,
                });
              }
            }

            setBookings((prevBookings) => {
              return prevBookings.map((booking) => {
                if (booking.id === payload.new.booking_id) {
                  return {
                    ...booking,
                    payment_status: PAYMENT_STATUS.PAYMENT_REVIEW,
                    updated_at: new Date().toISOString(),
                  };
                }
                return booking;
              });
            });

            // If modal is open for this booking, refresh it immediately
            if (
              showPaymentProofModal &&
              selectedBooking &&
              selectedBooking.id === payload.new.booking_id
            ) {
              fetchPaymentHistory(payload.new.booking_id);

              (async () => {
                try {
                  const { data: latestProof } = await supabase
                    .from("payment_proofs")
                    .select("*")
                    .eq("booking_id", payload.new.booking_id)
                    .order("uploaded_at", { ascending: false })
                    .limit(1)
                    .single();

                  if (latestProof) {
                    setSelectedPaymentProof(latestProof);
                  }
                } catch (error) {
                  console.error(
                    "Failed to update modal with latest proof:",
                    error,
                  );
                }
              })();
            }

            // Single debounced refresh instead of multiple timeouts
            setRefreshTrigger((prev) => prev + 1);
            setTimeout(() => {
              fetchBookings(false, true);
            }, 500);
          }

          if (payload.eventType === "DELETE" && payload.old) {
            warning(
              "Payment Proof Deleted",
              `Payment proof for booking ${payload.old.booking_id} was deleted`,
            );
            setRefreshTrigger((prev) => prev + 1);
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          management.setLastRealTimeEvent(new Date().toISOString());

          if (Notification.permission === "default") {
            Notification.requestPermission();
          }
        }
      });

    return () => {
      supabase.removeChannel(paymentProofsSubscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showPaymentProofModal,
    selectedBooking,
    selectedPaymentProof,
  ]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case BOOKING_STATUS.CONFIRMED:
        return "bg-success";
      case BOOKING_STATUS.PENDING:
        return "bg-warning";
      case BOOKING_STATUS.CANCELLED:
        return "bg-destructive";
      default:
        return "bg-muted-foreground";
    }
  }, []);

  const updateBookingStatus = useCallback(
    async (bookingId: number, newStatus: string) => {
      // Optimistic update
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: newStatus }
            : booking,
        ),
      );

      try {
        if (newStatus === BOOKING_STATUS.CONFIRMED) {
          const { getFreshSession } = await import("../utils/apiTimeout");
          const session = await getFreshSession(supabase);
          if (!session?.access_token) {
            throw new Error("Authentication required. Please log in again.");
          }

          const response = await fetch("/api/admin/confirm-booking", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ bookingId }),
          });

          const result = await response.json();

          if (result.success) {
            success(result.message || "Booking confirmed and user notified");
          } else {
            throw new Error(result.error || "Failed to confirm booking");
          }
        } else {
          const updateData: {
            status: string;
            cancelled_by?: string;
            cancelled_at?: string;
            cancellation_reason?: string;
          } = { status: newStatus };

          if (newStatus === BOOKING_STATUS.CANCELLED) {
            const now = new Date();
            const utcTime = now.getTime();
            const philippinesOffset = 8 * 60 * 60 * 1000;
            const philippinesTime = new Date(utcTime + philippinesOffset);

            updateData.cancelled_by = "admin";
            updateData.cancelled_at = philippinesTime.toISOString();
            updateData.cancellation_reason = "Cancelled by administrator";
          }

          const { error } = await supabase
            .from("bookings")
            .update(updateData)
            .eq("id", bookingId);

          if (error) {
            throw new Error(error.message);
          }

          success("Booking status updated successfully");
        }
      } catch (error) {
        console.error("Error updating booking:", error);
        showError(
          `Error updating booking status: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
        // Revert optimistic update on error
        fetchBookings(true);
      }
    },
    [setBookings, fetchBookings, success, showError],
  );

  // Helper to close the detail modal (same logic as original closeModal)
  const closeDetailModal = useCallback(() => {
    setShowModal(false);
    setSelectedBooking(null);
    setShowCancelModal(false);
    setAdminCancellationReason("");
    setShowConfirmCancel(false);
    setShouldRefund(false);
    setIsProcessing(false);
    setPaymentSummary(null);
    setPaymentHistory([]);
    setShowRescheduleModal(false);
    setRescheduleCheckIn("");
    setRescheduleCheckOut("");
    setRescheduleReason("");
    setRescheduleLoading(false);
  }, [
    setShowModal,
    setSelectedBooking,
    setShowCancelModal,
    setAdminCancellationReason,
    setShowConfirmCancel,
    setShouldRefund,
    setIsProcessing,
    setPaymentSummary,
    setPaymentHistory,
    setShowRescheduleModal,
    setRescheduleCheckIn,
    setRescheduleCheckOut,
    setRescheduleReason,
    setRescheduleLoading,
  ]);

  const handleAdminCancelBooking = useCallback(
    async (bookingId: number, shouldRefundParam: boolean = false) => {
      if (!adminCancellationReason.trim()) {
        warning("Please provide a reason for cancellation");
        return;
      }

      if (!showConfirmCancel) {
        setShowConfirmCancel(true);
        return;
      }

      setIsProcessing(true);
      try {
        let refundResponse = null;
        const booking = bookings.find((b) => b.id === bookingId);

        if (
          shouldRefundParam &&
          booking?.payment_status === PAYMENT_STATUS.PAID &&
          booking?.payment_intent_id
        ) {
          try {
            const refundApiResponse = await fetch(
              "/api/paymongo/process-refund",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  bookingId: booking.id,
                  reason:
                    adminCancellationReason || "Cancelled by administrator",
                  refundType: "full",
                  processedBy: "admin",
                }),
              },
            );

            if (refundApiResponse.ok) {
              refundResponse = await refundApiResponse.json();
            } else {
              const refundErrorText = await refundApiResponse.text();
              console.error("Refund processing failed:", refundErrorText);

              try {
                const refundErrorData = JSON.parse(refundErrorText);

                if (refundErrorData.requires_manual_processing) {
                  const { refund_amount, max_amount } = refundErrorData;
                  warning(
                    `PayMongo Test Mode Limit`,
                    `Booking amount: ${refund_amount.toLocaleString()} exceeds PayMongo TEST MODE limit of ${max_amount.toLocaleString()}. For 9K-12K bookings, switch to LIVE MODE or process refund manually. This limit only applies to test mode.`,
                  );
                } else if (
                  refundErrorData.error &&
                  refundErrorData.error.includes("payment_id")
                ) {
                  warning(
                    "Payment Processing Error",
                    "Unable to process automatic refund. Please handle the refund manually through PayMongo dashboard.",
                  );
                } else {
                  warning(
                    "Refund Failed",
                    "Booking will be cancelled but automatic refund failed. Please process the refund manually.",
                  );
                }
              } catch {
                warning(
                  "Refund Failed",
                  "Booking will be cancelled but automatic refund failed. Please process the refund manually.",
                );
              }
            }
          } catch (refundError) {
            console.error("Refund API error:", refundError);
            warning(
              "Booking will be cancelled but refund failed. Please process manually.",
            );
          }
        }

        const refundAmount = shouldRefundParam
          ? paymentSummary?.totalPaid || 0
          : 0;

        const { getFreshSession } = await import("../utils/apiTimeout");
        const session = await getFreshSession(supabase);
        if (!session?.access_token) {
          showError("Authentication required. Please log in again.");
          setIsProcessing(false);
          return;
        }

        const response = await fetch("/api/admin/cancel-booking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            bookingId,
            refundProcessed: shouldRefundParam,
            refundAmount: refundAmount,
            cancellationReason: adminCancellationReason,
          }),
        });

        const result = await response.json();

        if (result.success) {
          const message =
            result.message ||
            (shouldRefundParam
              ? `Booking cancelled and ${refundAmount.toLocaleString()} refund marked for processing. User notified.`
              : "Booking cancelled and user notified.");
          success(message);
          fetchBookings();
          closeDetailModal();
        } else {
          throw new Error(result.error || "Failed to cancel booking");
        }
      } catch (error) {
        console.error("Error:", error);
        showError(
          `Error cancelling booking: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [
      adminCancellationReason,
      showConfirmCancel,
      setShowConfirmCancel,
      setIsProcessing,
      bookings,
      paymentSummary,
      fetchBookings,
      closeDetailModal,
      success,
      showError,
      warning,
    ],
  );

  const handleAdminReschedule = useCallback(async () => {
    if (!selectedBooking || !rescheduleCheckIn || !rescheduleCheckOut) {
      warning("Please select both check-in and check-out dates");
      return;
    }

    const curIn = new Date(selectedBooking.check_in_date).toDateString();
    const curOut = new Date(selectedBooking.check_out_date).toDateString();
    if (
      new Date(rescheduleCheckIn).toDateString() === curIn &&
      new Date(rescheduleCheckOut).toDateString() === curOut
    ) {
      warning("New dates are the same as current dates");
      return;
    }

    setRescheduleLoading(true);
    try {
      const { getFreshSession } = await import("../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        showError("Authentication required. Please log in again.");
        setRescheduleLoading(false);
        return;
      }

      const response = await fetch("/api/admin/reschedule-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          newCheckIn: rescheduleCheckIn,
          newCheckOut: rescheduleCheckOut,
          adminId: session.user?.id || "admin",
          reason: rescheduleReason || "Rescheduled by admin",
        }),
      });

      const result = await response.json();

      if (result.success) {
        const pricingInfo = result.pricing;
        const msg = pricingInfo
          ? `Booking rescheduled! New amount: ${pricingInfo.newAmount.toLocaleString()} (${pricingInfo.nightsCount} night${pricingInfo.nightsCount > 1 ? "s" : ""})`
          : "Booking rescheduled successfully!";
        success(msg);
        fetchBookings();
        closeDetailModal();
      } else {
        showError(result.error || "Failed to reschedule booking");
      }
    } catch (error) {
      console.error("Reschedule error:", error);
      showError("Network error — please try again");
    } finally {
      setRescheduleLoading(false);
    }
  }, [
    selectedBooking,
    rescheduleCheckIn,
    rescheduleCheckOut,
    rescheduleReason,
    setRescheduleLoading,
    fetchBookings,
    closeDetailModal,
    success,
    showError,
    warning,
  ]);

  const handlePaymentProofAction = useCallback(
    async (action: "approve" | "reject", proofId: number) => {
      if (paymentProofLoading) {
        return;
      }

      setPaymentProofLoading(true);

      try {
        // Use authenticated admin's session for payment proof actions
      const { data: { session: adminSession } } = await supabase.auth.getSession();
      const user = {
          id: adminSession?.user?.id || "unknown",
          email: adminSession?.user?.email || "unknown",
        };

        const { data: existingProof, error: fetchError } = await supabase
          .from("payment_proofs")
          .select("*")
          .eq("id", proofId)
          .single();

        if (fetchError) {
          console.error("Failed to fetch payment proof:", fetchError);
          throw new Error(`Payment proof not found: ${fetchError.message}`);
        }

        if (!existingProof) {
          console.error("No payment proof found with ID:", proofId);
          throw new Error("Payment proof not found");
        }

        const { withTimeout } = await import("../utils/apiTimeout");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const { getFreshSession } = await import("../utils/apiTimeout");
        const session = await getFreshSession(supabase);
        if (!session?.access_token) {
          throw new Error("Authentication required. Please log in again.");
        }

        const response = await withTimeout(
          fetch("/api/admin/verify-payment-proof", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              proofId: proofId,
              action: action,
              adminId: user.id,
              adminNotes: verificationNotes || null,
              rejectionReason:
                action === "reject"
                  ? rejectionReason === "custom"
                    ? customRejectionReason
                    : rejectionReasons.find((r) => r.value === rejectionReason)
                        ?.label || null
                  : null,
            }),
            signal: controller.signal,
          }),
          15000,
          "Payment proof verification timed out",
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        success(
          action === "approve"
            ? "Payment proof approved successfully!"
            : "Payment proof rejected successfully!",
        );

        setRefreshTrigger((prev) => prev + 1);

        if (existingProof?.booking_id) {
          await fetchPaymentHistory(existingProof.booking_id);
        }

        setShowPaymentProofModal(false);
        setSelectedPaymentProof(null);
        setVerificationNotes("");
        setRejectionReason("");
        setCustomRejectionReason("");

        try {
          await fetchBookings(true);
          setTimeout(() => setRefreshTrigger((prev) => prev + 1), 500);
        } catch (refreshError) {
          console.warn("Bookings refresh failed, will retry:", refreshError);
          setTimeout(async () => {
            try {
              await fetchBookings(true);
              setRefreshTrigger((prev) => prev + 1);
            } catch (retryError) {
              console.error("Bookings refresh failed on retry:", retryError);
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Error in handlePaymentProofAction:", error);

        let errorMessage = "Unknown error occurred";

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            errorMessage =
              "Request timed out. Please check your connection and try again.";
          } else {
            errorMessage = error.message;
          }
        }

        showError(
          `Error updating payment proof: ${errorMessage}. Please try again.`,
        );
      } finally {
        setPaymentProofLoading(false);
      }
    },
    [
      paymentProofLoading,
      setPaymentProofLoading,
      verificationNotes,
      rejectionReason,
      customRejectionReason,
      rejectionReasons,
      setShowPaymentProofModal,
      setSelectedPaymentProof,
      setVerificationNotes,
      setRejectionReason,
      setCustomRejectionReason,
      setRefreshTrigger,
      fetchPaymentHistory,
      fetchBookings,
      success,
      showError,
    ],
  );

  return {
    updateBookingStatus,
    handleAdminCancelBooking,
    handleAdminReschedule,
    handlePaymentProofAction,
    formatDate,
    getStatusColor,
  };
}
