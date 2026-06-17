import { NextRequest, NextResponse } from 'next/server';
import {
  sendSMS,
  createBookingConfirmationSMS,
  createBookingCancellationSMS,
  createBookingReminderSMS
} from '@/app/utils/smsService';
import { validateAdminAuth, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';
import { RESORT_NAME } from '@/lib/constants/business';

export async function POST(request: NextRequest) {
  try {
    const auth = await validateAdminAuth(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);

    const { phoneNumber, testType, phone, message } = await request.json();

    // Use phone parameter if phoneNumber is not provided (for compatibility)
    const targetPhone = phoneNumber || phone;

    // Validate input
    if (!targetPhone) {
      return NextResponse.json({
        success: false,
        error: 'Phone number is required'
      }, { status: 400 });
    }


    let smsMessage: string;

    // Use custom message if provided, otherwise generate test message
    if (message) {
      smsMessage = message;
    } else {
      // Generate appropriate test message based on type
      switch (testType) {
        case 'booking-confirmation':
          smsMessage = createBookingConfirmationSMS('TEST123', 'Test User', 'December 25, 2024');
          break;
        case 'booking-cancellation':
          smsMessage = createBookingCancellationSMS('TEST123', 'Test User');
          break;
        case 'booking-reminder':
          smsMessage = createBookingReminderSMS('Test User', 'December 25, 2024');
          break;
        default:
          smsMessage = `${RESORT_NAME}: Test message from your booking system. SMS integration working perfectly!`;
      }
    }


    // Send test SMS
    const result = await sendSMS({ phone: targetPhone, message: smsMessage });

    if (result.success) {
      
      // Extract formatted phone from the SMS service (we need to format it here too for the response)
      let formattedPhone = targetPhone;
      formattedPhone = formattedPhone.replace(/[\s\-\(\)]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.replace(/^0/, '+63');
      } else if (formattedPhone.startsWith('63') && !formattedPhone.startsWith('+63')) {
        formattedPhone = '+' + formattedPhone;
      } else if (!formattedPhone.startsWith('+63')) {
        formattedPhone = '+63' + formattedPhone;
      }
      
      return NextResponse.json({
        success: true,
        message: `${testType ? testType.replace('-', ' ') : 'Test'} SMS sent successfully!`,
        messageId: result.messageId,
        formattedPhone: formattedPhone,
        phoneNumber: phoneNumber,
        testType: testType || 'basic',
        smsContent: smsMessage
      });
    } else {
      console.error('❌ Test SMS failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        phoneNumber: phoneNumber,
        testType: testType || 'basic'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Test SMS API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET method for SMS service status check
export async function GET(request: NextRequest) {
  try {
    const auth = await validateAdminAuth(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);

    const username = process.env.SMSGATE_USERNAME;
    const password = process.env.SMSGATE_PASSWORD;

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'SMS credentials not configured',
        status: 'not_configured'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'SMS service configured and ready',
      status: 'ready',
      config: {
        usernameConfigured: !!username,
        passwordConfigured: !!password,
        serviceUrl: 'https://smsgate.app/3rdparty/v1/message',
        provider: 'SMS-Gate.app'
      }
    });

  } catch (error) {
    console.error('❌ SMS status check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      status: 'error'
    }, { status: 500 });
  }
}