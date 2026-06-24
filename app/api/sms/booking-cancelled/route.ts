import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/app/utils/smsService';
import { validateInternalOrAdmin, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';
import { RESORT_PHONE_LOCAL } from '@/app/lib/constants/business';
import { SMS_MAX_LENGTH } from '@/app/lib/constants/sms';

export async function POST(request: NextRequest) {
  try {
    const auth = await validateInternalOrAdmin(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);

    const { phoneNumber, bookingDetails } = await request.json();

    // Validate required fields
    if (!phoneNumber || !bookingDetails) {
      return NextResponse.json(
        { error: 'Phone number and booking details are required' },
        { status: 400 }
      );
    }

    // Validate phone number format (basic check)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Format the cancellation message — only mention refund if one is actually being processed
    const refundLine = bookingDetails.refund_status === 'processing' && bookingDetails.refund_amount
      ? ` Refund of P${Number(bookingDetails.refund_amount).toLocaleString()} will be processed within 5-10 business days.`
      : '';
    const baseMessage = `KAMPO IBAYO RESORT: Dear ${bookingDetails.name || 'Guest'}, booking ${bookingDetails.booking_number || 'N/A'} has been cancelled.${refundLine} Call: ${RESORT_PHONE_LOCAL}`;
    const message = baseMessage.substring(0, SMS_MAX_LENGTH);

    // Send SMS using existing service
    const result = await sendSMS({
      phone: phoneNumber,
      message: message
    });

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Cancellation SMS sent successfully',
        messageId: result.messageId 
      });
    } else {
      console.error(`Failed to send cancellation SMS to ${phoneNumber}:`, result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send SMS' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('SMS cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}