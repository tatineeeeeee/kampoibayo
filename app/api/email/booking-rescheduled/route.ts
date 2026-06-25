import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/app/utils/emailService";
import { sendSMS, createBookingRescheduleSMS } from "@/app/utils/smsService";
import { validateInternalOrAdmin, authErrorResponse, AuthFailure } from "@/app/utils/serverAuth";
import { escapeHtml } from "@/app/utils/escapeHtml";
import { CHECK_IN_TIME, CHECK_OUT_TIME } from "@/app/lib/constants/booking";

export async function POST(request: NextRequest) {
  try {
    const auth = await validateInternalOrAdmin(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);

    const {
      bookingId,
      guestName,
      guestEmail,
      phoneNumber,
      originalCheckIn,
      originalCheckOut,
      newCheckIn,
      newCheckOut,
      totalAmount,
      guests
    } = await request.json();

    if (!guestEmail || !guestName || !bookingId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Email content for the guest
    const guestEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Kampo Ibayo Resort</h1>
          <p style="color: #666; margin: 5px 0;">Your Booking Has Been Rescheduled</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin-top: 0;">Booking Rescheduled Successfully</h2>
          <p>Dear ${escapeHtml(guestName)},</p>
          <p>Your booking has been successfully rescheduled. Here are the updated details:</p>
        </div>

        <div style="background-color: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #1e40af; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Booking Information</h3>
          <p><strong>Booking ID:</strong> ${bookingId}</p>
          <p><strong>Guest Name:</strong> ${escapeHtml(guestName)}</p>
          <p><strong>Number of Guests:</strong> ${guests}</p>
          <p><strong>Total Amount:</strong> ₱${Number(totalAmount).toLocaleString()}</p>
        </div>

        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #92400e; margin-top: 0;">Date Changes</h3>
          <div style="margin-bottom: 15px;">
            <h4 style="color: #dc2626; margin: 10px 0; text-decoration: line-through;">Previous Dates:</h4>
            <p style="margin: 5px 0; text-decoration: line-through; color: #666;">Check-in: ${originalCheckIn}</p>
            <p style="margin: 5px 0; text-decoration: line-through; color: #666;">Check-out: ${originalCheckOut}</p>
          </div>
          <div>
            <h4 style="color: #059669; margin: 10px 0;">New Dates:</h4>
            <p style="margin: 5px 0; font-weight: bold; color: #059669;">Check-in: ${newCheckIn} at ${CHECK_IN_TIME}</p>
            <p style="margin: 5px 0; font-weight: bold; color: #059669;">Check-out: ${newCheckOut} at ${CHECK_OUT_TIME}</p>
          </div>
        </div>

        <div style="background-color: #e0f2fe; border: 1px solid #0891b2; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #0c4a6e; margin-top: 0;">Important Information</h3>
          <ul style="color: #0c4a6e; margin: 10px 0; padding-left: 20px;">
            <li>Your booking ID remains the same</li>
            <li>Payment details are unchanged</li>
            <li>All resort policies still apply</li>
            <li>Please arrive at the new check-in date and time</li>
          </ul>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #334155; margin-top: 0;">Contact Information</h3>
          <p style="margin: 5px 0;">If you have any questions about your rescheduled booking, please contact us:</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> +63 XXX XXX XXXX</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> info@kampoibayo.com</p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #666; margin: 5px 0;">Thank you for choosing Kampo Ibayo Resort!</p>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">We look forward to welcoming you on your new dates.</p>
        </div>
      </div>
    `;

    // Admin notification email
    const adminEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Booking Rescheduled</h1>
          <p style="color: #666; margin: 5px 0;">Admin Notification</p>
        </div>
        
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #2563eb; margin-top: 0;">Booking Rescheduled Alert</h2>
          <p>A guest has rescheduled their booking. Please review the changes:</p>
        </div>

        <div style="background-color: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #1e40af; margin-top: 0;">Booking Details</h3>
          <p><strong>Booking ID:</strong> ${bookingId}</p>
          <p><strong>Guest Name:</strong> ${escapeHtml(guestName)}</p>
          <p><strong>Guest Email:</strong> ${guestEmail}</p>
          <p><strong>Number of Guests:</strong> ${guests}</p>
          <p><strong>Total Amount:</strong> ₱${Number(totalAmount).toLocaleString()}</p>
        </div>

        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px;">
          <h3 style="color: #92400e; margin-top: 0;">Date Changes</h3>
          <div style="margin-bottom: 15px;">
            <h4 style="color: #dc2626; margin: 10px 0;">Previous Dates:</h4>
            <p style="margin: 5px 0;">Check-in: ${originalCheckIn}</p>
            <p style="margin: 5px 0;">Check-out: ${originalCheckOut}</p>
          </div>
          <div>
            <h4 style="color: #059669; margin: 10px 0;">New Dates:</h4>
            <p style="margin: 5px 0; font-weight: bold;">Check-in: ${newCheckIn}</p>
            <p style="margin: 5px 0; font-weight: bold;">Check-out: ${newCheckOut}</p>
          </div>
        </div>
      </div>
    `;

    // Send email to guest
    const guestEmailResult = await sendEmail({
      to: guestEmail,
      subject: `Booking Rescheduled - Kampo Ibayo Resort (${bookingId})`,
      html: guestEmailContent,
    });

    // Send notification to admin
    const adminEmailResult = await sendEmail({
      to: process.env.ADMIN_EMAIL || "admin@kampoibayo.com",
      subject: `Booking Rescheduled - ${bookingId} - ${guestName}`,
      html: adminEmailContent,
    });

    // Optional SMS notification to guest if phone number provided
    let smsResult = null as null | { success: boolean; messageId?: string; error?: string };
    if (phoneNumber) {
      try {
        const smsMessage = createBookingRescheduleSMS(
          String(bookingId),
          guestName,
          newCheckIn
        );
        smsResult = await sendSMS({ phone: phoneNumber, message: smsMessage });
      } catch (smsError) {
        console.error("Error sending reschedule SMS:", smsError);
        smsResult = { success: false, error: "Failed to send SMS" };
      }
    }

    if (!guestEmailResult.success) {
      console.warn('Failed to send guest email:', guestEmailResult.error);
    }

    if (!adminEmailResult.success) {
      console.warn('Failed to send admin email:', adminEmailResult.error);
    }

    return NextResponse.json({
      success: true,
      message: phoneNumber
        ? `Reschedule confirmation sent via email${smsResult?.success ? " and SMS" : " (SMS failed)"}`
        : "Reschedule confirmation emails sent successfully",
      smsResult
    });

  } catch (error) {
    console.error("Error sending reschedule emails:", error);
    return NextResponse.json(
      { error: "Failed to send reschedule confirmation emails" },
      { status: 500 }
    );
  }
}