"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import type { Booking, PaymentProof } from "../../../lib/types";
import { PAYMENT_STATUS } from "../../../lib/constants/booking";

// Smart Confirm Button - Only allows confirmation after payment verification
export function SmartConfirmButton({
  booking,
  onConfirm,
  variant = "table",
  refreshKey,
}: {
  booking: Booking;
  onConfirm: (bookingId: number) => void;
  variant?: "table" | "modal";
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
            `❌ SmartConfirmButton: Error fetching payment proof for booking ${booking.id}:`,
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
        console.error(
          "SmartConfirmButton: Error fetching payment proof:",
          error,
        );
        setPaymentProof(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentProof();
  }, [booking.id, booking.payment_status, booking.status, refreshKey]);

  if (loading) {
    if (variant === "modal") {
      return (
        <button
          disabled
          className="w-full px-3 py-2 bg-muted text-muted-foreground rounded-md text-xs cursor-not-allowed text-center"
          title="Loading payment status..."
        >
          Loading...
        </button>
      );
    }

    return (
      <button
        disabled
        className="h-7 w-full px-2 py-1 bg-muted text-muted-foreground rounded text-xs cursor-not-allowed text-center flex items-center justify-center"
        title="Loading payment status..."
      >
        Loading...
      </button>
    );
  }

  // Can only confirm if: proof is verified AND booking payment is verified/paid (no outstanding balance)
  const bookingPaymentOk = booking.payment_status === "verified" || booking.payment_status === PAYMENT_STATUS.PAID;
  const canConfirm = paymentProof && paymentProof.status === "verified" && bookingPaymentOk;

  if (!canConfirm) {
    let reason, buttonText;

    if (!paymentProof) {
      reason = "Step 1: User must upload payment proof";
      buttonText = "Need Payment";
    } else if (paymentProof.status === "pending") {
      reason = "Step 2: Admin must verify payment first";
      buttonText = "Verify First";
    } else if (paymentProof.status === "rejected") {
      reason = "Payment was rejected - new proof needed";
      buttonText = "Rejected";
    } else {
      reason = "Payment verification required";
      buttonText = "Cannot Confirm";
    }

    if (variant === "modal") {
      return (
        <button
          disabled
          className="w-full px-3 py-2 bg-muted text-muted-foreground rounded-md text-xs cursor-not-allowed text-center"
          title={reason}
        >
          {buttonText}
        </button>
      );
    }

    return (
      <button
        disabled
        className="h-7 w-full px-2 py-1 bg-muted text-muted-foreground rounded text-xs cursor-not-allowed text-center flex items-center justify-center"
        title={reason}
      >
        {buttonText}
      </button>
    );
  }

  if (variant === "modal") {
    return (
      <button
        onClick={() => onConfirm(booking.id)}
        className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md text-xs hover:bg-primary/90 font-semibold text-center"
        title="Step 3: Confirm booking (payment verified)"
      >
        Confirm
      </button>
    );
  }

  return (
    <button
      onClick={() => onConfirm(booking.id)}
      className="h-6 w-full px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 text-center flex items-center justify-center"
      title="Step 3: Confirm booking (payment verified)"
    >
      Confirm
    </button>
  );
}
