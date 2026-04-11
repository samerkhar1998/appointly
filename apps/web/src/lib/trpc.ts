import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@appointly/api';

export const trpc = createTRPCReact<AppRouter>();
