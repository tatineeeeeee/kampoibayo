import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, EmailTemplate } from '@/app/utils/emailService';
import { validateInternalOrAdmin, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';
import { checkRateLimit, getClientIp } from '@/app/utils/rateLimit';
import { ADMIN_RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '@/app/lib/constants/rateLimits';

export async function POST(request: NextRequest) {
  try {
    const auth = await validateInternalOrAdmin(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);

    const ip = getClientIp(request);
    if (!checkRateLimit(`email-send:${ip}`, ADMIN_RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { to, subject, html, text } = body as EmailTemplate;

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const primaryEmail = Array.isArray(to) ? to[0] : to;
    if (!emailRegex.test(primaryEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // Send email
    const emailResult = await sendEmail({ to, subject, html, text });

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        messageId: emailResult.messageId,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: emailResult.error,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in send email API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}