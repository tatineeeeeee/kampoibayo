"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import type { Booking, PaymentProof } from "../../../lib/types";
import { BOOKING_STATUS, PAYMENT_STATUS } from "../../../lib/constants/booking";

// Smart booking workflow status that considers both booking and payment proof
export function getSmartWorkflowStatus(
  booking: Booking,
  paymentProof?: PaymentProof | null,
) {
  const bookingStatus = booking.status || BOOKING_STATUS.PENDING;
  const paymentStatus = booking.payment_status || PAYMENT_STATUS.PENDING;
  const proofStatus = paymentProof?.status || null;

  // ✅ CRITICAL FIX: Handle ALL cancellations FIRST - these should block any payment review actions
  if (bookingStatus === BOOKING_STATUS.CANCELLED) {
    // Handle USER cancellations
    if (booking.cancelled_by === "user") {
      return {
        step: "user_cancelled",
        priority: 0,
        badge: "bg-muted text-foreground",
        text: "Cancelled",
        description: "Booking cancelled by user",
        actionNeeded: "None - booking cancelled by user",
      };
    }
    // Handle ADMIN cancellations
    else if (booking.cancelled_by === "admin") {
      return {
        step: "admin_cancelled",
        priority: 0,
        badge: "bg-destructive/10 text-destructive",
        text: "Admin Cancelled",
        description: "Booking cancelled by administrator",
        actionNeeded: "None - booking cancelled by admin",
      };
    }
    // Handle any other cancellations (fallback)
    else {
      return {
        step: "cancelled",
        priority: 0,
        badge: "bg-muted text-foreground",
        text: "Cancelled",
        description: "Booking has been cancelled",
        actionNeeded: "None - booking cancelled",
      };
    }
  }

  // Handle active booking payment workflow
  if (
    bookingStatus === BOOKING_STATUS.PENDING ||
    bookingStatus === "pending_verification" ||
    paymentStatus === PAYMENT_STATUS.PAYMENT_REVIEW ||
    paymentStatus === PAYMENT_STATUS.REJECTED
  ) {
    // PRIORITY: Check if payment is under review (payment proof uploaded and pending) - THIS SHOULD BE FIRST
    if (paymentStatus === PAYMENT_STATUS.PAYMENT_REVIEW || proofStatus === "pending") {
      return {
        step: "payment_review",
        priority: 5,
        badge: "bg-warning/10 text-warning",
        text: "Under Review",
        description: "Payment proof uploaded, admin review needed",
        actionNeeded: "Review payment proof immediately",
      };
    }
    // Check if payment proof was rejected BY ADMIN - only if no pending proof exists
    else if (proofStatus === "rejected" || paymentStatus === PAYMENT_STATUS.REJECTED) {
      return {
        step: "payment_rejected",
        priority: 6,
        badge: "bg-destructive/10 text-destructive",
        text: "Rejected",
        description: "Payment proof was rejected by admin",
        actionNeeded:
          "User needs to upload new payment proof or booking should be cancelled",
      };
    } else if (proofStatus === "verified") {
      return {
        step: "ready_to_confirm",
        priority: 3,
        badge: "bg-info/10 text-info",
        text: "Ready to Confirm",
        description: "Payment verified, booking can now be confirmed",
        actionNeeded: "Click Confirm button to finalize booking",
      };
    } else if (!paymentProof) {
      return {
        step: "awaiting_payment",
        priority: 4,
        badge: "bg-warning/10 text-warning",
        text: "Awaiting Payment",
        description: "User needs to upload payment proof",
        actionNeeded: "Remind user to upload payment",
      };
    }
  } else if (bookingStatus === BOOKING_STATUS.CONFIRMED) {
    if (proofStatus === "verified") {
      return {
        step: "completed",
        priority: 1,
        badge: "bg-success/10 text-success",
        text: "Confirmed",
        description: "Payment verified and booking confirmed",
        actionNeeded: "Send check-in reminders",
      };
    } else if (proofStatus === "pending") {
      return {
        step: "confirmed_pending_payment",
        priority: 6,
        badge: "bg-warning/10 text-warning",
        text: "Pending Payment",
        description: "Booking confirmed but payment still under review",
        actionNeeded: "Verify payment proof to complete workflow",
      };
    } else if (paymentStatus === PAYMENT_STATUS.PAID || !paymentProof) {
      // Walk-in cash bookings or confirmed bookings with no proof needed
      return {
        step: "confirmed",
        priority: 1,
        badge: "bg-success/10 text-success",
        text: "Confirmed",
        description:
          paymentStatus === PAYMENT_STATUS.PAID
            ? "Booking confirmed and paid"
            : "Booking confirmed — awaiting payment",
        actionNeeded:
          paymentStatus === PAYMENT_STATUS.PAID
            ? "Send check-in reminders"
            : "Collect payment from guest",
      };
    }
  }

  // Standard states
  switch (bookingStatus) {
    case BOOKING_STATUS.COMPLETED:
      return {
        step: "completed",
        priority: 0,
        badge: "bg-chart-4/10 text-chart-4",
        text: "Completed",
        description: "User stay completed successfully",
        actionNeeded: "Request user review",
      };
    default:
      return {
        step: "unknown",
        priority: 2,
        badge: "bg-muted text-foreground",
        text: "Unknown",
        description: "Booking status needs clarification",
        actionNeeded: "Review and update status",
      };
  }
}

// Clean Workflow Status Component
export function SmartWorkflowStatusCell({
  booking,
  refreshKey,
}: {
  booking: Booking;
  refreshKey?: number;
}) {
  const [paymentProof, setPaymentProof] = useState<PaymentProof | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentProof = async () => {
      try {
        // Fetch ALL payment proofs and prioritize them correctly
        const { data, error } = await supabase
          .from("payment_proofs")
          .select("*")
          .eq("booking_id", booking.id)
          .order("uploaded_at", { ascending: false });

        if (error) {
          console.error(
            `❌ SmartWorkflowStatusCell: Error fetching payment proof for booking ${booking.id}:`,
            error,
          );
          throw error;
        }

        let selectedProof = null;

        if (data && data.length > 0) {
          // Priority: pending > verified > rejected > cancelled
          const pendingProof = data.find((proof) => proof.status === "pending");
          const verifiedProof = data.find(
            (proof) => proof.status === "verified",
          );
          const rejectedProof = data.find(
            (proof) => proof.status === "rejected",
          );
          const cancelledProof = data.find(
            (proof) => proof.status === "cancelled",
          );

          selectedProof =
            pendingProof ||
            verifiedProof ||
            rejectedProof ||
            cancelledProof ||
            data[0];
        }

        setPaymentProof(selectedProof);
      } catch (error) {
        console.error("Error fetching payment proof:", error);
        setPaymentProof(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentProof();

    // Set up real-time subscription for payment proof updates
    const subscription = supabase
      .channel(`workflow_payment_proof_${booking.id}_${refreshKey || 0}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_proofs",
          filter: `booking_id=eq.${booking.id}`,
        },
        () => {
          // Refresh payment proof data immediately when changes occur
          fetchPaymentProof();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [booking.id, booking.status, refreshKey]);

  if (loading) {
    return <span className="text-xs text-muted-foreground">Loading...</span>;
  }

  const workflowStatus = getSmartWorkflowStatus(booking, paymentProof);

  return (
    <div>
      <span
        className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${workflowStatus.badge}`}
      >
        {workflowStatus.text}
      </span>
    </div>
  );
}
