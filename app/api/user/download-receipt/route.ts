import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ReactPdfReceiptService } from '../../../utils/reactPdfReceiptService';
import { validateAuth, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';
import { RESORT_NAME, RESORT_ADDRESS, RESORT_PHONE, RESORT_EMAIL } from '@/app/lib/constants/business';

export async function POST(request: NextRequest) {

  try {
    const auth = await validateAuth(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);
    const { bookingId, userEmail, userName } = await request.json();

    // Validate required fields
    if (!bookingId || !userEmail || !userName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: bookingId, userEmail, userName'
      }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking fetch error:', bookingError);
      return NextResponse.json({
        success: false,
        error: 'Booking not found or access denied'
      }, { status: 404 });
    }

    // Ownership check: user can only download receipts for their own bookings
    if (booking.user_id !== auth.user.authId) {
      return NextResponse.json({
        success: false,
        error: 'Access denied: you can only download receipts for your own bookings'
      }, { status: 403 });
    }

    // Security: Verify booking belongs to requesting user or is confirmed
    if (booking.status !== 'confirmed') {
      return NextResponse.json({
        success: false,
        error: 'Receipt only available for confirmed bookings'
      }, { status: 403 });
    }

    // Fetch verified payment proof
    const { data: paymentProofs, error: paymentError } = await supabase
      .from('payment_proofs')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('status', 'verified')
      .order('verified_at', { ascending: false })
      .limit(1);

    if (paymentError) {
      console.error('Payment proof fetch error:', paymentError);
      return NextResponse.json({
        success: false,
        error: 'Error fetching payment proof'
      }, { status: 500 });
    }

    if (!paymentProofs || paymentProofs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No verified payment found for this booking'
      }, { status: 404 });
    }

    const paymentProof = paymentProofs[0];

    // Generate receipt number using check-in date (deterministic — same number every download)
    const receiptNumber = ReactPdfReceiptService.generateReceiptNumber(bookingId, 'payment', booking.check_in_date);
    const receiptData = {
      booking: {
        ...booking,
        booking_status: booking.status, // Map status to booking_status
      },
      paymentProof: {
        payment_method: paymentProof.payment_method,
        reference_number: paymentProof.reference_number,
        payment_date: paymentProof.created_at,
        amount_paid: paymentProof.amount,
        verification_status: 'verified' as const
      },
      userEmail,
      userName,
      receiptNumber,
      generatedAt: new Date().toISOString(),
      receiptType: 'payment' as const,
      generatedBy: 'system',
      companyDetails: {
        name: RESORT_NAME,
        address: RESORT_ADDRESS,
        phone: RESORT_PHONE,
        email: RESORT_EMAIL
      }
    };

    // Validate receipt data
    if (!ReactPdfReceiptService.validateReceiptData(receiptData)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid receipt data'
      }, { status: 400 });
    }


    // Generate PDF with React-PDF (Vercel optimized)
    const pdfBuffer = await ReactPdfReceiptService.generatePDFReceipt(receiptData);

    // Return PDF as downloadable response  
    const uint8Array = new Uint8Array(pdfBuffer);
    const response = new NextResponse(uint8Array);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="Kampo-Ibayo-Receipt-${receiptNumber}.pdf"`);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return response;

  } catch (error) {
    console.error('Error downloading receipt:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate receipt for download'
    }, { status: 500 });
  }
}