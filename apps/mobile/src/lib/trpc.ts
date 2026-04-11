import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@appointly/api';

export const trpc = createTRPCReact<AppRouter>();

const API_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${API_URL}/api/trpc`,
      }),
    ],
  });
}
