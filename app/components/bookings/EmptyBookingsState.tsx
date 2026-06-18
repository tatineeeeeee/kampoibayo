"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import { RESORT_PHONE, RESORT_PHONE_RAW } from "@/lib/constants/business";

interface EmptyBookingsStateProps {
  maintenanceActive: boolean;
}

export function EmptyBookingsState({ maintenanceActive }: EmptyBookingsStateProps) {
  return (
    <div className="bg-card rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:p-12 text-center">
      <div className="bg-muted p-3 sm:p-4 lg:p-6 rounded-full w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 lg:mb-6 flex items-center justify-center">
        <Calendar className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3 lg:mb-4">
        No bookings yet
      </h2>
      <p className="text-muted-foreground mb-4 sm:mb-6 lg:mb-8 max-w-md mx-auto text-xs sm:text-sm lg:text-base px-2">
        You haven&apos;t made any reservations yet. Start planning your perfect getaway at Kampo
        Ibayo!
      </p>
      <div className="space-y-2 sm:space-y-3 lg:space-y-4">
        {maintenanceActive ? (
          <div className="bg-muted-foreground text-muted-foreground px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 rounded-lg text-sm sm:text-base font-semibold cursor-not-allowed w-full sm:w-auto text-center">
            Booking Temporarily Disabled
          </div>
        ) : (
          <Link href="/book">
            <button className="bg-primary text-foreground px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-primary/90 transition w-full sm:w-auto">
              Make Your First Booking
            </button>
          </Link>
        )}
        {maintenanceActive && (
          <p className="text-muted-foreground text-xs sm:text-sm text-center">
            Resort is temporarily closed for maintenance. Call{" "}
            <a href={`tel:${RESORT_PHONE_RAW}`} className="text-warning hover:text-warning">
              {RESORT_PHONE}
            </a>{" "}
            for assistance.
          </p>
        )}
        <div className="text-center">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition text-xs sm:text-sm">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
