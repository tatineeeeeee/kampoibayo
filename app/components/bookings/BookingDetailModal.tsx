"use client";

import React from "react";
import { Tables } from "../../../database.types";
import { BOOKING_STATUS, PAYMENT_STATUS } from "../../lib/constants/booking";
import { formatBookingNumber } from "../../utils/bookingNumber";
import { displayPhoneNumber } from "../../utils/phoneUtils";
import { PaymentBreakdownDetail } from "./PaymentBreakdown";
import {
  Calendar,
  Users,
  PhilippinePeso,
  Phone,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  HourglassIcon,
  AlertTriangle,
  PawPrint,
  MessageCircle,
  Ban,
} from "lucide-react";

type Booking = Tables<"bookings">;

interface BookingDetailModalProps {
  booking: Booking;
  showCancelSection: boolean;
  canCancelBooking: (booking: Booking) => boolean;
  getCancellationMessage: (booking: Booking) => string;
  cancellationReason: string;
  onCancellationReasonChange: (reason: string) => void;
  onCancelBooking: (bookingId: number) => void;
  onShowCancelSection: (show: boolean) => void;
  onClose: () => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  getStatusDisplayName: (status: string) => string;
}

export function BookingDetailModal({
  booking,
  showCancelSection,
  canCancelBooking,
  getCancellationMessage,
  cancellationReason,
  onCancellationReasonChange,
  onCancelBooking,
  onShowCancelSection,
  onClose,
  getStatusIcon,
  getStatusColor,
  getStatusDisplayName,
}: BookingDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-border/50">
        {/* Modal Header */}
        <div className="bg-primary/90 backdrop-blur-sm p-4 sm:p-6 rounded-t-2xl border-b border-border/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="bg-white/20 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
                  Booking Details
                </h2>
                <p className="text-foreground/90 text-xs sm:text-sm">
                  Your reservation information
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-foreground/80 hover:text-foreground text-xl sm:text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition flex-shrink-0"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 bg-card/90 backdrop-blur-sm">
          {/* Booking Info Section */}
          <div className="bg-muted/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 sm:mb-6 gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="bg-primary/90 backdrop-blur-sm p-1.5 sm:p-2 rounded-full flex-shrink-0">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                    {formatBookingNumber(booking.id)}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm truncate">
                    {booking.guest_name} &bull; {booking.guest_email || "No email"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {getStatusIcon(booking.status || BOOKING_STATUS.PENDING)}
                <span
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold text-foreground ${getStatusColor(
                    booking.status || BOOKING_STATUS.PENDING
                  )}`}
                >
                  {getStatusDisplayName(booking.status || BOOKING_STATUS.PENDING)}
                </span>
              </div>
            </div>

            {/* Dates and Guest Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Check-in Date</p>
                    <p className="font-semibold text-sm sm:text-base truncate">
                      {booking.check_in_date
                        ? new Date(booking.check_in_date).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Number of Guests</p>
                    <p className="font-semibold text-sm sm:text-base">
                      {booking.number_of_guests} guest(s)
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Check-out Date</p>
                    <p className="font-semibold text-sm sm:text-base truncate">
                      {booking.check_out_date
                        ? new Date(booking.check_out_date).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                  <PhilippinePeso className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {booking.payment_type === "full"
                        ? "Payment Required"
                        : "Down Payment (50%)"}
                    </p>
                    <p className="font-semibold text-success text-sm sm:text-base">
                      &peso;
                      {(
                        booking.payment_amount ||
                        (booking.payment_type === "full"
                          ? booking.total_amount
                          : booking.total_amount * 0.5)
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            {booking.guest_phone && (
              <div className="border-t border-border pt-3 sm:pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span>Phone:</span>
                  <a
                    href={`tel:${booking.guest_phone}`}
                    className="text-primary hover:text-primary/80 hover:underline font-medium"
                  >
                    {displayPhoneNumber(booking.guest_phone)}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Payment Information Section */}
          <div className="bg-gradient-to-br from-success/10 to-success/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-success/20">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="bg-success/90 backdrop-blur-sm p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <PhilippinePeso className="w-3 h-3 sm:w-4 sm:h-4 text-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                Payment Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-card/60 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-success/20">
                <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                <p className="font-bold text-lg text-success">
                  &peso;{booking.total_amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {booking.payment_type === "half" ? "50% Downpayment" : "Full Payment"}
                </p>
              </div>

              <div className="bg-card/60 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-success/20">
                <p className="text-xs text-muted-foreground mb-1">Payment Breakdown</p>
                <PaymentBreakdownDetail
                  bookingId={booking.id}
                  totalAmount={booking.total_amount}
                />
              </div>

              <div className="bg-card/60 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-primary/20/30 dark:border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
                <div className="flex items-center gap-2">
                  {booking.payment_status === PAYMENT_STATUS.PAID ||
                  booking.payment_status === "verified" ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0" />
                      <span className="text-sm font-medium text-success">Payment Verified</span>
                    </>
                  ) : booking.payment_status === PAYMENT_STATUS.PAYMENT_REVIEW ? (
                    <>
                      <HourglassIcon className="w-3 h-3 text-warning flex-shrink-0" />
                      <span className="text-sm font-medium text-warning">Under Review</span>
                    </>
                  ) : booking.payment_status === PAYMENT_STATUS.REJECTED ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0" />
                      <span className="text-sm font-medium text-destructive">
                        Payment Rejected
                      </span>
                    </>
                  ) : (
                    <>
                      <HourglassIcon className="w-3 h-3 text-warning flex-shrink-0" />
                      <span className="text-sm font-medium text-warning">Awaiting Payment</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Remaining Balance for half payment */}
            {booking.payment_type === "half" && (
              <div className="mt-3 sm:mt-4">
                <div className="bg-card/60 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-warning/20">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Remaining Balance</p>
                      <p className="font-semibold text-sm sm:text-base text-warning">
                        {(booking.total_amount * 0.5).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Due on check-in</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {booking.payment_type === "half" && (
              <div className="mt-4 p-3 bg-card/70 backdrop-blur-sm rounded-lg border border-primary/20/30 dark:border-border/30">
                <p className="text-xs sm:text-sm text-primary/80">
                  <strong>Payment Schedule:</strong> 50% paid as downpayment, remaining 50% due
                  upon check-in at the resort.
                </p>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-3 sm:space-y-4">
            {/* Special Requests */}
            {booking.special_requests &&
              (() => {
                const cleanedRequest = booking.special_requests
                  .replace(/\[USER-RESCHEDULED\][^\n]*/g, "")
                  .replace(/\[ADMIN-RESCHEDULED\][^\n]*/g, "")
                  .replace(/\[WALK-IN\]/g, "")
                  .trim();
                return cleanedRequest ? (
                  <div className="bg-primary/5/80 dark:bg-muted/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-primary/20/50 dark:border-border/50">
                    <h4 className="text-foreground font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      Special Requests
                    </h4>
                    <p className="text-muted-foreground text-xs sm:text-sm bg-muted/50 backdrop-blur-sm p-2 sm:p-3 rounded-lg break-words">
                      {cleanedRequest}
                    </p>
                  </div>
                ) : null;
              })()}

            {/* Pet Information */}
            {booking.brings_pet !== null && (
              <div className="bg-success/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-success/20">
                <h4 className="text-foreground font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
                  <PawPrint className="w-4 h-4 text-warning" />
                  Pet Policy
                </h4>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {booking.brings_pet ? (
                    <span className="text-success flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Pet-friendly booking
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> No pets for this booking
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Booking Timeline */}
            <div className="bg-muted rounded-lg p-3 sm:p-4">
              <h4 className="text-foreground font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                Booking Timeline
              </h4>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  <span className="text-muted-foreground">Created:</span>{" "}
                  {booking.created_at
                    ? new Date(booking.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
                {booking.status?.toLowerCase() === BOOKING_STATUS.CANCELLED && booking.cancelled_by && (
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="text-destructive text-xs sm:text-sm font-medium flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Cancelled by{" "}
                      {booking.cancelled_by === "user" ? "Guest" : "Admin"}
                    </p>
                    {booking.cancelled_at && (
                      <p className="text-muted-foreground text-xs">
                        <span className="text-muted-foreground">When:</span>{" "}
                        {new Date(booking.cancelled_at).toLocaleDateString()} at{" "}
                        {new Date(booking.cancelled_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    )}
                    {booking.cancellation_reason && (
                      <p className="text-muted-foreground text-xs break-words">
                        <span className="text-muted-foreground">Reason:</span>{" "}
                        {booking.cancellation_reason}
                      </p>
                    )}
                    {booking.refund_amount && booking.refund_amount > 0 && (
                      <div className="mt-2 p-2 bg-success/10 border border-success/20 rounded-lg">
                        <p className="text-success text-xs font-medium flex items-center gap-1">
                          Refund: &peso;{booking.refund_amount.toLocaleString()}
                        </p>
                        <p className="text-success/70 text-xs mt-1">
                          Status:{" "}
                          {booking.refund_status === "completed"
                            ? "Completed"
                            : booking.refund_status === "pending"
                              ? "Processing (via GCash/Maya)"
                              : booking.refund_status || "Pending"}
                        </p>
                        {booking.refund_processed_at && (
                          <p className="text-success/60 text-xs">
                            Processed:{" "}
                            {new Date(booking.refund_processed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-muted/80 backdrop-blur-sm p-4 sm:p-6 rounded-b-2xl border-t border-border/50">
          {canCancelBooking(booking) && !showCancelSection ? (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <button
                onClick={() => onShowCancelSection(true)}
                className="bg-destructive text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-destructive/90 transition order-2 sm:order-1"
                title={getCancellationMessage(booking)}
              >
                Cancel Booking
              </button>
              <button
                onClick={onClose}
                className="bg-muted-foreground text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted transition order-1 sm:order-2"
              >
                Close
              </button>
            </div>
          ) : showCancelSection ? (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="text-foreground font-medium mb-2 text-sm sm:text-base">
                  Why are you cancelling this booking?
                </h4>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => onCancellationReasonChange(e.target.value)}
                  placeholder="Please provide a reason for cancellation (required)"
                  className="w-full p-3 rounded-lg bg-muted-foreground text-foreground placeholder:text-muted-foreground border border-border focus:border-destructive focus:outline-none resize-none text-sm"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-muted-foreground text-xs mt-1">
                  {cancellationReason.length}/200 characters
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                <button
                  onClick={() => onCancelBooking(booking.id)}
                  disabled={!cancellationReason.trim()}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition order-2 sm:order-1 ${
                    cancellationReason.trim()
                      ? "bg-destructive text-foreground hover:bg-destructive/90"
                      : "bg-muted-foreground text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  Confirm Cancellation
                </button>
                <button
                  onClick={() => {
                    onShowCancelSection(false);
                    onCancellationReasonChange("");
                  }}
                  className="bg-muted-foreground text-foreground py-2 px-4 rounded-lg text-sm font-semibold hover:bg-muted transition order-1 sm:order-2"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              {!canCancelBooking(booking) &&
                booking.status?.toLowerCase() !== BOOKING_STATUS.CANCELLED && (
                  <button
                    disabled
                    className="bg-muted-foreground text-muted-foreground px-4 py-2 rounded-lg text-sm font-semibold cursor-not-allowed"
                    title={getCancellationMessage(booking)}
                  >
                    Cannot Cancel
                  </button>
                )}
              <button
                onClick={onClose}
                className="bg-muted-foreground text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted transition flex-1"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
