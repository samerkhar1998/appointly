import { requireAdmin } from '@/lib/admin-auth';
import AdminDashboard from '@/features/admin/AdminDashboard';

export default async function AdminPage() {
  await requireAdmin();
  return <AdminDashboard />;
}
