"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useToastHelpers } from "../components/Toast";
import {
  validatePhilippinePhone,
  cleanPhoneForDatabase,
} from "../utils/phoneUtils";
import {
  BASE_RATE_WEEKDAY,
  BASE_RATE_WEEKEND,
  EXTRA_GUEST_FEE,
  INCLUDED_GUESTS,
  MAX_GUESTS,
  PHILIPPINE_HOLIDAYS,
} from "../lib/constants/pricing";
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_TYPE,
} from "../lib/constants/booking";
import { USER_ROLE } from "../lib/constants/roles";

export function useWalkInBooking() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();
  const { success, error: showError } = useToastHelpers();

  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState(String(INCLUDED_GUESTS));
  const [bringsPet, setBringsPet] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");

  // Date selection state
  const [selectedCheckIn, setSelectedCheckIn] = useState("");
  const [selectedCheckOut, setSelectedCheckOut] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Today's date as YYYY-MM-DD string for calendar minDate (block past dates)
  const todayString = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  // Auth guard
  useEffect(() => {
    if (
      !authLoading &&
      (!user || (userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.STAFF))
    ) {
      router.replace("/admin");
    }
  }, [user, userRole, authLoading, router]);

  const holidays = PHILIPPINE_HOLIDAYS;

  // Calculate price for multi-day bookings with per-day rates
  const calculateMultiDayPrice = useCallback(
    (checkIn: string, checkOut: string, guestCount: number = INCLUDED_GUESTS) => {
      const checkInDate = new Date(checkIn + "T00:00:00");
      const checkOutDate = new Date(checkOut + "T00:00:00");

      const nights: {
        date: Date;
        rate: number;
        isWeekend: boolean;
        dayName: string;
      }[] = [];
      const current = new Date(checkInDate);

      while (current < checkOutDate) {
        const day = current.getDay();
        const dateString = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
        const isHoliday = (holidays as readonly string[]).includes(dateString);
        const isWeekend = day === 0 || day === 5 || day === 6;
        const nightRate = isWeekend || isHoliday ? BASE_RATE_WEEKEND : BASE_RATE_WEEKDAY;

        nights.push({
          date: new Date(current),
          rate: nightRate,
          isWeekend: isWeekend || isHoliday,
          dayName: current.toLocaleDateString("en-US", { weekday: "short" }),
        });

        current.setDate(current.getDate() + 1);
      }

      const totalBaseRate = nights.reduce((sum, night) => sum + night.rate, 0);
      const totalNights = nights.length;
      const excessGuestFee =
        guestCount > INCLUDED_GUESTS ? (guestCount - INCLUDED_GUESTS) * EXTRA_GUEST_FEE * totalNights : 0;

      return {
        nights,
        totalNights,
        totalBaseRate,
        excessGuestFee,
        totalAmount: totalBaseRate + excessGuestFee,
        breakdown: {
          weekdayNights: nights.filter((n) => !n.isWeekend).length,
          weekendNights: nights.filter((n) => n.isWeekend).length,
          weekdayTotal: nights.filter((n) => !n.isWeekend).length * BASE_RATE_WEEKDAY,
          weekendTotal: nights.filter((n) => n.isWeekend).length * BASE_RATE_WEEKEND,
        },
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Handle date selection from calendar
  const handleDateSelect = (checkIn: string, checkOut: string) => {
    setSelectedCheckIn(checkIn);
    setSelectedCheckOut(checkOut);
  };

  // Compute pricing
  const pricing =
    selectedCheckIn && selectedCheckOut
      ? calculateMultiDayPrice(
          selectedCheckIn,
          selectedCheckOut,
          parseInt(numberOfGuests) || INCLUDED_GUESTS,
        )
      : null;

  const totalAmount = pricing?.totalAmount || 0;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Auth check
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        showError(
          "Authentication Error",
          "You must be logged in to create a booking.",
        );
        setIsSubmitting(false);
        return;
      }

      // Validate required fields
      if (!guestName.trim()) {
        showError("Missing Information", "Guest name is required.");
        setIsSubmitting(false);
        return;
      }

      // Validate email format if provided
      if (guestEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(guestEmail.trim())) {
          showError(
            "Invalid Email",
            "Please enter a valid email address (e.g. name@example.com).",
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Validate Philippine phone number if provided
      if (guestPhone.trim()) {
        if (!validatePhilippinePhone(guestPhone.trim())) {
          showError(
            "Invalid Phone Number",
            "Please enter a valid Philippine mobile number (e.g. 09171234567 or +639171234567).",
          );
          setIsSubmitting(false);
          return;
        }
      }

      if (!selectedCheckIn || !selectedCheckOut) {
        showError(
          "Missing Dates",
          "Please select both check-in and check-out dates on the calendar.",
        );
        setIsSubmitting(false);
        return;
      }

      const guestCount = parseInt(numberOfGuests) || INCLUDED_GUESTS;
      if (guestCount < 1 || guestCount > MAX_GUESTS) {
        showError("Invalid Guests", `Guest count must be between 1 and ${MAX_GUESTS}.`);
        setIsSubmitting(false);
        return;
      }

      // Validate dates
      const checkInDate = new Date(selectedCheckIn + "T00:00:00");
      const checkOutDate = new Date(selectedCheckOut + "T00:00:00");
      const daysDiff = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysDiff < 1) {
        showError("Invalid Dates", "Check-out must be after check-in.");
        setIsSubmitting(false);
        return;
      }

      if (daysDiff > 30) {
        showError("Stay Too Long", "Maximum stay is 30 nights.");
        setIsSubmitting(false);
        return;
      }

      // Check for booking conflicts
      const { data: conflictingBookings, error: conflictError } = await supabase
        .from("bookings")
        .select("id, check_in_date, check_out_date, status")
        .in("status", [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING])
        .or(
          `and(check_in_date.lt.${selectedCheckOut}T13:00:00,check_out_date.gt.${selectedCheckIn}T15:00:00)`,
        );

      if (conflictError) {
        console.error("Conflict check error:", conflictError);
      }

      if (conflictingBookings && conflictingBookings.length > 0) {
        // Check actual date overlap more carefully
        const hasRealConflict = conflictingBookings.some((booking) => {
          const existCheckIn = booking.check_in_date.split("T")[0];
          const existCheckOut = booking.check_out_date.split("T")[0];
          // Overlap if new check-in is before existing check-out AND new check-out is after existing check-in
          return (
            selectedCheckIn < existCheckOut && selectedCheckOut > existCheckIn
          );
        });

        if (hasRealConflict) {
          showError(
            "Booking Conflict",
            "The selected dates conflict with an existing reservation. Please choose different dates.",
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Build booking data
      const checkInDateTime = `${selectedCheckIn}T15:00:00`;
      const checkOutDateTime = `${selectedCheckOut}T13:00:00`;

      const walkInNote = specialRequests.trim()
        ? `[WALK-IN] ${specialRequests.trim()}`
        : "[WALK-IN]";

      const bookingData = {
        user_id: currentUser.id,
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim() || "walkin@kampoibayo.com", // Intentional: walk-ins created by admin may not have guest email
        guest_phone: guestPhone.trim()
          ? cleanPhoneForDatabase(guestPhone.trim())
          : null,
        number_of_guests: guestCount,
        check_in_date: checkInDateTime,
        check_out_date: checkOutDateTime,
        brings_pet: bringsPet,
        special_requests: walkInNote,
        status: BOOKING_STATUS.CONFIRMED,
        total_amount: totalAmount,
        payment_type: PAYMENT_TYPE.FULL,
        payment_amount: totalAmount,
        payment_status: PAYMENT_STATUS.PAID,
      };

      const { data, error } = await supabase
        .from("bookings")
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        console.error("Booking creation error:", error);
        showError("Booking Failed", `Error: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      // Optionally send confirmation email if guest email was provided
      if (guestEmail.trim() && data) {
        try {
          const { data: { session: emailSession } } = await supabase.auth.getSession();
          await fetch("/api/email/booking-confirmation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${emailSession?.access_token}`,
            },
            body: JSON.stringify({
              bookingDetails: {
                bookingId: data.id.toString(),
                guestName: guestName.trim(),
                checkIn: selectedCheckIn,
                checkOut: selectedCheckOut,
                guests: guestCount,
                totalAmount: totalAmount,
                email: guestEmail.trim(),
              },
              phoneNumber: guestPhone.trim() || undefined,
            }),
          });
        } catch (emailError) {
          console.warn("Email notification failed (non-blocking):", emailError);
        }
      }

      success(
        "Walk-in Booking Created!",
        `Booking for ${guestName.trim()} has been confirmed (cash paid).`,
      );

      // Redirect back to bookings list
      setTimeout(() => {
        router.push("/admin/bookings");
      }, 1000);
    } catch (error) {
      console.error("Walk-in booking error:", error);
      showError("Error", "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return {
    // Auth state
    authLoading,

    // Form state
    guestName,
    setGuestName,
    guestEmail,
    setGuestEmail,
    guestPhone,
    setGuestPhone,
    numberOfGuests,
    setNumberOfGuests,
    bringsPet,
    setBringsPet,
    specialRequests,
    setSpecialRequests,

    // Date state
    selectedCheckIn,
    selectedCheckOut,
    handleDateSelect,
    todayString,

    // Pricing
    pricing,
    totalAmount,

    // Submission
    isSubmitting,
    handleSubmit,
  };
}
