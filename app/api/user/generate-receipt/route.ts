import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ReactPdfReceiptService } from '../../../utils/reactPdfReceiptService';
import nodemailer from 'nodemailer';
import { validateAuth, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';
import { RESORT_NAME, RESORT_ADDRESS, RESORT_PHONE, RESORT_EMAIL } from '@/app/lib/constants/business';
import { CHECK_IN_TIME, CHECK_OUT_TIME } from '@/app/lib/constants/booking';

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

    // Ownership check: user can only generate receipts for their own bookings
    if (booking.user_id !== auth.user.authId) {
      return NextResponse.json({
        success: false,
        error: 'Access denied: you can only generate receipts for your own bookings'
      }, { status: 403 });
    }

    // Security: Verify booking is confirmed
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


    // Generate PDF buffer with React-PDF (Vercel optimized)
    const pdfBuffer = await ReactPdfReceiptService.generateReceiptBlob(receiptData);


    // Check if we got the fallback PDF (jsPDF is typically smaller)
    if (pdfBuffer.length < 50000) {
    } else {
    }

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Email content
    const paymentAmount = booking.payment_amount || (booking.total_amount * 0.5);
    const paymentType = booking.payment_type === 'full' ? 'Full Payment' : 'Down Payment';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Kampo Ibayo Resort</h1>
            <p style="color: #64748b; margin: 5px 0;">Your Official Payment Receipt</p>
          </div>

          <!-- Greeting -->
          <h2 style="color: #1e293b; margin-bottom: 20px;">Hello ${userName}!</h2>
          
          <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
            Thank you for your payment! Your booking has been confirmed and your official receipt is attached to this email.
          </p>

          <!-- Booking Summary -->
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin: 0 0 15px 0;">Booking Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Booking ID:</td>
                <td style="padding: 5px 0; color: #1e293b; font-weight: bold;">#${booking.id}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Receipt No:</td>
                <td style="padding: 5px 0; color: #1e293b; font-weight: bold;">${receiptNumber}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Check-in:</td>
                <td style="padding: 5px 0; color: #1e293b;">${new Date(booking.check_in_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Check-out:</td>
                <td style="padding: 5px 0; color: #1e293b;">${new Date(booking.check_out_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Guests:</td>
                <td style="padding: 5px 0; color: #1e293b;">${booking.number_of_guests} guest(s)</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Payment Type:</td>
                <td style="padding: 5px 0; color: #1e293b;">${paymentType}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Amount Paid:</td>
                <td style="padding: 5px 0; color: #059669; font-weight: bold; font-size: 18px;">₱${paymentAmount.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <!-- Important Notes -->
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <h4 style="color: #92400e; margin: 0 0 10px 0;">Important Reminders:</h4>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>Please bring a printed copy or screenshot of this receipt during check-in</li>
              <li>Check-in time is ${CHECK_IN_TIME}, Check-out time is ${CHECK_OUT_TIME}</li>
              ${booking.payment_type !== 'full' ? `<li>Remaining balance of ₱${(booking.total_amount - paymentAmount).toLocaleString()} is payable upon arrival</li>` : ''}
              <li>For any concerns, contact us 24 hours before your check-in date</li>
            </ul>
          </div>

          <!-- Contact Information -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 5px 0;">📍 Brgy. Tapia, General Trias, Cavite</p>
            <p style="color: #64748b; margin: 5px 0;">📞 +63 966 281 5123 | 📧 kampoibayo@gmail.com</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email with PDF attachment
    const mailOptions = {
      from: `"Kampo Ibayo Resort" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Payment Receipt - Booking #${bookingId} | Kampo Ibayo Resort`,
      html: emailHtml,
      attachments: [
        {
          filename: `Kampo-Ibayo-Receipt-${receiptNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // Log receipt generation

    return NextResponse.json({
      success: true,
      message: 'Receipt generated and sent successfully',
      receiptNumber,
      sentTo: userEmail
    });

  } catch (error) {
    console.error('Error generating/sending receipt:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate or send receipt'
    }, { status: 500 });
  }
}