"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import type { Booking, PaymentProof } from "../../../lib/types";
import { BOOKING_STATUS, PAYMENT_STATUS } from "../../../lib/constants/booking";

// Payment Status Cell - Shows overall booking payment status
export function PaymentStatusCell({
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
        setLoading(true);

        // Fetch ALL payment proofs and prioritize them correctly
        const { data, error } = await supabase
          .from("payment_proofs")
          .select("*")
          .eq("booking_id", booking.id)
          .order("uploaded_at", { ascending: false });

        if (error) {
          console.error(
            `❌ PaymentStatusCell: Error fetching payment proof for booking ${booking.id}:`,
            error,
          );
          throw error;
        }

        let selectedProof = null;

        if (data && data.length > 0) {
          // Only pending proofs need priority (admin action needed NOW)
          // Otherwise use the most recent proof (already sorted by uploaded_at DESC)
          const pendingProof = data.find((proof) => proof.status === "pending");
          selectedProof = pendingProof || data[0];
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

    // Enhanced real-time subscription with multiple event triggers
    const subscription = supabase
      .channel(`payment_status_realtime_${booking.id}_${refreshKey || 0}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_proofs",
          filter: `booking_id=eq.${booking.id}`,
        },
        (payload) => {
          // Force immediate refresh on any payment proof change
          setTimeout(() => fetchPaymentProof(), 10); // Very short delay for database consistency
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [booking.id, booking.payment_status, booking.status, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <span className="text-xs text-muted-foreground">...</span>
      </div>
    );
  }

  // Determine the overall payment status based on booking status and payment proof
  const getPaymentStatusDisplay = () => {
    // ✅ CRITICAL FIX: If booking is cancelled, always show cancelled regardless of payment proof status
    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return {
        text: "Cancelled",
        badge: "bg-muted-foreground text-white",
      };
    }

    // If there's a payment proof, use its status (only for non-cancelled bookings)
    if (paymentProof) {
      switch (paymentProof.status) {
        case "pending":
          return {
            text: "Under Review",
            badge: "bg-warning text-white",
          };
        case "verified":
          return {
            text: "Verified",
            badge: "bg-success text-white",
          };
        case "rejected":
          return {
            text: "Rejected",
            badge: "bg-destructive text-white",
          };
        case "cancelled":
          return {
            text: "Cancelled",
            badge: "bg-muted-foreground text-white",
          };
        default:
          return {
            text: "Unknown Status",
            badge: "bg-muted-foreground text-white",
          };
      }
    }

    // If no payment proof exists, check booking payment_status
    if (booking.payment_status === PAYMENT_STATUS.PAYMENT_REVIEW) {
      return {
        text: "Under Review",
        badge: "bg-warning text-white",
      };
    } else if (booking.payment_status === PAYMENT_STATUS.REJECTED) {
      return {
        text: "Rejected",
        badge: "bg-destructive text-white",
      };
    } else if (booking.payment_status === PAYMENT_STATUS.PAID) {
      return {
        text: "Verified",
        badge: "bg-success text-white",
      };
    } else {
      return {
        text: "Awaiting Payment",
        badge: "bg-muted-foreground text-white",
      };
    }
  };

  const statusInfo = getPaymentStatusDisplay();

  return (
    <div className="flex items-center justify-center">
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusInfo.badge}`}
      >
        {statusInfo.text}
      </span>
    </div>
  );
}
