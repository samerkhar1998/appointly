import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from '@appointly/api';
import type { NextRequest } from 'next/server';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
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
          setHeader: (_name: string, _value: string) => {
            // TODO: use NextResponse for Set-Cookie in fetch adapter
            // For mutations that set cookies, use a middleware approach instead
          },
        },
      }),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`tRPC error on ${path ?? '<no-path>'}:`, error);
          }
        : undefined,
  });

export { handler as GET, handler as POST };
