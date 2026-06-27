/**
 * =============================================================================
 * SERVER-SIDE AUTHENTICATION UTILITY
 * =============================================================================
 *
 * Extracts JWT from the Authorization header and verifies it server-side
 * using supabaseAdmin.auth.getUser(token). This is the correct pattern
 * for Next.js API routes (no browser session available on the server).
 *
 * Pattern follows the gold standard from api/admin/delete-user/route.ts.
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { supabaseAdmin } from './supabaseAdmin';
import { USER_ROLE } from '@/app/lib/constants/roles';

/** Compare two strings in constant time to prevent timing attacks */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still compare to avoid short-circuit timing leak
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export interface AuthenticatedUser {
  authId: string;       // Supabase auth UUID
  userId: string;       // Database users.id
  email: string;
  name: string;
  role: string;
  isSuperAdmin: boolean;
}

export type AuthSuccess = { success: true; user: AuthenticatedUser };
export type AuthFailure = { success: false; error: string; status: number };
export type AuthResult = AuthSuccess | AuthFailure;

export type InternalAuthResult =
  | { success: true; internal: true }
  | AuthSuccess
  | AuthFailure;

/**
 * Validates any authenticated user from the Authorization: Bearer <token> header.
 */
export async function validateAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Unauthorized - No token provided', status: 401 };
  }

  const accessToken = authHeader.replace('Bearer ', '');

  const { data: { user: authUser }, error: authError } =
    await supabaseAdmin.auth.getUser(accessToken);

  if (authError || !authUser) {
    return { success: false, error: 'Invalid or expired session', status: 401 };
  }

  const { data: dbUser, error: dbError } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, role, is_super_admin')
    .eq('auth_id', authUser.id)
    .single();

  if (dbError || !dbUser) {
    return { success: false, error: 'User not found', status: 401 };
  }

  return {
    success: true,
    user: {
      authId: authUser.id,
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.full_name,
      role: dbUser.role || USER_ROLE.USER,
      isSuperAdmin: dbUser.is_super_admin === true,
    },
  };
}

/**
 * Validates admin or staff access. Returns 403 if user is authenticated but lacks the role.
 */
export async function validateAdminAuth(request: NextRequest): Promise<AuthResult> {
  const result = await validateAuth(request);
  if (!result.success) return result;

  if (result.user.role !== USER_ROLE.ADMIN && result.user.role !== USER_ROLE.STAFF) {
    return { success: false, error: 'Admin or staff access required', status: 403 };
  }

  return result;
}

/**
 * For internal email/SMS routes: accepts either admin Bearer token OR x-internal-secret header.
 */
export async function validateInternalOrAdmin(request: NextRequest): Promise<InternalAuthResult> {
  // Check for internal API secret first (server-to-server calls)
  const internalSecret = request.headers.get('x-internal-secret');
  if (internalSecret && process.env.INTERNAL_API_SECRET && safeCompare(internalSecret, process.env.INTERNAL_API_SECRET)) {
    return { success: true, internal: true };
  }

  // Fall back to admin auth
  return validateAdminAuth(request);
}

/**
 * For cron/automated routes: checks x-cron-secret header, Vercel cron Authorization header, OR accepts admin auth.
 */
export async function validateCronOrAdmin(request: NextRequest): Promise<InternalAuthResult> {
  // Check for cron secret via x-cron-secret header
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret && process.env.CRON_SECRET && safeCompare(cronSecret, process.env.CRON_SECRET)) {
    return { success: true, internal: true };
  }

  // Check for Vercel cron Authorization: Bearer <CRON_SECRET> header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ') && process.env.CRON_SECRET) {
    const token = authHeader.replace('Bearer ', '');
    if (safeCompare(token, process.env.CRON_SECRET)) {
      return { success: true, internal: true };
    }
  }

  // Fall back to admin auth
  return validateAdminAuth(request);
}

/**
 * Helper to return a JSON error response from an AuthFailure.
 */
export function authErrorResponse(result: AuthFailure): NextResponse {
  return NextResponse.json(
    { success: false, error: result.error },
    { status: result.status }
  );
}
