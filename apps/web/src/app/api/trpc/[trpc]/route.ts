import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { cookies } from 'next/headers';
import { appRouter, createContext } from '@appointly/api';
import type { NextRequest } from 'next/server';

// Handles all tRPC requests (GET for queries, POST for mutations).
// Passes a real cookie setter backed by next/headers so auth procedures
// can set httpOnly cookies (login, register, logout).
const handler = async (req: NextRequest) => {
  const cookieStore = await cookies();

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () =>
      createContext({
        req: {
          headers: {
            cookie: req.headers.get('cookie') ?? undefined,
          },
        },
        res: {
          // Routes the Set-Cookie header value produced by auth.router.ts
          // through Next.js's cookies API so the cookie is actually set.
          setHeader: (name: string, value: string) => {
            if (name !== 'Set-Cookie') return;
            // Parse the Set-Cookie string: "name=value; HttpOnly; Path=/; ..."
            const parts = value.split(';').map((s) => s.trim());
            const [nameValue, ...attrs] = parts;
            const eqIdx = (nameValue ?? '').indexOf('=');
            if (eqIdx === -1) return;
            const cookieName = nameValue!.slice(0, eqIdx);
            const cookieValue = nameValue!.slice(eqIdx + 1);

            const maxAgeAttr = attrs.find((a) => a.toLowerCase().startsWith('max-age='));
            const pathAttr = attrs.find((a) => a.toLowerCase().startsWith('path='));
            const sameSiteAttr = attrs.find((a) => a.toLowerCase().startsWith('samesite='));
            const httpOnly = attrs.some((a) => a.toLowerCase() === 'httponly');

            cookieStore.set(cookieName, cookieValue, {
              httpOnly,
              path: pathAttr?.split('=')[1] ?? '/',
              sameSite: (sameSiteAttr?.split('=')[1]?.toLowerCase() ?? 'lax') as
                | 'lax'
                | 'strict'
                | 'none',
              maxAge: maxAgeAttr ? parseInt(maxAgeAttr.split('=')[1] ?? '0', 10) : undefined,
              secure: process.env['NODE_ENV'] === 'production',
            });
          },
        },
      }),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            // eslint-disable-next-line no-console
            console.error(`tRPC error on ${path ?? '<no-path>'}:`, error);
          }
        : undefined,
  });
};

export { handler as GET, handler as POST };
