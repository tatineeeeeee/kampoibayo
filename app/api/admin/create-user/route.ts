/**
 * =============================================================================
 * ADMIN USER CREATION API
 * =============================================================================
 *
 * POST /api/admin/create-user
 *
 * Creates a new staff or admin user via Supabase Auth admin API.
 * Generates a temporary password shown once to the creating admin.
 *
 * SECURITY:
 * - validateAdminAuth() ensures only authenticated admin/staff can reach this
 * - Additional check: staff role is explicitly blocked (only admin/super_admin)
 * - Only super_admin can create admin accounts
 * - Rate limited to 5 requests per minute per IP
 * - Rollback: if DB insert fails, the auth user is deleted to prevent orphans
 *
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/utils/supabaseAdmin';
import { validateAdminAuth, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';
import { checkRateLimit, getClientIp } from '@/app/utils/rateLimit';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTempPassword(length = 16): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%&*?';
  const all = upper + lower + digits + special;

  // Guarantee at least one of each category
  const required = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    special[crypto.randomInt(special.length)],
  ];

  // Fill the rest randomly
  const remaining = Array.from({ length: length - 4 }, () =>
    all[crypto.randomInt(all.length)]
  );

  // Fisher-Yates shuffle
  const combined = [...required, ...remaining];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join('');
}

function isValidPhilippinePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('09')) return true;
  if (cleaned.length === 12 && cleaned.startsWith('639')) return true;
  if (phone.startsWith('+63') && cleaned.length === 12) return true;
  return false;
}

function cleanPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+63' + cleaned.substring(1);
  } else if (cleaned.startsWith('63')) {
    cleaned = '+' + cleaned;
  } else if (cleaned.length === 10) {
    cleaned = '+63' + cleaned;
  }
  return cleaned;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 1. Auth validation
    const auth = await validateAdminAuth(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);

    // 2. Rate limiting
    const ip = getClientIp(request);
    if (!checkRateLimit(`create-user:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    // 3. Staff cannot create users — only admin/super_admin
    if (auth.user.role === 'staff') {
      return NextResponse.json(
        { success: false, error: 'Staff accounts cannot create users' },
        { status: 403 }
      );
    }

    // 4. Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, role } = body;

    // 5. Input validation
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !role) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, email, and role are required' },
        { status: 400 }
      );
    }

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedFirst.length > 50 || trimmedLast.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Names must be 50 characters or less' },
        { status: 400 }
      );
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 6. Role validation
    if (role !== 'staff' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Role must be 'staff' or 'admin'" },
        { status: 400 }
      );
    }

    // Only super admin can create admin accounts
    if (role === 'admin' && !auth.user.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only Super Admin can create administrator accounts' },
        { status: 403 }
      );
    }

    // 7. Phone validation (optional field)
    let cleanedPhone: string | null = null;
    if (phone && phone.trim()) {
      if (!isValidPhilippinePhone(phone.trim())) {
        return NextResponse.json(
          { success: false, error: 'Invalid Philippine phone number format. Use 09XX-XXX-XXXX' },
          { status: 400 }
        );
      }
      cleanedPhone = cleanPhone(phone.trim());
    }

    // 8. Check for existing user in database
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', trimmedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // 9. Generate temporary password
    const tempPassword = generateTempPassword();

    // 10. Create auth user via Supabase Admin API
    const fullName = `${trimmedFirst} ${trimmedLast}`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: trimmedEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: fullName },
    });

    if (authError) {
      console.error('Auth user creation error:', authError.message);

      if (authError.message?.includes('already') || authError.message?.includes('registered')) {
        return NextResponse.json(
          { success: false, error: 'This email is already registered in the system' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: `Failed to create user authentication: ${authError.message}` },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user - no user data returned' },
        { status: 500 }
      );
    }

    // 11. Insert into users table
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authData.user.id,
        full_name: fullName,
        email: trimmedEmail,
        phone: cleanedPhone,
        role: role,
        created_at: new Date().toISOString(),
      })
      .select('id, full_name, email, role')
      .single();

    if (insertError) {
      console.error('Users table insert error:', insertError.message);

      // Rollback: delete the auth user to prevent orphaned auth records
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (rollbackError) {
        console.error('Failed to rollback auth user:', rollbackError);
      }

      return NextResponse.json(
        { success: false, error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
    }

    // 12. Success
    return NextResponse.json({
      success: true,
      tempPassword,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
      },
    });

  } catch (error) {
    console.error('Create user unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
