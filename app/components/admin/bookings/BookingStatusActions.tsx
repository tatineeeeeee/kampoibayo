"use client";

import { CalendarDays } from "lucide-react";
import { supabase } from "../../../supabaseClient";
import { SmartConfirmButton } from "./SmartConfirmButton";
import { PaymentProofButton } from "./PaymentProofButton";
import type { Booking, PaymentProof } from "../../../lib/types";
import { BOOKING_STATUS } from "../../../lib/constants/booking";

interface BookingStatusActionsProps {
  selectedBooking: Booking;
  refreshTrigger: number;
  onClose: () => void;
  onSetShowCancelModal: (show: boolean) => void;
  onSetShowRescheduleModal: (show: boolean) => void;
  onSetRescheduleCheckIn: (date: string) => void;
  onSetRescheduleCheckOut: (date: string) => void;
  onSetRescheduleReason: (reason: string) => void;
  onUpdateBookingStatus: (bookingId: number, status: string) => void;
  onViewPaymentProof: (proof: PaymentProof) => void;
  fetchPaymentHistory: (bookingId: number) => Promise<void>;
}

export function BookingStatusActions({
  selectedBooking,
  refreshTrigger,
  onClose,
  onSetShowCancelModal,
  onSetShowRescheduleModal,
  onSetRescheduleCheckIn,
  onSetRescheduleCheckOut,
  onSetRescheduleReason,
  onUpdateBookingStatus,
  onViewPaymentProof,
  fetchPaymentHistory,
}: BookingStatusActionsProps) {
  return (
    <div className="space-y-4">
      {/* Status Banner - Adapts based on booking status */}
      {selectedBooking.status === BOOKING_STATUS.CONFIRMED && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-success text-lg">●</span>
            <div>
              <span className="text-success font-semibold text-sm">
                Booking Confirmed
              </span>
              <span className="text-success text-xs ml-2">
                Check-in:{" "}
                {new Date(
                  selectedBooking.check_in_date,
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Section */}
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                selectedBooking.status === BOOKING_STATUS.CONFIRMED
                  ? "bg-success"
                  : "bg-warning"
              }`}
            ></span>
            {selectedBooking.status === BOOKING_STATUS.CONFIRMED
              ? "Payment Verified"
              : "Payment Verification"}
          </h4>
          <PaymentProofButton
            key={`modal-proof-${
              selectedBooking.id
            }-${refreshTrigger}-${
              selectedBooking.payment_status || "none"
            }`}
            bookingId={selectedBooking.id}
            booking={selectedBooking}
            variant="modal"
            onViewProof={async (proof) => {
              onViewPaymentProof(proof);
              if (proof.id > 0) {
                await fetchPaymentHistory(selectedBooking.id);
                try {
                  const { data: allProofs } = await supabase
                    .from("payment_proofs")
                    .select("*")
                    .eq("booking_id", selectedBooking.id)
                    .order("uploaded_at", { ascending: false });

                  if (allProofs && allProofs.length > 0) {
                    const pendingProof = allProofs.find(
                      (p) => p.status === "pending",
                    );
                    const verifiedProof = allProofs.find(
                      (p) => p.status === "verified",
                    );
                    const rejectedProof = allProofs.find(
                      (p) => p.status === "rejected",
                    );
                    const cancelledProof = allProofs.find(
                      (p) => p.status === "cancelled",
                    );
                    const prioritizedProof =
                      pendingProof ||
                      verifiedProof ||
                      rejectedProof ||
                      cancelledProof ||
                      allProofs[0];
                    onViewPaymentProof(prioritizedProof);
                  }
                } catch (error) {
                }
              }
            }}
            refreshKey={refreshTrigger}
          />
        </div>

        {/* Booking Management Section */}
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
            Booking Actions
          </h4>
          <div className="flex flex-col gap-2">
            {/* Only show Confirm button for pending bookings */}
            {selectedBooking.status === BOOKING_STATUS.PENDING && (
              <SmartConfirmButton
                booking={selectedBooking}
                variant="modal"
                refreshKey={refreshTrigger}
                onConfirm={(bookingId) => {
                  onUpdateBookingStatus(bookingId, BOOKING_STATUS.CONFIRMED);
                  onClose();
                }}
              />
            )}
            {/* Reschedule button */}
            <button
              onClick={() => {
                onSetShowRescheduleModal(true);
                onSetRescheduleCheckIn("");
                onSetRescheduleCheckOut("");
                onSetRescheduleReason("");
              }}
              className="w-full px-4 py-2 rounded-md text-sm font-semibold transition flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-muted border border-info/20"
            >
              <CalendarDays className="w-4 h-4" />
              Reschedule Booking
            </button>
            {/* Cancel button for all active bookings */}
            <button
              onClick={() => onSetShowCancelModal(true)}
              className={`w-full px-4 py-2 rounded-md text-sm font-semibold transition flex items-center justify-center gap-2 ${
                selectedBooking.status === BOOKING_STATUS.CONFIRMED
                  ? "bg-destructive/100 text-white hover:bg-destructive"
                  : "bg-muted text-destructive hover:bg-destructive/10 border border-destructive/20"
              }`}
            >
              Cancel Booking
            </button>
          </div>
        </div>
      </div>

      {/* Close Button */}
      <div className="flex justify-center pt-3 border-t border-border">
        <button
          onClick={onClose}
          className="px-8 py-2 bg-muted-foreground text-white rounded-md text-sm font-medium hover:bg-muted-foreground/90 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
