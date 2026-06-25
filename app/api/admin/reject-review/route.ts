import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/utils/supabaseAdmin';
import { validateAdminAuth, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';
import { MAX_REVIEW_RESUBMISSIONS } from '@/app/lib/constants/booking';

export async function POST(request: NextRequest) {
  try {
    const auth = await validateAdminAuth(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);

    const { reviewId, rejectionReason } = await request.json();

    if (!reviewId || !rejectionReason) {
      return NextResponse.json({ success: false, error: 'Review ID and rejection reason are required' }, { status: 400 });
    }

    // Get review details with user email
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('guest_reviews')
      .select(`
        id, 
        guest_name, 
        rating, 
        review_text, 
        stay_dates,
        user_id,
        resubmission_count,
        users!inner(email)
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    // Update review status to rejected and increment resubmission count
    const newResubmissionCount = (review.resubmission_count || 0) + 1;
    const { error: updateError } = await supabaseAdmin
      .from('guest_reviews')
      .update({ 
        approved: false,
        rejection_reason: rejectionReason,
        resubmission_count: newResubmissionCount
      })
      .eq('id', reviewId);

    if (updateError) {
      throw new Error(`Failed to reject review: ${updateError.message}`);
    }

    // Send email notification to guest
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/review-rejected`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({
        guestName: review.guest_name,
        guestEmail: review.users.email,
        rating: review.rating,
        reviewText: review.review_text,
        stayDates: review.stay_dates,
        rejectionReason: rejectionReason,
        resubmissionCount: newResubmissionCount,
        canResubmit: newResubmissionCount < MAX_REVIEW_RESUBMISSIONS,
        reviewId: review.id
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResult.success) {
      console.warn('Review rejected but email notification failed:', emailResult.error);
      // Don't fail the whole operation if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Review rejected successfully',
      emailSent: emailResult.success 
    });

  } catch (error) {
    console.error('Error rejecting review:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}