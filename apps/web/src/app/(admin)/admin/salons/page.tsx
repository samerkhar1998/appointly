import { requireAdmin } from '@/lib/admin-auth';
import AdminSalonsView from '@/features/admin/AdminSalonsView';

export default async function AdminSalonsPage() {
  await requireAdmin();
  return <AdminSalonsView />;
}
