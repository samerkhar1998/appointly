import { trpc } from './trpc';

export function useSalon() {
  const { data: me, isLoading } = trpc.auth.me.useQuery(undefined, { retry: false });
  const member = me?.salon_members[0];
  const salon = member?.salon ?? null;
  return { salon, isLoading, me };
}
