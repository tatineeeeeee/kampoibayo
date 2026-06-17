import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAuth, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';
import { checkRateLimit, getClientIp } from '@/app/utils/rateLimit';
import { BASE_RATE_WEEKDAY, BASE_RATE_WEEKEND, EXTRA_GUEST_FEE, INCLUDED_GUESTS, PHILIPPINE_HOLIDAYS, PEAK_SEASON_RANGES } from '@/app/lib/constants/pricing';
import { BOOKING_STATUS } from '@/app/lib/constants/booking';

// Initialize Supabase admin client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const auth = await validateAuth(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);

    const ip = getClientIp(request);
    if (!checkRateLimit(`user-reschedule:${ip}`, 5, 60_000)) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
    }

    const { bookingId, newCheckIn, newCheckOut } = await request.json();
    const userId = auth.user.authId;

    // Validate required fields
    if (!bookingId || !newCheckIn || !newCheckOut) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate dates
    const checkInDate = new Date(newCheckIn);
    const checkOutDate = new Date(newCheckOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return NextResponse.json(
        { success: false, error: "Check-in date cannot be in the past" },
        { status: 400 }
      );
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { success: false, error: "Check-out date must be after check-in date" },
        { status: 400 }
      );
    }

    // Verify the booking belongs to the user and can be rescheduled
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found or access denied" },
        { status: 404 }
      );
    }

    // Check if booking can be rescheduled (same rules as cancellation)
    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return NextResponse.json(
        { success: false, error: "Cannot reschedule a cancelled booking" },
        { status: 400 }
      );
    }

    // Max 2 reschedules per booking (admin reschedules don't count)
    const rescheduleCount = booking.reschedule_count || 0;
    if (rescheduleCount >= 2) {
      return NextResponse.json(
        { success: false, error: "Maximum 2 reschedules reached. Please contact the resort directly for further changes." },
        { status: 400 }
      );
    }

    // For confirmed bookings, check if it's at least 3 days before check-in
    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      const originalCheckIn = new Date(booking.check_in_date);
      const now = new Date();
      const daysUntilCheckIn = (originalCheckIn.getTime() - now.getTime()) / (1000 * 3600 * 24);

      if (daysUntilCheckIn < 3) {
        return NextResponse.json(
          { success: false, error: "Cannot reschedule less than 3 days before check-in" },
          { status: 400 }
        );
      }
    }

    // Block reschedule if there are pending payment proofs (wait for admin to verify/reject first)
    const { data: pendingProofs } = await supabaseAdmin
      .from('payment_proofs')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('status', 'pending');

    if (pendingProofs && pendingProofs.length > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot reschedule while payment is under review. Please wait for payment verification." },
        { status: 400 }
      );
    }

    // Check if new dates are available (excluding the current booking)
    const { data: conflictingBookings, error: conflictError } = await supabaseAdmin
      .from('bookings')
      .select('id, check_in_date, check_out_date, status')
      .in('status', ['confirmed', 'pending'])
      .neq('id', bookingId); // Exclude current booking

    if (conflictError) {
      console.error('Error checking date conflicts:', conflictError);
      return NextResponse.json(
        { success: false, error: "Error checking date availability" },
        { status: 500 }
      );
    }

    // Check for date conflicts
    const newCheckInTime = new Date(newCheckIn).getTime();
    const newCheckOutTime = new Date(newCheckOut).getTime();

    const hasConflict = conflictingBookings?.some(existingBooking => {
      const existingCheckIn = new Date(existingBooking.check_in_date).getTime();
      const existingCheckOut = new Date(existingBooking.check_out_date).getTime();

      // Check for overlap
      return (
        (newCheckInTime >= existingCheckIn && newCheckInTime < existingCheckOut) ||
        (newCheckOutTime > existingCheckIn && newCheckOutTime <= existingCheckOut) ||
        (newCheckInTime <= existingCheckIn && newCheckOutTime >= existingCheckOut)
      );
    });

    if (hasConflict) {
      return NextResponse.json(
        { success: false, error: "Selected dates are not available" },
        { status: 400 }
      );
    }

    // Calculate new total amount based on new dates
    const calculateMultiDayPrice = (checkInDate: Date, checkOutDate: Date, guestCount: number = INCLUDED_GUESTS) => {
      const nights = [];
      const currentNight = new Date(checkInDate);

      // Calculate each night between check-in and check-out
      while (currentNight < checkOutDate) {
        const dayOfWeek = currentNight.getDay();
        const dateStr = `${currentNight.getFullYear()}-${String(currentNight.getMonth() + 1).padStart(2, '0')}-${String(currentNight.getDate()).padStart(2, '0')}`;
        const isHoliday = (PHILIPPINE_HOLIDAYS as readonly string[]).includes(dateStr);
        const isPeak = (PEAK_SEASON_RANGES as { start: string; end: string }[]).some((r) => dateStr >= r.start && dateStr <= r.end);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
        const nightRate = isWeekend || isHoliday || isPeak ? BASE_RATE_WEEKEND : BASE_RATE_WEEKDAY;

        nights.push({
          date: new Date(currentNight),
          rate: nightRate,
          isWeekend: isWeekend || isHoliday || isPeak
        });

        currentNight.setDate(currentNight.getDate() + 1);
      }

      const totalBaseRate = nights.reduce((sum, night) => sum + night.rate, 0);
      const totalNights = nights.length;
      const excessGuestFee = guestCount > INCLUDED_GUESTS
        ? (guestCount - INCLUDED_GUESTS) * EXTRA_GUEST_FEE * totalNights
        : 0;

      return {
        totalNights,
        totalBaseRate,
        excessGuestFee,
        totalAmount: totalBaseRate + excessGuestFee
      };
    };

    // Calculate new total amount
    const newPricing = calculateMultiDayPrice(checkInDate, checkOutDate, booking.number_of_guests);
    const newTotalAmount = newPricing.totalAmount;

    // Format dates for database (with times)
    const newCheckInDateTime = `${newCheckIn}T15:00:00`;
    const newCheckOutDateTime = `${newCheckOut}T13:00:00`;

    // Auto-cancel old pending proofs — admin shouldn't have to review outdated submissions
    await supabaseAdmin
      .from('payment_proofs')
      .update({ status: 'rejected', admin_notes: 'Auto-rejected: booking was rescheduled', updated_at: new Date().toISOString() })
      .eq('booking_id', bookingId)
      .eq('status', 'pending');

    // Check existing verified payments to determine if user still owes money
    const newPaymentAmount = booking.payment_type === 'half' ? Math.round(newTotalAmount * 0.5) : newTotalAmount;

    const { data: verifiedProofs } = await supabaseAdmin
      .from('payment_proofs')
      .select('amount')
      .eq('booking_id', bookingId)
      .eq('status', 'verified');

    const totalVerified = (verifiedProofs || []).reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
    // Only reset to pending if they still owe money; otherwise keep as verified
    const newPaymentStatus = totalVerified >= newPaymentAmount ? 'verified' : 'pending';

    // If price increased and guest owes more, set booking back to pending
    // Same price or cheaper = stays confirmed (instant reschedule)
    const newBookingStatus = newPaymentStatus === 'pending' ? 'pending' : 'confirmed';

    // Update the booking with new dates, new amount, and smart payment status
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        check_in_date: newCheckInDateTime,
        check_out_date: newCheckOutDateTime,
        total_amount: newTotalAmount,
        payment_amount: newPaymentAmount,
        payment_status: newPaymentStatus,
        status: newBookingStatus,
        reschedule_count: rescheduleCount + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { success: false, error: "Failed to reschedule booking" },
        { status: 500 }
      );
    }

    // Send notification emails in the background (non-blocking)
    try {
      // Send email notification to guest and admin
      const emailData = {
        bookingId: bookingId,
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        phoneNumber: booking.guest_phone, // Include phone for SMS notification
        originalCheckIn: new Date(booking.check_in_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        originalCheckOut: new Date(booking.check_out_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        newCheckIn: new Date(newCheckInDateTime).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        newCheckOut: new Date(newCheckOutDateTime).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        totalAmount: newTotalAmount,
        guests: booking.number_of_guests
      };

      // Send reschedule confirmation email and SMS (fire and forget)
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/booking-rescheduled`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
        body: JSON.stringify(emailData)
      }).catch(error => {
        console.warn('Email/SMS notification failed:', error);
        // Don't fail the main operation
      });

    } catch (emailError) {
      console.warn('Email service error:', emailError);
      // Don't fail the main reschedule operation
    }

    return NextResponse.json({
      success: true,
      message: "Booking rescheduled successfully! Please upload new payment proof for the updated amount.",
      booking: updatedBooking,
      pricing: {
        originalAmount: booking.total_amount,
        newAmount: newTotalAmount,
        amountDifference: newTotalAmount - booking.total_amount,
        nightsCount: newPricing.totalNights
      },
      requiresNewPayment: true
    });

  } catch (error) {
    console.error('Reschedule booking error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}