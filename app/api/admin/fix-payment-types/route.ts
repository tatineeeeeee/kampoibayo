import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabaseAdmin';
import { validateAdminAuth, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';
import { HALF_PAYMENT_MULTIPLIER, HALF_PAYMENT_MIN_PCT, HALF_PAYMENT_MAX_PCT, FULL_PAYMENT_MIN_PCT } from '@/app/lib/constants/pricing';

export async function POST(request: NextRequest) {
  try {
    const auth = await validateAdminAuth(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);
    // Step 1: Get all bookings that have null payment_type but have payment_amount or total_amount
    const { data: bookings, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, payment_type, payment_amount, total_amount')
      .is('payment_type', null)
      .not('total_amount', 'is', null);

    if (fetchError) {
      console.error('Error fetching bookings:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ message: 'No bookings need payment type fixes', updated: 0 });
    }

    let updatedCount = 0;

    // Step 2: Update each booking with inferred payment type
    for (const booking of bookings) {
      let paymentType: string | null = null;
      
      // If payment_amount exists and is about 50% of total_amount, it's a down payment
      if (booking.payment_amount && booking.total_amount) {
        const percentage = (booking.payment_amount / booking.total_amount) * 100;
        if (percentage >= HALF_PAYMENT_MIN_PCT && percentage <= HALF_PAYMENT_MAX_PCT) {
          paymentType = 'half';
        } else if (percentage >= FULL_PAYMENT_MIN_PCT) {
          paymentType = 'full';
        }
      }
      
      // If no payment_amount but total_amount exists, assume full payment
      if (!paymentType && booking.total_amount) {
        paymentType = 'full';
      }

      // Update the booking if we determined a payment type
      if (paymentType) {
        const { error: updateError } = await supabaseAdmin
          .from('bookings')
          .update({ 
            payment_type: paymentType,
            payment_amount: paymentType === 'half' ? booking.total_amount * HALF_PAYMENT_MULTIPLIER : booking.total_amount
          })
          .eq('id', booking.id);

        if (!updateError) {
          updatedCount++;
        } else {
          console.error(`❌ Failed to update booking ${booking.id}:`, updateError);
        }
      }
    }

    return NextResponse.json({ 
      message: `Successfully updated ${updatedCount} bookings`,
      updated: updatedCount,
      total: bookings.length
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}