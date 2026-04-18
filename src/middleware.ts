import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Decodes a JWT token without signature verification.
 * Full cryptographic verification happens on the API side.
 * Returns the payload object or null if the token is malformed.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64url → Base64 → decode
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // atob is available in the Edge runtime used by Next.js middleware
    const json = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Extracts the user role from either the custom `sayless_token` cookie
 * or the NextAuth session-token cookie (both use JWTs with a `role` field).
 * Returns null when no valid token is found.
 */
function getRoleFromRequest(request: NextRequest): string | null {
  // 1. Custom app token (primary auth mechanism)
  const appToken = request.cookies.get('sayless_token')?.value;
  if (appToken) {
    const payload = decodeJwtPayload(appToken);
    if (payload?.role && typeof payload.role === 'string') {
      return payload.role;
    }
  }

  // 2. NextAuth session token (OAuth / credentials via NextAuth)
  //    Next.js uses __Secure- prefix in production (HTTPS), plain name otherwise.
  const nextAuthToken =
    request.cookies.get('__Secure-next-auth.session-token')?.value ??
    request.cookies.get('next-auth.session-token')?.value;

  if (nextAuthToken) {
    const payload = decodeJwtPayload(nextAuthToken);
    if (payload?.role && typeof payload.role === 'string') {
      return payload.role;
    }
    // NextAuth session token is encrypted (JWE) when using the default adapter,
    // but this project uses strategy: "jwt" with a plain HS256 JWT, so decoding
    // should succeed. If it fails (e.g. encrypted), treat the cookie's presence
    // as "authenticated but role unknown" — deny admin/company to be safe.
    if (payload === null && nextAuthToken.length > 0) {
      // Token exists but could not be decoded — deny access to protected routes.
      return null;
    }
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Determine which role group is required for this path
  const requiresAdmin = pathname.startsWith('/admin');
  const requiresCompany = pathname.startsWith('/company');

  if (!requiresAdmin && !requiresCompany) {
    // Not a protected route — let it through
    return NextResponse.next();
  }

  const role = getRoleFromRequest(request);

  if (requiresAdmin) {
    if (role === 'admin' || role === 'super_admin') {
      return NextResponse.next();
    }
    // No valid token or wrong role → redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (requiresCompany) {
    if (role === 'company') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/company/:path*'],
};
