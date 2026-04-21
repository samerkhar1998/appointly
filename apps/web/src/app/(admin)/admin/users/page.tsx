import { requireAdmin } from '@/lib/admin-auth';
import AdminUsersView from '@/features/admin/AdminUsersView';

export default async function AdminUsersPage() {
  await requireAdmin();
  return <AdminUsersView />;
}
