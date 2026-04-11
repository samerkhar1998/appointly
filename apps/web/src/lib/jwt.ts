import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
);

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  salon_id?: string;
}

// Signs a JWT for the given user payload and returns the token string.
// Tokens are valid for 7 days and signed with HS256.
export async function signJwt(payload: JwtPayload): Promise<string> {
  return new jose.SignJWT({
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    salon_id: payload.salon_id,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// Builds the Set-Cookie header value for the appointly_token cookie.
// cookieValue: the signed JWT string
// Returns the full cookie header string.
export function buildAuthCookie(cookieValue: string): string {
  return `appointly_token=${cookieValue}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;
}

// Builds the Set-Cookie header value that clears the auth cookie.
export function buildClearAuthCookie(): string {
  return 'appointly_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0';
}

// Verifies a JWT and returns its payload, or null if invalid/expired.
// token: the raw JWT string from the cookie
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return {
      sub: payload['sub'] as string,
      email: payload['email'] as string,
      role: payload['role'] as string,
      salon_id: payload['salon_id'] as string | undefined,
    };
  } catch {
    return null;
  }
}
