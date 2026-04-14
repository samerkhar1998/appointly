import * as jose from 'jose';
import { db } from '@appointly/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
);

export interface AuthUser {
  id: string;
  email: string;
  global_role: string;
  salon_id?: string | undefined;
}

// Generic request shape — works with Next.js, Express, and fetch adapters
export interface ApiRequest {
  headers: {
    cookie?: string | undefined;
    authorization?: string | undefined;
  };
}

// Generic response shape
export interface ApiResponse {
  setHeader: (name: string, value: string) => void;
}

export interface Context {
  db: typeof db;
  user: AuthUser | null;
  res: ApiResponse;
}

async function getUserFromRequest(req: ApiRequest): Promise<AuthUser | null> {
  try {
    // Support both cookie-based auth (web) and Bearer token auth (mobile).
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      const cookies = parseCookies(req.headers.cookie ?? '');
      token = cookies['appointly_token'];
    }
    if (!token) return null;

    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    if (!payload['sub'] || typeof payload['sub'] !== 'string') return null;

    return {
      id: payload['sub'],
      email: typeof payload['email'] === 'string' ? payload['email'] : '',
      global_role: typeof payload['role'] === 'string' ? payload['role'] : 'CUSTOMER',
      salon_id: typeof payload['salon_id'] === 'string' ? payload['salon_id'] : undefined,
    };
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...rest] = c.trim().split('=');
      return [k?.trim() ?? '', rest.join('=').trim()];
    }),
  );
}

export async function createContext(opts: { req: ApiRequest; res: ApiResponse }): Promise<Context> {
  const user = await getUserFromRequest(opts.req);
  return {
    db,
    user,
    res: opts.res,
  };
}
