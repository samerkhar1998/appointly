import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJwt } from './jwt';

export interface AdminUser {
  sub: string;
  email: string;
}

// Call at the top of every protected admin page server component.
// Redirects to /admin/login if no valid admin_token cookie is present.
export async function requireAdmin(): Promise<AdminUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  const payload = await verifyJwt(token);
  if (!payload || payload.role !== 'SUPER_ADMIN') redirect('/admin/login');

  return { sub: payload.sub, email: payload.email };
}
