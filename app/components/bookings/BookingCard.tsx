"use client";

import React from "react";
import Link from "next/link";
import { Tables } from "../../../database.types";
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  MAX_RESCHEDULES_PER_BOOKING,
} from "../../lib/constants/booking";
import { formatBookingNumber } from "../../utils/bookingNumber";
import { displayPhoneNumber } from "../../utils/phoneUtils";
import {
  shouldShowExpirationWarning,
  getExpirationWarningMessage,
  getDaysPending,
} from "../../utils/bookingUtils";
import { ReceiptManager } from "../ReceiptManager";
import { PaymentProofUploadButton } from "./PaymentProofUploadButton";
import { UserPaymentProofStatus } from "./UserPaymentProofStatus";
import { PaymentBreakdownAmount } from "./PaymentBreakdown";
import {
  Calendar,
  Users,
  PhilippinePeso,
  Phone,
  AlertTriangle,
  Ban,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

type Booking = Tables<"bookings">;

interface BookingCardProps {
  booking: Booking;
  user: User | null;
  refreshTrigger: number;
  bookingsWithPendingProofs: Set<number>;
  onViewDetails: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
  onReschedule: (booking: Booking) => void;
  canCancelBooking: (booking: Booking) => boolean;
  canRescheduleBooking: (booking: Booking) => boolean;
  getCancellationMessage: (booking: Booking) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  getStatusDisplayName: (status: string) => string;
}

export function BookingCard({
  booking,
  user,
  refreshTrigger,
  bookingsWithPendingProofs,
  onViewDetails,
  onCancel,
  onReschedule,
  canCancelBooking,
  canRescheduleBooking,
  getCancellationMessage,
  getStatusIcon,
  getStatusColor,
  getStatusDisplayName,
}: BookingCardProps) {
  return (
    <div className="bg-muted rounded-lg p-3 sm:p-4 lg:p-6 hover:bg-muted transition border border-border/50">
      {/* Header Section */}
      <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="bg-primary p-1.5 sm:p-2 rounded-full flex-shrink-0">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground truncate">
                {formatBookingNumber(booking.id)}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {getStatusIcon(booking.status || BOOKING_STATUS.PENDING)}
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold text-foreground ${getStatusColor(
                booking.status || BOOKING_STATUS.PENDING
              )}`}
            >
              {getStatusDisplayName(booking.status || BOOKING_STATUS.PENDING)}
            </span>
          </div>
        </div>
        <div className="px-2 sm:px-3">
          <p className="text-muted-foreground text-xs sm:text-sm">
            {booking.guest_name} &bull; {booking.guest_email || "No email"}
          </p>
        </div>
      </div>

      {/* Expiration Warning */}
      {shouldShowExpirationWarning(booking.created_at, booking.status || BOOKING_STATUS.PENDING) && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-warning flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-warning text-xs sm:text-sm font-medium">
                {getExpirationWarningMessage(booking.created_at)}
              </p>
              <p className="text-warning text-xs mt-1">
                Pending for {getDaysPending(booking.created_at)} day(s). Contact admin or complete
                payment to confirm.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 text-muted-foreground p-2 bg-muted/30 rounded">
          <Calendar className="w-3 h-3 text-primary flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Check-in</p>
            <p className="font-semibold text-xs truncate">
              {booking.check_in_date
                ? new Date(booking.check_in_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground p-2 bg-muted/30 rounded">
          <Calendar className="w-3 h-3 text-primary flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Check-out</p>
            <p className="font-semibold text-xs truncate">
              {booking.check_out_date
                ? new Date(booking.check_out_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground p-2 bg-muted/30 rounded">
          <Users className="w-3 h-3 text-primary flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Guests</p>
            <p className="font-semibold text-xs">{booking.number_of_guests} guest(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground p-2 bg-muted/30 rounded">
          <PhilippinePeso className="w-3 h-3 text-primary flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {booking.payment_status === PAYMENT_STATUS.PAID || booking.payment_status === "verified"
                ? booking.payment_type === "half"
                  ? "50% Down"
                  : "Paid"
                : booking.payment_status === PAYMENT_STATUS.PAYMENT_REVIEW
                  ? "Under Review"
                  : booking.payment_type === "half"
                    ? "50% Down"
                    : "Total"}
            </p>
            <PaymentBreakdownAmount
              bookingId={booking.id}
              totalAmount={booking.total_amount}
              paymentStatus={booking.payment_status ?? undefined}
              paymentType={booking.payment_type ?? undefined}
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      {booking.guest_phone && (
        <div className="mb-3 sm:mb-4 p-2 bg-muted/30 rounded">
          <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1">
            <Phone className="w-3 h-3 text-muted-foreground" />
            Contact:{" "}
            <a
              href={`tel:${booking.guest_phone}`}
              className="text-primary hover:text-primary/80 hover:underline font-medium"
            >
              {displayPhoneNumber(booking.guest_phone)}
            </a>
          </p>
        </div>
      )}

      {/* Special Requests */}
      {booking.special_requests &&
        (() => {
          const cleanedRequest = booking.special_requests
            .replace(/\[USER-RESCHEDULED\][^\n]*/g, "")
            .replace(/\[ADMIN-RESCHEDULED\][^\n]*/g, "")
            .replace(/\[WALK-IN\]/g, "")
            .trim();
          return cleanedRequest ? (
            <div className="bg-muted/50 p-2 sm:p-3 rounded-lg mb-3 sm:mb-4">
              <p className="text-xs text-muted-foreground mb-1">Special Request:</p>
              <p className="text-foreground text-xs sm:text-sm">{cleanedRequest}</p>
            </div>
          ) : null;
        })()}

      {/* Payment Proof Status */}
      {booking.status === BOOKING_STATUS.PENDING && (
        <UserPaymentProofStatus
          key={`payment-status-${booking.id}-${refreshTrigger}`}
          bookingId={booking.id}
        />
      )}

      {/* Actions Section */}
      <div className="flex flex-col gap-2 sm:gap-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : "N/A"}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
          <button
            onClick={() => onViewDetails(booking)}
            className="bg-muted-foreground hover:bg-muted text-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1 min-h-[44px] touch-manipulation"
          >
            Details
          </button>

          {/* Receipt Button */}
          {booking.status === BOOKING_STATUS.CONFIRMED && (
            <ReceiptManager
              booking={booking}
              userEmail={user?.email || ""}
              userName={
                user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest"
              }
              hasVerifiedPayment={true}
              key={`receipt-${booking.id}-${booking.updated_at || booking.created_at}`}
            />
          )}

          {/* Upload Payment Proof Button */}
          {(booking.status === BOOKING_STATUS.PENDING || booking.payment_status === PAYMENT_STATUS.PENDING) && (
            <PaymentProofUploadButton
              key={`upload-button-${booking.id}-${refreshTrigger}`}
              bookingId={booking.id}
              bookingPaymentStatus={booking.payment_status ?? undefined}
            />
          )}

          {/* Reschedule Button */}
          {canRescheduleBooking(booking) ? (
            <button
              onClick={() => onReschedule(booking)}
              className="bg-warning hover:bg-warning/90 text-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1 min-h-[44px] touch-manipulation"
            >
              <Calendar className="w-3 h-3" />
              Resched{" "}
              {(booking.reschedule_count || 0) > 0 && (
                <span className="text-warning text-[10px]">({booking.reschedule_count}/{MAX_RESCHEDULES_PER_BOOKING})</span>
              )}
            </button>
          ) : (
            canCancelBooking(booking) && (
              <button
                disabled
                className="bg-muted-foreground text-muted-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-1 min-h-[44px]"
              >
                <Calendar className="w-3 h-3" />
                {bookingsWithPendingProofs.has(booking.id)
                  ? "Under Review"
                  : (booking.reschedule_count || 0) >= MAX_RESCHEDULES_PER_BOOKING
                    ? `Resched (${MAX_RESCHEDULES_PER_BOOKING}/${MAX_RESCHEDULES_PER_BOOKING})`
                    : "Resched"}
              </button>
            )
          )}

          {/* Cancel Button */}
          {canCancelBooking(booking) ? (
            <button
              onClick={() => onCancel(booking)}
              className="bg-destructive hover:bg-destructive/90 text-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1 min-h-[44px] touch-manipulation"
              title={getCancellationMessage(booking)}
            >
              Cancel
            </button>
          ) : (
            booking.status?.toLowerCase() !== BOOKING_STATUS.CANCELLED && (
              <button
                disabled
                className="bg-muted-foreground text-muted-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-1 min-h-[44px]"
                title={getCancellationMessage(booking)}
              >
                <Ban className="w-3 h-3" />
                Locked
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
