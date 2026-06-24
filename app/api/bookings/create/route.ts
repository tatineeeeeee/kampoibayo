import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/utils/supabaseAdmin";
import { validateAuth, authErrorResponse, AuthFailure } from "@/app/utils/serverAuth";
import { checkRateLimit, getClientIp } from "@/app/utils/rateLimit";
import { calculateBookingPrice } from "@/app/utils/priceCalculation";
import { escapeHtml } from "@/app/utils/escapeHtml";
import { MAX_GUEST_NAME_LENGTH, MAX_EMAIL_LENGTH, MAX_SPECIAL_REQUESTS_LENGTH } from "@/app/lib/constants/validation";
import { USER_RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "@/app/lib/constants/rateLimits";

export async function POST(request: NextRequest) {
  try {
    const auth = await validateAuth(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);

    const ip = getClientIp(request);
    if (!checkRateLimit(`create-booking:${ip}`, USER_RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      guest_name,
      guest_email,
      guest_phone,
      number_of_guests,
      check_in_date,
      check_out_date,
      brings_pet,
      special_requests,
      payment_type,
    } = body;

    // Validate required fields
    if (!guest_name?.trim() || !guest_email?.trim() || !check_in_date || !check_out_date || !number_of_guests) {
      return NextResponse.json(
        { error: "Missing required booking fields" },
        { status: 400 }
      );
    }

    // Validate payment type
    if (payment_type !== "half" && payment_type !== "full") {
      return NextResponse.json(
        { error: "Payment type must be 'half' or 'full'" },
        { status: 400 }
      );
    }

    // SERVER-SIDE PRICE CALCULATION — never trust client amounts
    const guestCount = parseInt(String(number_of_guests));
    const priceResult = calculateBookingPrice(check_in_date, check_out_date, guestCount);

    if (!priceResult.isValid) {
      return NextResponse.json(
        { error: priceResult.error || "Invalid booking parameters" },
        { status: 400 }
      );
    }

    const totalAmount = priceResult.totalAmount;
    const paymentAmount = payment_type === "half" ? Math.round(totalAmount * 0.5) : totalAmount;

    // Sanitize text fields
    const sanitizedName = guest_name.trim().slice(0, MAX_GUEST_NAME_LENGTH);
    const sanitizedEmail = guest_email.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH);
    const sanitizedPhone = guest_phone?.trim() || null;
    const sanitizedRequests = special_requests?.trim().slice(0, MAX_SPECIAL_REQUESTS_LENGTH) || null;

    const bookingData = {
      user_id: auth.user.authId,
      guest_name: sanitizedName,
      guest_email: sanitizedEmail,
      guest_phone: sanitizedPhone,
      number_of_guests: guestCount,
      check_in_date,
      check_out_date,
      brings_pet: brings_pet || false,
      special_requests: sanitizedRequests,
      status: "pending",
      total_amount: totalAmount,
      payment_type,
      payment_amount: paymentAmount,
    };

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert([bookingData])
      .select()
      .single();

    if (error) {
      console.error("Booking creation error:", error.code);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, booking: data });
  } catch (error) {
    console.error("Booking API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
