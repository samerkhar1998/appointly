import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJwt } from '@/lib/jwt';
import AdminSidebar from '@/features/admin/AdminSidebar';
import { Toaster } from '@/components/ui/toaster';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;

  // Determine if this is a public admin route (login / register)
  // We can't easily get the path here without a middleware, so we rely on
  // the child pages to call this layout only when needed.
  // The redirect-to-login logic is handled per-page via a shared helper.

  let adminUser: { sub: string; email: string; name?: string } | null = null;
  if (adminToken) {
    const payload = await verifyJwt(adminToken);
    if (payload && payload.role === 'SUPER_ADMIN') {
      adminUser = { sub: payload.sub, email: payload.email };
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50" dir="ltr">
      {adminUser && <AdminSidebar adminEmail={adminUser.email} />}
      <main className={`flex-1 overflow-auto ${adminUser ? 'ml-64' : ''}`}>
        {children}
      </main>
      <Toaster />
    </div>
  );
}
