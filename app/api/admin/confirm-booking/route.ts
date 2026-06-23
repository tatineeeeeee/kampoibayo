/**
 * =============================================================================
 * ADMIN BOOKING CONFIRMATION API
 * =============================================================================
 * 
 * SECURITY IMPLEMENTATIONS:
 * 
 * 1. INPUT VALIDATION (PHP Equivalent: filter_var(), is_numeric())
 *    - Validates bookingId exists before processing
 *    - Returns 400 Bad Request for invalid inputs
 * 
 * 2. ORM SECURITY / SQL INJECTION PREVENTION (PHP Equivalent: PDO::prepare())
 *    - Supabase .eq('id', bookingId) uses parameterized queries
 *    - User input is NEVER concatenated into SQL strings
 *    - Equivalent to: $stmt->bindParam(':id', $bookingId, PDO::PARAM_INT)
 * 
 * 3. CSRF PROTECTION (PHP Equivalent: csrf_token() verification)
 *    - Next.js API routes have built-in same-origin policy
 *    - POST requests require valid session context
 * 
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, createBookingConfirmedEmail, BookingDetails } from '@/app/utils/emailService';
import { sendSMS, createBookingApprovalSMS } from '@/app/utils/smsService';
import { supabaseAdmin } from '@/app/utils/supabaseAdmin';
import { validateAdminAuth, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';
import { checkRateLimit, getClientIp } from '@/app/utils/rateLimit';
import { ADMIN_RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '@/app/lib/constants/rateLimits';

export async function POST(request: NextRequest) {
  try {
    const auth = await validateAdminAuth(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);

    const ip = getClientIp(request);
    if (!checkRateLimit(`confirm-booking:${ip}`, ADMIN_RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
    }

    const body = await request.json();
    const { bookingId } = body;

    // INPUT VALIDATION - PHP Equivalent: if(!isset($_POST['bookingId']) || empty($_POST['bookingId']))
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    /**
     * ORM SECURITY - SQL INJECTION PREVENTION
     * PHP Equivalent: $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = :id");
     *                 $stmt->execute(['id' => $bookingId]);
     * 
     * Supabase automatically uses parameterized queries - user input is bound safely
     */
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)  // Parameterized: prevents SQL injection
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Guard: prevent confirming cancelled or already confirmed bookings
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cannot confirm a cancelled booking' },
        { status: 400 }
      );
    }

    if (booking.status === 'confirmed') {
      return NextResponse.json(
        { success: false, error: 'Booking is already confirmed' },
        { status: 400 }
      );
    }

    // Atomic update: only confirm if still pending (prevents race conditions)
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)
      .eq('status', 'pending')
      .select('id');

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update booking status' },
        { status: 500 }
      );
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Booking was already processed by another admin' },
        { status: 409 }
      );
    }

    // Send confirmation email to guest (only if email exists)
    if (booking.guest_email) {
      const emailBookingDetails: BookingDetails = {
        bookingId: booking.id.toString(),
        guestName: booking.guest_name,
        checkIn: new Date(booking.check_in_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        checkOut: new Date(booking.check_out_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        guests: booking.number_of_guests,
        totalAmount: booking.total_amount,
        email: booking.guest_email,
        paymentType: (booking.payment_type as 'full' | 'half') || undefined,
      };

      const confirmationEmail = createBookingConfirmedEmail(emailBookingDetails);
      const emailResult = await sendEmail(confirmationEmail);

      // Send SMS confirmation if phone number is available
      let smsResult = null;
      if (booking.guest_phone) {
        try {
          // Create approval SMS message
          const smsMessage = createBookingApprovalSMS(
            booking.id.toString(),
            booking.guest_name,
            emailBookingDetails.checkIn
          );
          smsResult = await sendSMS({ phone: booking.guest_phone, message: smsMessage });
        } catch (smsError) {
          console.error('📱 SMS Error (non-critical):', smsError);
          smsResult = { success: false, error: 'SMS service temporarily unavailable' };
        }
      }

      if (emailResult.success) {
        return NextResponse.json({
          success: true,
          message: booking.guest_phone
            ? `Booking confirmed! User notified via email${smsResult?.success ? ' and SMS' : ''}`
            : 'Booking confirmed! User notified via email',
          messageId: emailResult.messageId,
          smsResult: smsResult
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Booking confirmed but email failed to send',
          emailError: emailResult.error,
          smsResult: smsResult
        }, { status: 500 });
      }
    } else {
      // No email available, but booking was still confirmed successfully
      return NextResponse.json({
        success: true,
        message: 'Booking confirmed successfully (no email on file)',
      });
    }

  } catch (error) {
    console.error('Error in confirm booking API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}