import { NextRequest, NextResponse } from 'next/server';
import { db } from '@appointly/db';
import { signJwt, buildAuthCookie } from '@/lib/jwt';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  error?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

// Exchanges an authorization code for tokens using Google's token endpoint.
// code: the OAuth authorization code from the query string
// redirectUri: the redirect URI registered with Google
// Returns the token response or throws on failure.
async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<GoogleTokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env['GOOGLE_CLIENT_ID'] ?? '',
      client_secret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  return res.json() as Promise<GoogleTokenResponse>;
}

// Fetches the authenticated user's profile from Google's userinfo endpoint.
// accessToken: a valid Google access token
// Returns the user's Google profile.
async function fetchGoogleUser(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json() as Promise<GoogleUserInfo>;
}

// Handles the Google OAuth callback:
// 1. Exchanges the code for tokens
// 2. Fetches the Google user profile
// 3. Upserts the user in the database (link by google_id, fallback to email)
// 4. Signs a JWT, sets the auth cookie, and redirects to the dashboard
export async function GET(request: NextRequest): Promise<NextResponse> {
  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
  const loginUrl = `${appUrl}/login`;
  const dashboardUrl = `${appUrl}/dashboard`;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${loginUrl}?error=google_denied`);
  }

  try {
    const redirectUri = `${appUrl}/api/auth/google/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    if (tokens.error || !tokens.access_token) {
      return NextResponse.redirect(`${loginUrl}?error=google_token_failed`);
    }

    const googleUser = await fetchGoogleUser(tokens.access_token);

    if (!googleUser.email_verified) {
      return NextResponse.redirect(`${loginUrl}?error=google_email_unverified`);
    }

    // Upsert: find by google_id first, then by email, then create new
    let user = await db.user.findUnique({ where: { google_id: googleUser.sub } });

    if (!user) {
      user = await db.user.findUnique({ where: { email: googleUser.email } });
      if (user) {
        // Link existing email account to Google
        user = await db.user.update({
          where: { id: user.id },
          data: { google_id: googleUser.sub },
        });
      }
    }

    if (!user) {
      user = await db.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          google_id: googleUser.sub,
          global_role: 'SALON_OWNER',
        },
      });
    }

    const member = await db.salonMember.findFirst({
      where: { user_id: user.id, is_active: true },
      orderBy: { created_at: 'asc' },
    });

    const token = await signJwt({
      sub: user.id,
      email: user.email,
      role: user.global_role,
      salon_id: member?.salon_id,
    });

    const response = NextResponse.redirect(dashboardUrl);
    response.headers.set('Set-Cookie', buildAuthCookie(token));
    return response;
  } catch {
    return NextResponse.redirect(`${loginUrl}?error=google_auth_failed`);
  }
}
