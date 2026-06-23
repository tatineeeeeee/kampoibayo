import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabaseAdmin';
import { validateAdminAuth, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';
import { checkRateLimit, getClientIp } from '@/app/utils/rateLimit';
import { ADMIN_RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '@/app/lib/constants/rateLimits';

export async function GET(request: NextRequest) {
  try {
    const auth = await validateAdminAuth(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Mark balance paid API is available',
    timestamp: new Date().toISOString(),
    status: 'operational'
  });
}

export async function POST(request: NextRequest) {

  try {
    const auth = await validateAdminAuth(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);

    const ip = getClientIp(request);
    if (!checkRateLimit(`mark-balance:${ip}`, ADMIN_RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
    }

    const body = await request.json();

    const { bookingId, balanceAmount, totalAmount, paymentMethod } = body;
    
    // Convert to numbers
    const numBookingId = parseInt(String(bookingId));
    const numBalanceAmount = parseFloat(String(balanceAmount));
    const numTotalAmount = parseFloat(String(totalAmount));
    
    
    // Validate numbers — bounds check to prevent overflow/abuse
    if (isNaN(numBookingId) || isNaN(numBalanceAmount) || isNaN(numTotalAmount) ||
        !isFinite(numBalanceAmount) || !isFinite(numTotalAmount) ||
        numBookingId <= 0 || numBalanceAmount < 0 || numTotalAmount <= 0 ||
        numBalanceAmount > 1_000_000 || numTotalAmount > 1_000_000) {
      return NextResponse.json(
        { error: 'Invalid numeric values' },
        { status: 400 }
      );
    }
    
    // Validate amounts
    if (numBalanceAmount <= 0 || numBalanceAmount >= numTotalAmount) {
      return NextResponse.json(
        { error: 'Invalid balance amount' },
        { status: 400 }
      );
    }
    
    // Get original payment proof by booking_id
    
    const { data: paymentProofs, error: paymentError } = await supabaseAdmin
      .from('payment_proofs')
      .select('*')
      .eq('booking_id', numBookingId)
      .order('created_at', { ascending: false });
      
    if (paymentError) {
      console.error('❌ Payment query error:', paymentError);
      return NextResponse.json(
        { error: 'Database error while finding payment', details: paymentError.message },
        { status: 500 }
      );
    }
    
    if (!paymentProofs || paymentProofs.length === 0) {
      console.error('❌ No payment proofs found for booking:', numBookingId);
      return NextResponse.json(
        { error: 'No payment proof found for this booking' },
        { status: 404 }
      );
    }
    
    // Find the original half payment (not cash_on_arrival)
    const originalPayment = paymentProofs.find(proof => proof.payment_method !== 'cash_on_arrival');
    
    if (!originalPayment) {
      console.error('❌ No original payment found (only cash_on_arrival payments exist)');
      return NextResponse.json(
        { error: 'No original payment found for this booking' },
        { status: 404 }
      );
    }
    
    
    // Get booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('status, payment_type, total_amount, check_in_date')
      .eq('id', numBookingId)
      .single();
      
    if (bookingError || !booking) {
      console.error('❌ Booking error:', bookingError);
      return NextResponse.json(
        { error: 'Booking not found', details: bookingError?.message },
        { status: 404 }
      );
    }
    
    
    // Validate booking
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot mark balance as paid for cancelled booking' },
        { status: 400 }
      );
    }
    
    if (booking.payment_type !== 'half') {
      return NextResponse.json(
        { error: 'Balance payment only available for half payment bookings' },
        { status: 400 }
      );
    }
    
    // Check for existing balance payment
    const existingBalance = paymentProofs.find(proof => proof.payment_method === 'cash_on_arrival');
      
    if (existingBalance) {
      return NextResponse.json(
        { error: 'Balance payment already recorded' },
        { status: 409 }
      );
    }
    
    // Create balance payment
    const { data: balancePayment, error: insertError } = await supabaseAdmin
      .from('payment_proofs')
      .insert({
        booking_id: numBookingId,
        user_id: originalPayment.user_id,
        amount: numBalanceAmount,
        payment_method: paymentMethod || 'cash_on_arrival',
        reference_number: `BAL-${booking.check_in_date?.replace(/-/g, '') || new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(numBookingId).padStart(3, '0')}`,
        status: 'verified',
        admin_notes: `Balance payment marked as paid on arrival. Original payment ID: ${originalPayment.id}`,
        verified_at: new Date().toISOString(),
        proof_image_url: 'data:text/plain;base64,QkFMQU5DRV9QQVlNRU5UX09OX0FSUklWQUw=' // Base64 for "BALANCE_PAYMENT_ON_ARRIVAL"
      })
      .select('*')
      .single();
      
    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create balance payment', details: insertError.message },
        { status: 500 }
      );
    }
    
    
    // Atomic update: only mark paid if not already paid (prevents race conditions)
    const { data: bookingUpdated, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'paid',
        payment_amount: numTotalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', numBookingId)
      .neq('payment_status', 'paid')
      .select('id');

    if (updateError) {
      console.warn('⚠️ Booking update warning:', updateError);
    }

    if (!bookingUpdated || bookingUpdated.length === 0) {
      // Race condition: another admin already marked balance paid — clean up
      await supabaseAdmin.from('payment_proofs').delete().eq('id', balancePayment.id);
      return NextResponse.json(
        { error: 'Balance was already marked as paid by another admin' },
        { status: 409 }
      );
    }
    
    
    return NextResponse.json({
      success: true,
      message: `Balance of ₱${numBalanceAmount.toLocaleString()} marked as paid`,
      balancePayment,
      totalPaid: originalPayment.amount + numBalanceAmount
    });
    
  } catch (error) {
    console.error('💥 API Error:', error);
    console.error('💥 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      {
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}