import { requireAdmin } from '@/lib/admin-auth';
import AdminDisputesView from '@/features/admin/AdminDisputesView';

export default async function AdminDisputesPage() {
  await requireAdmin();
  return <AdminDisputesView />;
}
