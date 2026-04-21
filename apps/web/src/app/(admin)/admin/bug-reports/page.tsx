import { requireAdmin } from '@/lib/admin-auth';
import AdminBugReportsView from '@/features/admin/AdminBugReportsView';

export default async function AdminBugReportsPage() {
  await requireAdmin();
  return <AdminBugReportsView />;
}
